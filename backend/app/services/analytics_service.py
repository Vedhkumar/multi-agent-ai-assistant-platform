"""Analytics service: aggregated stats from task history."""

from datetime import datetime, timezone, timedelta
from typing import Any

from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


async def get_analytics(db: AsyncSession, user_id: str) -> dict[str, Any]:
    """Get aggregated analytics for a user."""

    # Total and status counts
    status_query = select(
        Task.status,
        func.count(Task.id).label("count"),
    ).where(Task.user_id == user_id).group_by(Task.status)

    result = await db.execute(status_query)
    status_rows = result.all()

    tasks_by_status = {row.status: row.count for row in status_rows}
    total_tasks = sum(tasks_by_status.values())
    completed_tasks = tasks_by_status.get("complete", 0)
    failed_tasks = tasks_by_status.get("error", 0)

    # Token usage and cost totals
    totals_query = select(
        func.coalesce(func.sum(Task.total_tokens), 0).label("total_tokens"),
        func.coalesce(func.sum(Task.total_cost), 0).label("total_cost"),
        func.coalesce(func.avg(Task.latency_ms), 0).label("avg_latency"),
    ).where(Task.user_id == user_id)

    result = await db.execute(totals_query)
    totals = result.one()

    # Daily usage for last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    daily_query = select(
        func.date(Task.created_at).label("date"),
        func.count(Task.id).label("tasks"),
        func.coalesce(func.sum(Task.total_tokens), 0).label("tokens"),
        func.coalesce(func.sum(Task.total_cost), 0).label("cost"),
    ).where(
        Task.user_id == user_id,
        Task.created_at >= thirty_days_ago,
    ).group_by(func.date(Task.created_at)).order_by(func.date(Task.created_at))

    result = await db.execute(daily_query)
    daily_rows = result.all()

    daily_usage = [
        {
            "date": str(row.date),
            "tasks": row.tasks,
            "tokens": row.tokens,
            "cost": float(row.cost),
        }
        for row in daily_rows
    ]

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "failed_tasks": failed_tasks,
        "total_tokens_used": int(totals.total_tokens),
        "total_cost": float(totals.total_cost),
        "avg_latency_ms": float(totals.avg_latency),
        "tasks_by_status": tasks_by_status,
        "daily_usage": daily_usage,
        "cost_by_model": {},  # Populated when agent traces are available
        "agent_latencies": {},  # Populated from agent trace data
    }
