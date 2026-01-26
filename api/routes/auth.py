"""Authentication routes with comprehensive user management."""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from jose import jwt, JWTError
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import get_settings
from db.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

def hash_password(password: str) -> str:
    """SHA256 password hashing with salt."""
    salt = "potomac_analyst_salt_2024"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    return hash_password(password) == hashed

def generate_reset_token() -> str:
    """Generate a secure reset token."""
    return secrets.token_urlsafe(32)

def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email using SMTP."""
    try:
        settings = get_settings()
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = settings.smtp_sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body to email
        msg.attach(MIMEText(body, 'html'))
        
        # Create SMTP session
        server = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
        server.starttls()  # Enable security
        server.login(settings.smtp_sender_email, settings.smtp_password)
        
        # Send email
        text = msg.as_string()
        server.sendmail(settings.smtp_sender_email, to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    name: Optional[str] = None
    nickname: Optional[str] = None
    claude_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    claude_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    expires_in: int

def create_token(user_id: str, email: str) -> Dict[str, Any]:
    """Create JWT token with expiration info."""
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": user_id, "email": email, "exp": expire}
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user_id,
        "email": email,
        "expires_in": settings.access_token_expire_minutes * 60
    }

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user with full user data."""
    user_id = await get_current_user_id(credentials)
    db = get_supabase()
    
    result = db.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return result.data[0]

@router.post("/register", response_model=Token)
async def register(data: UserRegister):
    """Register a new user."""
    db = get_supabase()
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
        "created_at": datetime.utcnow().isoformat(),
        "last_active": datetime.utcnow().isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = result.data[0]
    token_data = create_token(user["id"], data.email)

    return Token(**token_data)

@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    """Login user and return JWT token."""
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")

    # Get user
    result = db.table("users").select("*").eq("email", data.email).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials - user not found")

    user = result.data[0]

    # Verify password
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials - wrong password")

    # Update last active
    try:
        db.table("users").update({"last_active": datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()
    except Exception as e:
        print(f"Failed to update last_active: {e}")

    token_data = create_token(user["id"], data.email)

    return Token(**token_data)

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info from JWT token."""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "nickname": user.get("nickname"),
        "created_at": user.get("created_at"),
        "last_active": user.get("last_active"),
        "claude_api_key": user.get("claude_api_key"),
        "tavily_api_key": user.get("tavily_api_key"),
    }

@router.put("/me")
async def update_user(data: UserUpdate, user: dict = Depends(get_current_user)):
    """Update current user information."""
    db = get_supabase()
    
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.nickname is not None:
        update_data["nickname"] = data.nickname
    if data.claude_api_key is not None:
        update_data["claude_api_key"] = data.claude_api_key
    if data.tavily_api_key is not None:
        update_data["tavily_api_key"] = data.tavily_api_key
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("users").update(update_data).eq("id", user["id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update user")
    
    return {"message": "User updated successfully"}

@router.put("/change-password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    """Change user password."""
    db = get_supabase()
    
    # Verify current password
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_password_hash = hash_password(data.new_password)
    
    # Update password
    result = db.table("users").update({
        "password_hash": new_password_hash,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", user["id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Request password reset."""
    db = get_supabase()
    
    # Check if user exists
    result = db.table("users").select("*").eq("email", data.email).execute()
    
    if not result.data:
        # Don't reveal if email exists or not for security
        return {"message": "If this email is registered, a password reset link has been sent"}
    
    user = result.data[0]
    
    # Generate reset token
    reset_token = generate_reset_token()
    expires_at = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    
    # Store reset token
    db.table("password_resets").insert({
        "user_id": user["id"],
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False
    }).execute()
    
    # Send reset email
    reset_url = f"{get_settings().frontend_url}/reset-password?token={reset_token}"
    
    html_body = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <p><a href="{reset_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Potomac Analyst Team</p>
    </body>
    </html>
    """
    
    background_tasks.add_task(
        send_email,
        to_email=data.email,
        subject="Password Reset Request",
        body=html_body
    )
    
    return {"message": "If this email is registered, a password reset link has been sent"}

@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm):
    """Confirm password reset with token."""
    db = get_supabase()
    
    # Find reset token
    result = db.table("password_resets").select("*").eq("token", data.token).execute()
    
    if not result.data:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    reset_entry = result.data[0]
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(reset_entry["expires_at"].replace('Z', '+00:00'))
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Check if token is already used
    if reset_entry["used"]:
        raise HTTPException(status_code=400, detail="Reset token has already been used")
    
    # Hash new password
    new_password_hash = hash_password(data.new_password)
    
    # Update user password
    db.table("users").update({
        "password_hash": new_password_hash,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", reset_entry["user_id"]).execute()
    
    # Mark token as used
    db.table("password_resets").update({
        "used": True
    }).eq("id", reset_entry["id"]).execute()
    
    return {"message": "Password reset successfully"}

@router.post("/refresh-token")
async def refresh_token(user: dict = Depends(get_current_user)):
    """Refresh JWT token."""
    token_data = create_token(user["id"], user["email"])
    return Token(**token_data)

@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Logout user (client-side token removal)."""
    # In a stateless JWT system, logout is handled client-side
    # by removing the token. For enhanced security, you could
    # implement a token blacklist system here.
    return {"message": "Logged out successfully"}