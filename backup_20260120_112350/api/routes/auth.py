"""Authentication routes."""

import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError

from config import get_settings
from db import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

def hash_password(password: str) -> str:
    """SHA256 password hashing with salt."""
    salt = "potomac_analyst_salt_2024"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    return hash_password(password) == hashed

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    nickname: Optional[str] = None
    claude_api_key: Optional[str]
    tavily_api_key: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str

def create_token(user_id: str, email: str) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def verify_token(token: str) -> dict:
    """Verify JWT token and return payload."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency to get current user ID from JWT token."""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id

@router.post("/register", response_model=Token)
async def register(data: UserRegister):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")

    # Check if exists
    existing = db.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    password_hash = hash_password(data.password)

    # Create user
    result = db.table("users").insert({
        "email": data.email,
        "password_hash": password_hash,
        "name": data.name,
        "nickname": data.nickname or data.email.split("@")[0],
        "claude_api_key": data.claude_api_key,
        "tavily_api_key": data.tavily_api_key or "",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = result.data[0]
    token = create_token(user["id"], data.email)

    return Token(access_token=token, user_id=user["id"], email=data.email)

@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")

    # Add debug logging
    print(f"Login attempt for: {data.email}")

    result = db.table("users").select("*").eq("email", data.email).execute()

    print(f"Users found: {len(result.data) if result.data else 0}")

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials - user not found")

    user = result.data[0]

    # Debug: print password comparison
    input_hash = hash_password(data.password)
    stored_hash = user.get("password_hash", "")
    print(f"Input password hash: {input_hash[:20]}...")
    print(f"Stored password hash: {stored_hash[:20]}...")
    print(f"Hashes match: {input_hash == stored_hash}")

    # Verify password
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials - wrong password")

    # Update last active
    try:
        db.table("users").update({"last_active": datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()
    except:
        pass  # Non-critical

    token = create_token(user["id"], data.email)

    return Token(access_token=token, user_id=user["id"], email=data.email)

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    """Get current user info from JWT token."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")

    result = db.table("users").select("id, email, name, nickname, created_at").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]
