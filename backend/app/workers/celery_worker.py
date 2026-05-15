"""Celery worker for async agent task execution."""

import json
import logging
import time
from datetime import datetime, timezone

from celery import Celery
from redis import Redis

from app.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "agent_worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minute hard limit
    task_soft_time_limit=240,  # 4 minute soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)


def publish_event(redis_client: Redis, task_id: str, event: dict):
    """Publish an agent event to Redis pub/sub."""
    event["timestamp"] = datetime.now(timezone.utc).isoformat()
    channel = f"task:{task_id}"
    redis_client.publish(channel, json.dumps(event))
    logger.debug(f"Published event to {channel}: {event.get('event_type')}")


@celery_app.task(bind=True, name="execute_agent_task")
def execute_agent_task(self, task_id: str):
    """
    Celery task that executes the multi-agent pipeline for a given task.
    Publishes real-time events via Redis pub/sub.
    """
    logger.info(f"Starting agent execution for task: {task_id}")
    start_time = time.time()

    # Connect to Redis for pub/sub
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)

    # We need sync DB access for Celery (can't use async)
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.base import Base
    from app.models.task import Task

    # Convert async URL to sync
    sync_db_url = settings.database_url.replace("+asyncpg", "+psycopg2").replace("postgresql+psycopg2", "postgresql")
    sync_engine = create_engine(sync_db_url)

    try:
        with Session(sync_engine) as db:
            # Get task from DB
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                logger.error(f"Task {task_id} not found")
                return {"status": "error", "message": "Task not found"}

            # Update status to planning
            task.status = "planning"
            task.started_at = datetime.now(timezone.utc)
            db.commit()

            # Publish planning event
            publish_event(redis_client, task_id, {
                "event_type": "agent_started",
                "agent_name": "supervisor",
                "status": "planning",
                "message": "Supervisor is analyzing the task and creating a plan...",
            })

            # Run the agent pipeline
            from app.agents.graph import run_agent_task

            def step_callback(event_type: str, data: dict):
                """Callback for each agent step — publishes to Redis."""
                agent_name = data.get("agent_name", "unknown")
                status = data.get("status", "executing")
                node = data.get("node", "")

                event = {
                    "event_type": "step_update",
                    "agent_name": agent_name,
                    "status": status,
                    "message": f"{agent_name.title()} agent is working...",
                }

                if node == "planner":
                    event["message"] = "Plan created! Starting agent execution..."
                    event["event_type"] = "plan_created"
                elif node == "researcher":
                    event["message"] = "Research agent completed web search and analysis"
                    event["event_type"] = "agent_completed"
                elif node == "coder":
                    event["message"] = "Code agent finished writing and executing code"
                    event["event_type"] = "agent_completed"
                elif node == "reviewer":
                    event["message"] = "Review agent completed quality assessment"
                    event["event_type"] = "agent_completed"
                elif node == "aggregate":
                    event["message"] = "Supervisor aggregating final results..."
                    event["event_type"] = "aggregating"

                publish_event(redis_client, task_id, event)

            # Execute the agent graph
            result = run_agent_task(task.input_text, callback=step_callback)

            latency_ms = int((time.time() - start_time) * 1000)

            # Calculate token totals
            token_meta = result.get("metadata", {}).get("token_usage", {})
            total_tokens = sum(
                v.get("prompt_tokens", 0) + v.get("completion_tokens", 0)
                for v in token_meta.values()
            )
            # Rough cost estimate (GPT-4o-mini pricing)
            total_cost = total_tokens * 0.00000015  # ~$0.15 per 1M tokens

            # Update task in DB
            task.status = result.get("status", "complete")
            task.result = result.get("final_result", "")
            task.agent_trace = {
                "plan": result.get("plan", []),
                "agent_outputs": {
                    k: v[:5000] for k, v in result.get("agent_outputs", {}).items()
                },
            }
            task.token_usage = token_meta
            task.total_tokens = total_tokens
            task.total_cost = total_cost
            task.latency_ms = latency_ms
            task.completed_at = datetime.now(timezone.utc)
            db.commit()

            # Publish completion event
            publish_event(redis_client, task_id, {
                "event_type": "task_completed",
                "status": "complete",
                "message": "Task completed successfully!",
                "metadata": {
                    "total_tokens": total_tokens,
                    "total_cost": round(total_cost, 6),
                    "latency_ms": latency_ms,
                },
            })

            logger.info(
                f"Task {task_id} completed in {latency_ms}ms, "
                f"{total_tokens} tokens, ${total_cost:.6f}"
            )

            return {
                "status": "complete",
                "task_id": task_id,
                "total_tokens": total_tokens,
                "latency_ms": latency_ms,
            }

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}", exc_info=True)

        # Update DB with error
        try:
            with Session(sync_engine) as db:
                task = db.query(Task).filter(Task.id == task_id).first()
                if task:
                    task.status = "error"
                    task.error_message = str(e)
                    task.completed_at = datetime.now(timezone.utc)
                    task.latency_ms = int((time.time() - start_time) * 1000)
                    db.commit()
        except Exception as db_err:
            logger.error(f"Failed to update task error status: {db_err}")

        # Publish error event
        publish_event(redis_client, task_id, {
            "event_type": "task_error",
            "status": "error",
            "message": f"Task failed: {str(e)}",
        })

        return {"status": "error", "task_id": task_id, "error": str(e)}

    finally:
        redis_client.close()
        sync_engine.dispose()
