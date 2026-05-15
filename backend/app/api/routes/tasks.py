"""Task API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, rate_limiter
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskListResponse
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limiter)],
)
async def create_task(
    task_data: TaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Submit a new task for agent processing."""
    task = await task_service.create_task(
        db=db,
        user_id=current_user.id,
        input_text=task_data.input_text,
        title=task_data.title,
    )

    # Dispatch to Celery worker
    try:
        from app.workers.celery_worker import execute_agent_task
        execute_agent_task.delay(task.id)
    except Exception:
        # If Celery is not available, update status to indicate
        await task_service.update_task_status(
            db=db,
            task_id=task.id,
            status="error",
            error_message="Task queue unavailable. Please try again later.",
        )

    return TaskResponse.model_validate(task)


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
):
    """List the current user's tasks with pagination."""
    tasks, total = await task_service.list_tasks(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
    )

    return TaskListResponse(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific task by ID."""
    task = await task_service.get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", response_model=TaskResponse)
async def cancel_task(
    task_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Cancel a running task."""
    task = await task_service.cancel_task(
        db=db, task_id=task_id, user_id=current_user.id
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return TaskResponse.model_validate(task)
