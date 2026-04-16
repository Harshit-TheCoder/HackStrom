import asyncio
import json
from datetime import datetime
from app.db.database import AsyncSessionLocal
from app.db.models import FleetLog
from app.schemas import AgentTrace
from app.core.ws import manager

class GlobalEventBus:
    def __init__(self):
        self.queue = asyncio.Queue()
        self._consumer_task = None

    async def start(self):
        if not self._consumer_task:
            self._consumer_task = asyncio.create_task(self._consume())

    async def publish(self, trace: AgentTrace):
        await self.queue.put(trace)
        # Broadcast immediately to frontend WebSocket clients
        await manager.broadcast(trace.model_dump())

    async def _consume(self):
        while True:
            trace: AgentTrace = await self.queue.get()
            try:
                # Store the event into SQLite Database
                async with AsyncSessionLocal() as db:
                    new_log = FleetLog(
                        shipment_id=trace.shipment_id or "SYSTEM",
                        agent_name=trace.agent_name,
                        status=trace.status,
                        logs=json.dumps(trace.logs),
                        timestamp=datetime.utcnow().isoformat()
                    )
                    db.add(new_log)
                    await db.commit()
            except Exception as e:
                print(f"Failed to persist log to DB: {e}")
            finally:
                self.queue.task_done()

event_bus = GlobalEventBus()
