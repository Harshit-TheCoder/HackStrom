from sqlalchemy import Column, String, Boolean, Integer
from .database import Base

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
