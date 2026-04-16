from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import IdempotentRequest
from typing import Optional, Any
import json

async def get_cached_request(db: AsyncSession, key: str, path: str, user_id: Optional[int] = None):
    query = select(IdempotentRequest).where(
        IdempotentRequest.idempotency_key == key,
        IdempotentRequest.path == path
    )
    if user_id:
        query = query.where(IdempotentRequest.user_id == user_id)
    
    result = await db.execute(query)
    cached = result.scalar_one_or_none()
    
    if cached:
        return cached.response_status, cached.response_body
    return None

async def save_request_result(
    db: AsyncSession, 
    key: str, 
    path: str, 
    status: int, 
    body: Any, 
    user_id: Optional[int] = None
):
    # Ensure body is serializable (handle dicts or lists)
    new_request = IdempotentRequest(
        idempotency_key=key,
        user_id=user_id,
        path=path,
        response_status=status,
        response_body=body
    )
    db.add(new_request)
    await db.commit()
