from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db import models
from app.db.models import User
from app.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    print(f"DEBUG: [get_current_user] Raw Authorization Header: {auth_header}")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        print("DEBUG: [get_current_user] Missing or invalid Bearer header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session Expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session Expired. Please login again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            print("DEBUG: [get_current_user] Token sub is None")
            raise credentials_exception
    except jwt.PyJWTError as e:
        print(f"DEBUG: [get_current_user] JWT Decode Error: {e}")
        raise credentials_exception
        
    print(f"DEBUG: [get_current_user] Decoded sub={user_id}")
    stmt = select(User).where(User.id == int(user_id))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if user is None:
        print(f"DEBUG: [get_current_user] User ID {user_id} not found in DB")
        raise credentials_exception
    
    print(f"DEBUG: [get_current_user] User {user_id} validated")
    return user

class RequireRole:
    def __init__(self, required_role: str):
        self.required_role = required_role

    async def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role != self.required_role and current_user.role != "Admin":
            # Admin gets pass-through for everything, otherwise check exact role
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="You don't have enough permissions"
            )
        return current_user
