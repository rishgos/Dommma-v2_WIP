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


@router.post("/login")
async def login_user(login_data: UserLogin):
    # Case-insensitive email lookup
    user = await db.users.find_one({"email": {"$regex": f"^{login_data.email}$", "$options": "i"}}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if 'email_verified' in user and not user.get('email_verified'):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in. Check your inbox for the verification link.")

    stored_password = user.get('password_hash') or user.get('password', '')
    if not verify_password(login_data.password, stored_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if 'password' in user and 'password_hash' not in user:
        await db.users.update_one(
            {"email": login_data.email},
            {"$set": {"password_hash": hash_password(login_data.password)}, "$unset": {"password": ""}}
        )

    return {"id": user.get('id'), "email": user.get('email'), "name": user.get('name'), "user_type": user.get('user_type')}


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
