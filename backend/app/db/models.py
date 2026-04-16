from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON, ForeignKey
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    encrypted_email = Column(String, unique=True, index=True, nullable=False)
    encrypted_full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="User", nullable=False)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class FleetLog(Base):
    __tablename__ = "fleet_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(String, index=True, nullable=False)
    agent_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    logs = Column(String, nullable=False)  # JSON or comma separated string
    timestamp = Column(String, nullable=False)

class IdempotentRequest(Base):
    __tablename__ = "idempotent_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String, index=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    path = Column(String, nullable=False)
    response_status = Column(Integer, nullable=False)
    response_body = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
