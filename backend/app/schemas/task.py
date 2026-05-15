"""Pydantic schemas for task-related API requests and responses."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    input_text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        examples=["Research the latest trends in AI and write a summary"],
    )
    title: str | None = Field(
        default=None,
        max_length=500,
        examples=["AI Trends Research"],
    )


class AgentEvent(BaseModel):
    """Schema for real-time agent activity events sent via WebSocket."""

    event_type: str  # agent_started, tool_called, agent_completed, step_update, error
    agent_name: str | None = None
    status: str | None = None  # planning, executing, reviewing, complete, error
    message: str | None = None
    tool_name: str | None = None
    tool_input: dict[str, Any] | None = None
    tool_output: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    metadata: dict[str, Any] | None = None


class TaskResponse(BaseModel):
    """Schema for task data in responses."""

    id: str
    user_id: str
    title: str
    input_text: str
    status: str
    result: str | None = None
    error_message: str | None = None
    agent_trace: dict[str, Any] | None = None
    token_usage: dict[str, Any] | None = None
    total_tokens: int = 0
    total_cost: float = 0.0
    latency_ms: int = 0
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Schema for paginated task list."""

    tasks: list[TaskResponse]
    total: int
    page: int
    page_size: int


class AnalyticsResponse(BaseModel):
    """Schema for analytics data."""

    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    total_tokens_used: int = 0
    total_cost: float = 0.0
    avg_latency_ms: float = 0.0
    tasks_by_status: dict[str, int] = {}
    daily_usage: list[dict[str, Any]] = []
    cost_by_model: dict[str, float] = {}
    agent_latencies: dict[str, float] = {}
