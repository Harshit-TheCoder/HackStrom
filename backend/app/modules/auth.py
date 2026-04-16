from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from app.db.database import get_db
from app.db.models import User
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    encrypt_pii,
    decrypt_pii
)
import random
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks
import threading

def send_mfa_email(target_email: str, otp: str):
    # ALWAYS print OTP to command line for fast hackathon testing
    print(f"\n[{target_email}] 🔒 Your MFA OTP is: {otp}\n")

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_EMAIL")
    smtp_pass = os.getenv("SMTP_PASSWORD")

    if not smtp_user or "your_email" in smtp_user:
        print(f"SMTP Mock: Email not configured, skipping actual email send.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = target_email
        msg['Subject'] = "Nexus Control Tower - MFA Required"
        
        body = f"""
        <html>
          <body>
            <h2>Nexus Access Verification</h2>
            <p>Your authorization code is:</p>
            <h1 style="letter-spacing: 5px; color: #0ea5e9;">{otp}</h1>
          </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=5)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"OTP successfully emailed to {target_email}")
    except Exception as e:
        print(f"Failed to send OTP email: {e}")

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class MFARequest(BaseModel):
    email: EmailStr
    otp: str

@router.post("/register")
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Sanitize
    email = user_in.email.strip().lower()
    encrypted_email = encrypt_pii(email)
    
    # Check if duplicate - Using direct DB query for reliability
    stmt = select(User)
    result = await db.execute(stmt)
    all_users = result.scalars().all()
    if any(decrypt_pii(u.encrypted_email) == email for u in all_users):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        encrypted_email=encrypted_email,
        encrypted_full_name=encrypt_pii(user_in.full_name) if user_in.full_name else None,
        hashed_password=get_password_hash(user_in.password),
        role="User",
        mfa_enabled=True 
    )
    db.add(new_user)
    await db.commit()
    return {"msg": "User created successfully. Please LOGIN to receive your MFA code via email."}

@router.post("/login")
async def login(user_in: UserLogin, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    email = user_in.email.strip().lower()
    
    # 🔍 Search for user
    result = await db.execute(select(User))
    all_users = result.scalars().all()
    user = next((u for u in all_users if decrypt_pii(u.encrypted_email) == email), None)
            
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    if user.mfa_enabled:
        otp = str(random.randint(100000, 999999))
        user.mfa_secret = otp
        print(f"DEBUG: Setting MFA secret for {email} to {otp}")
        await db.commit()
        await db.refresh(user) # ⬅️ Crucial: Ensure the object is synchronized with the DB
        
        # Queue real email sending
        threading.Thread(target=send_mfa_email, args=(email, otp), daemon=True).start()
        return {"msg": "MFA required", "mfa_pending": True}
        
    access_token = create_access_token(subject=user.id, roles=user.role)
    return {"access_token": access_token, "token_type": "bearer", "mfa_pending": False}

@router.post("/verify-mfa")
async def verify_mfa(mfa_in: MFARequest, db: AsyncSession = Depends(get_db)):
    email = mfa_in.email.strip().lower()
    otp_input = mfa_in.otp.strip()

    # 🔍 Find fresh user state from DB
    result = await db.execute(select(User))
    all_users = result.scalars().all()
    user = next((u for u in all_users if decrypt_pii(u.encrypted_email) == email), None)
    
    if not user:
        print(f"DEBUG: MFA failed - User {email} not found")
        raise HTTPException(status_code=401, detail="User not found")

    print(f"DEBUG: MFA Verification for {email}: Input='{otp_input}', Stored='{user.mfa_secret}'")
    
    if user.mfa_secret != otp_input:
        print(f"DEBUG: OTP mismatch! {user.mfa_secret} vs {otp_input}")
        raise HTTPException(status_code=401, detail="Invalid OTP")
        
    # clear OTP
    user.mfa_secret = None
    await db.commit()
    
    access_token = create_access_token(subject=user.id, roles=user.role)
    return {"access_token": access_token, "token_type": "bearer", "mfa_pending": False}

@router.post("/oauth/google")
async def google_oauth_login(token: str = Header(...), db: AsyncSession = Depends(get_db)):
    try:
        import json, base64
        payload = token.split(".")[1]
        decoded = json.loads(base64.urlsafe_b64decode(payload + "=="))
        email = decoded.get("email").strip().lower()
    except Exception:
        raise HTTPException(401, "Invalid Google Token")
        
    result = await db.execute(select(User))
    user = next((u for u in result.scalars().all() if decrypt_pii(u.encrypted_email) == email), None)
    
    if not user:
        user = User(
            encrypted_email=encrypt_pii(email),
            hashed_password=get_password_hash("oauth_stub"),
            role="User",
            mfa_enabled=False 
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(subject=user.id, roles=user.role)
    return {"access_token": access_token, "token_type": "bearer"}
