"""Task service: business logic for task CRUD and status management."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.models.audit_log import AuditLog


async def create_task(
    db: AsyncSession,
    user_id: str,
    input_text: str,
    title: str | None = None,
) -> Task:
    """Create a new task record."""
    if not title:
        # Auto-generate title from first 80 chars of input
        title = input_text[:80] + ("..." if len(input_text) > 80 else "")

    task = Task(
        user_id=user_id,
        title=title,
        input_text=input_text,
        status="pending",
    )
    db.add(task)

    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        task_id=task.id,
        action="task_created",
        details={"input_preview": input_text[:200]},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(task)
    return task


async def get_task(db: AsyncSession, task_id: str, user_id: str) -> Task | None:
    """Get a specific task by ID for a user."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def list_tasks(
    db: AsyncSession,
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
) -> tuple[list[Task], int]:
    """List tasks for a user with pagination."""
    query = select(Task).where(Task.user_id == user_id)

    if status_filter:
        query = query.where(Task.status == status_filter)

    # Get total count
    count_query = select(func.count()).select_from(
        query.subquery()
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Get paginated results
    query = query.order_by(desc(Task.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    tasks = list(result.scalars().all())

    return tasks, total


async def update_task_status(
    db: AsyncSession,
    task_id: str,
    status: str,
    result: str | None = None,
    error_message: str | None = None,
    agent_trace: dict | None = None,
    token_usage: dict | None = None,
    total_tokens: int = 0,
    total_cost: float = 0.0,
    latency_ms: int = 0,
) -> Task | None:
    """Update a task's status and results."""
    db_task = await db.execute(select(Task).where(Task.id == task_id))
    task = db_task.scalar_one_or_none()

    if not task:
        return None

    task.status = status
    if result is not None:
        task.result = result
    if error_message is not None:
        task.error_message = error_message
    if agent_trace is not None:
        task.agent_trace = agent_trace
    if token_usage is not None:
        task.token_usage = token_usage
    task.total_tokens = total_tokens
    task.total_cost = total_cost
    task.latency_ms = latency_ms

    if status in ("executing", "planning") and task.started_at is None:
        task.started_at = datetime.now(timezone.utc)
    if status in ("complete", "error"):
        task.completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(task)
    return task


async def cancel_task(db: AsyncSession, task_id: str, user_id: str) -> Task | None:
    """Cancel a running task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    if task.status in ("complete", "error", "cancelled"):
        return task  # Already in terminal state

    task.status = "cancelled"
    task.completed_at = datetime.now(timezone.utc)

    # Audit log
    audit = AuditLog(
        user_id=user_id,
        task_id=task_id,
        action="task_cancelled",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(task)
    return task
