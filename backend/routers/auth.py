"""Auth router - Registration, Login, Email Verification, Password Change"""
import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request, Body
from pydantic import BaseModel
from typing import Optional

from db import db
from services.auth_utils import hash_password, verify_password
from services.email import send_email, email_welcome, email_verification, generate_verification_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    user_type: str


class UserLogin(BaseModel):
    email: str
    password: str
    user_type: Optional[str] = None


@router.post("/register")
async def register_user(request: Request, user_data: UserCreate):
    # Normalize email to lowercase
    user_data.email = user_data.email.lower().strip()

    # Password strength validation
    import re
    pw = user_data.password
    if len(pw) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r'[A-Z]', pw):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', pw):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', pw):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', pw):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")

    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    import uuid
    verification_token = generate_verification_token()
    token_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name or user_data.email.split('@')[0],
        "user_type": user_data.user_type,
        "email_verified": False,
        "verification_token": verification_token,
        "verification_token_expires": token_expires,
        "password_hash": hash_password(user_data.password),
        "preferences": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)

    frontend_url = os.environ.get('FRONTEND_URL', '')
    origin = request.headers.get('origin', frontend_url).rstrip('/')
    verification_link = f"{origin}/verify-email?token={verification_token}"

    asyncio.create_task(send_email(
        user_data.email,
        "Verify your DOMMMA account",
        email_verification(user_doc["name"], verification_link)
    ))

    return {
        "message": "Registration successful! Please check your email to verify your account.",
        "email": user_data.email,
        "requires_verification": True
    }


# In-memory rate limiter (resets on server restart — use Redis for production)
_login_attempts = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@router.post("/login")
async def login_user(login_data: UserLogin, request: Request):
    email_lower = login_data.email.lower().strip()
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{email_lower}:{client_ip}"

    # Rate limiting — check if locked out
    if rate_key in _login_attempts:
        attempts, locked_until = _login_attempts[rate_key]
        if locked_until and datetime.now(timezone.utc) < locked_until:
            remaining = int((locked_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
            raise HTTPException(status_code=429, detail=f"Account temporarily locked. Too many failed attempts. Try again in {remaining} minutes.")
        # Reset if lockout expired
        if locked_until and datetime.now(timezone.utc) >= locked_until:
            _login_attempts[rate_key] = (0, None)

    # Case-insensitive email lookup
    user = await db.users.find_one({"email": {"$regex": f"^{email_lower}$", "$options": "i"}}, {"_id": 0})
    if not user:
        # Track failed attempt
        attempts = _login_attempts.get(rate_key, (0, None))[0] + 1
        locked = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES) if attempts >= MAX_LOGIN_ATTEMPTS else None
        _login_attempts[rate_key] = (attempts, locked)
        if locked:
            raise HTTPException(status_code=429, detail=f"Account locked after {MAX_LOGIN_ATTEMPTS} failed attempts. Try again in {LOCKOUT_MINUTES} minutes.")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if 'email_verified' in user and not user.get('email_verified'):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in. Check your inbox for the verification link.")

    stored_password = user.get('password_hash') or user.get('password', '')
    if not verify_password(login_data.password, stored_password):
        # Track failed attempt
        attempts = _login_attempts.get(rate_key, (0, None))[0] + 1
        locked = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES) if attempts >= MAX_LOGIN_ATTEMPTS else None
        _login_attempts[rate_key] = (attempts, locked)
        if locked:
            # Send lockout notification email
            try:
                lockout_html = f"""<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
                    <h2 style="color:#C62828;">Security Alert</h2>
                    <p>Hi {user.get('name', 'User')},</p>
                    <p>Your DOMMMA account has been temporarily locked due to {MAX_LOGIN_ATTEMPTS} failed login attempts.</p>
                    <p>If this wasn't you, we recommend changing your password immediately after the lockout expires in {LOCKOUT_MINUTES} minutes.</p>
                    <p>IP Address: {client_ip}</p>
                    <p>Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>
                    <p><a href="https://dommma.com/forgot-password">Reset Your Password</a></p>
                </div>"""
                asyncio.create_task(send_email(user.get('email'), "DOMMMA Security Alert: Account Locked", lockout_html))
            except Exception:
                pass
            raise HTTPException(status_code=429, detail=f"Account locked after {MAX_LOGIN_ATTEMPTS} failed attempts. Try again in {LOCKOUT_MINUTES} minutes. A security alert has been sent to your email.")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Successful login — clear rate limiter
    _login_attempts.pop(rate_key, None)

    if 'password' in user and 'password_hash' not in user:
        await db.users.update_one(
            {"email": email_lower},
            {"$set": {"password_hash": hash_password(login_data.password)}, "$unset": {"password": ""}}
        )

    # Record login session
    import uuid
    session_id = str(uuid.uuid4())
    await db.user_sessions.insert_one({
        "id": session_id,
        "user_id": user.get('id'),
        "ip": client_ip,
        "user_agent": request.headers.get('user-agent', 'unknown'),
        "login_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    })

    return {
        "id": user.get('id'),
        "email": user.get('email'),
        "name": user.get('name'),
        "user_type": user.get('user_type'),
        "session_id": session_id
    }


@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True)):
    """Send password reset email"""
    email_lower = email.lower().strip()
    user = await db.users.find_one({"email": {"$regex": f"^{email_lower}$", "$options": "i"}}, {"_id": 0})

    # Always return success to prevent email enumeration
    if not user:
        return {"status": "success", "message": "If an account exists with this email, a reset link has been sent."}

    reset_token = generate_verification_token()
    reset_expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    await db.users.update_one(
        {"email": {"$regex": f"^{email_lower}$", "$options": "i"}},
        {"$set": {"reset_token": reset_token, "reset_token_expires": reset_expires}}
    )

    reset_link = f"https://dommma.com/reset-password?token={reset_token}"
    reset_html = f"""<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
        <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:white;font-size:28px;margin:0;">DOMMMA</h1>
            <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Password Reset</p>
        </div>
        <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
            <h2 style="color:#1A2F3A;">Reset Your Password</h2>
            <p style="color:#555;">Hi {user.get('name', 'there')}, we received a request to reset your password.</p>
            <div style="text-align:center;margin:30px 0;">
                <a href="{reset_link}" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password</a>
            </div>
            <p style="color:#888;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
            <p style="color:#888;font-size:11px;margin-top:20px;">Or copy: {reset_link}</p>
        </div>
    </div>"""

    asyncio.create_task(send_email(user.get('email'), "DOMMMA: Reset Your Password", reset_html))
    return {"status": "success", "message": "If an account exists with this email, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...)):
    """Reset password using token from email"""
    import re
    # Validate new password strength
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r'[A-Z]', new_password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not re.search(r'[a-z]', new_password):
        raise HTTPException(status_code=400, detail="Password must contain a lowercase letter")
    if not re.search(r'[0-9]', new_password):
        raise HTTPException(status_code=400, detail="Password must contain a number")

    user = await db.users.find_one({"reset_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    expires = user.get('reset_token_expires')
    if expires:
        expires_dt = datetime.fromisoformat(expires.replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_dt:
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    await db.users.update_one(
        {"reset_token": token},
        {"$set": {"password_hash": hash_password(new_password)},
         "$unset": {"reset_token": "", "reset_token_expires": "", "password": ""}}
    )

    return {"status": "success", "message": "Password has been reset. You can now log in."}


@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    """Get active login sessions for a user"""
    sessions = await db.user_sessions.find(
        {"user_id": user_id, "active": True},
        {"_id": 0}
    ).sort("login_at", -1).to_list(20)
    return sessions


@router.post("/sessions/logout-all")
async def logout_all_sessions(user_id: str = Body(..., embed=True)):
    """Logout from all devices"""
    result = await db.user_sessions.update_many(
        {"user_id": user_id},
        {"$set": {"active": False, "logout_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success", "sessions_closed": result.modified_count}


@router.get("/verify-email")
async def verify_email(token: str):
    user = await db.users.find_one({"verification_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    token_expires = user.get('verification_token_expires')
    if token_expires:
        expires_dt = datetime.fromisoformat(token_expires.replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expires_dt:
            raise HTTPException(status_code=400, detail="Verification token has expired. Please request a new one.")

    await db.users.update_one(
        {"verification_token": token},
        {
            "$set": {"email_verified": True},
            "$unset": {"verification_token": "", "verification_token_expires": ""}
        }
    )

    asyncio.create_task(send_email(
        user['email'],
        "Welcome to DOMMMA!",
        email_welcome(user.get('name', 'User'), user.get('user_type', 'renter'))
    ))

    return {"message": "Email verified successfully! You can now log in.", "email": user['email']}


@router.post("/resend-verification")
async def resend_verification(request: Request, email: str = Body(..., embed=True)):
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If an account exists with this email, a verification link will be sent."}

    if user.get('email_verified'):
        raise HTTPException(status_code=400, detail="Email is already verified. You can log in.")

    verification_token = generate_verification_token()
    token_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    await db.users.update_one(
        {"email": email},
        {"$set": {"verification_token": verification_token, "verification_token_expires": token_expires}}
    )

    frontend_url = os.environ.get('FRONTEND_URL', '')
    origin = request.headers.get('origin', frontend_url).rstrip('/')
    verification_link = f"{origin}/verify-email?token={verification_token}"

    asyncio.create_task(send_email(
        email,
        "Verify your DOMMMA account",
        email_verification(user.get('name', 'User'), verification_link)
    ))

    return {"message": "Verification email sent! Please check your inbox."}


@router.post("/change-password")
async def change_password(user_id: str, current_password: str, new_password: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stored_password = user.get('password_hash') or user.get('password', '')
    if not verify_password(current_password, stored_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    hashed = hash_password(new_password)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": hashed}, "$unset": {"password": ""}}
    )
    return {"status": "password_changed"}
