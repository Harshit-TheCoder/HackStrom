import os
from datetime import datetime, timedelta
from typing import Any, Union
import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_secret_key_if_env_fails")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(subject: Union[str, Any], roles: str = "User", expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "roles": roles}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Data Encryption (PII)
FERNET_KEY = os.getenv("FERNET_ENCRYPTION_KEY")
if not FERNET_KEY:
    FERNET_KEY = Fernet.generate_key().decode() # Safe fallback for dev
fernet = Fernet(FERNET_KEY.encode())

def encrypt_pii(data: str) -> str:
    return fernet.encrypt(data.encode()).decode()

def decrypt_pii(encrypted_data: str) -> str:
    return fernet.decrypt(encrypted_data.encode()).decode()
