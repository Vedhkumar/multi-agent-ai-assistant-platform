"""WebSocket endpoint for real-time agent activity streaming."""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections per task."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, task_id: str, websocket: WebSocket):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)
        logger.info(f"WebSocket connected for task {task_id}")

    def disconnect(self, task_id: str, websocket: WebSocket):
        if task_id in self.active_connections:
            self.active_connections[task_id].remove(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]
        logger.info(f"WebSocket disconnected for task {task_id}")

    async def broadcast(self, task_id: str, message: dict):
        if task_id in self.active_connections:
            disconnected = []
            for ws in self.active_connections[task_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect(task_id, ws)


manager = ConnectionManager()


@router.websocket("/ws/tasks/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint that subscribes to Redis pub/sub for a specific task
    and forwards agent events to the connected client.
    """
    await manager.connect(task_id, websocket)

    redis_client = None
    pubsub = None

    try:
        # Connect to Redis pub/sub
        redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
        pubsub = redis_client.pubsub()
        channel = f"task:{task_id}"
        await pubsub.subscribe(channel)

        logger.info(f"Subscribed to Redis channel: {channel}")

        # Listen for messages
        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )
            if message and message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await websocket.send_json(data)

                    # If task is complete/error, close the connection
                    if data.get("event_type") in ("task_completed", "task_error"):
                        break
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON in Redis message: {message['data']}")

            # Also check for incoming messages from client (keep-alive, cancel, etc.)
            try:
                client_msg = await asyncio.wait_for(
                    websocket.receive_text(), timeout=0.1
                )
                if client_msg == "ping":
                    await websocket.send_json({"event_type": "pong"})
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from task {task_id}")
    except Exception as e:
        logger.error(f"WebSocket error for task {task_id}: {e}")
    finally:
        manager.disconnect(task_id, websocket)
        if pubsub:
            await pubsub.unsubscribe(f"task:{task_id}")
            await pubsub.close()
        if redis_client:
            await redis_client.close()
