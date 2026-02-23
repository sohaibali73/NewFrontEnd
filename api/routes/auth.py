"""Authentication routes using Supabase Auth with encrypted user data."""

import secrets
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
import logging

from config import get_settings
from db.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic Models
# ============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    name: Optional[str] = None
    nickname: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None

class APIKeyUpdate(BaseModel):
    claude_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordUpdate(BaseModel):
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    expires_in: int

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    nickname: Optional[str] = None
    is_admin: bool = False
    created_at: Optional[str] = None
    last_active_at: Optional[str] = None
    has_claude_key: bool = False
    has_tavily_key: bool = False


# ============================================================================
# Helper Functions
# ============================================================================

def get_encryption_key() -> str:
    """Get the encryption key from settings."""
    settings = get_settings()
    if not settings.encryption_key:
        raise HTTPException(
            status_code=500, 
            detail="Server encryption key not configured. Contact administrator."
        )
    return settings.encryption_key


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and validate user ID from Supabase JWT token.
    
    This validates the token with Supabase and returns the user ID.
    """
    token = credentials.credentials
    db = get_supabase()
    
    try:
        # Verify the JWT token with Supabase Auth
        # The supabase client automatically validates the JWT
        user = db.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return user.user.id
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user with full profile data.
    
    Returns user data from auth.users and user_profiles table.
    """
    token = credentials.credentials
    db = get_supabase()
    
    try:
        # Get user from Supabase Auth
        auth_user = db.auth.get_user(token)
        
        if not auth_user or not auth_user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = auth_user.user.id
        email = auth_user.user.email or ""
        
        # Get profile data from user_profiles table
        profile_result = db.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if not profile_result.data:
            # Profile doesn't exist - create it (should be auto-created by trigger)
            # But just in case, create it manually
            profile_data = {
                "id": user_id,
                "name": auth_user.user.user_metadata.get("name"),
                "nickname": auth_user.user.user_metadata.get("nickname", email.split("@")[0]),
            }
            db.table("user_profiles").insert(profile_data).execute()
            profile = profile_data
        else:
            profile = profile_result.data[0]
        
        return {
            "id": user_id,
            "email": email,
            "name": profile.get("name"),
            "nickname": profile.get("nickname"),
            "is_admin": profile.get("is_admin", False),
            "is_active": profile.get("is_active", True),
            "created_at": profile.get("created_at"),
            "last_active_at": profile.get("last_active_at"),
            "claude_api_key_encrypted": profile.get("claude_api_key_encrypted"),
            "tavily_api_key_encrypted": profile.get("tavily_api_key_encrypted"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get current user: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user_with_keys(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user with decrypted API keys.
    
    This should only be used by routes that need the actual API keys.
    """
    user = await get_current_user(credentials)
    
    # Decrypt API keys if they exist
    encryption_key = get_encryption_key()
    db = get_supabase()
    
    try:
        # Use the database function to decrypt keys
        result = db.rpc(
            "get_user_api_keys",
            {
                "user_id": user["id"],
                "encryption_key": encryption_key
            }
        ).execute()
        
        if result.data:
            user["claude_api_key"] = result.data.get("claude")
            user["tavily_api_key"] = result.data.get("tavily")
        else:
            user["claude_api_key"] = None
            user["tavily_api_key"] = None
    except Exception as e:
        logger.error(f"Failed to decrypt API keys: {e}")
        user["claude_api_key"] = None
        user["tavily_api_key"] = None
    
    return user


# ============================================================================
# Authentication Endpoints
# ============================================================================

@router.post("/register", response_model=Token)
async def register(data: UserRegister):
    """
    Register a new user using Supabase Auth.
    
    Creates the user in Supabase Auth and a profile in user_profiles table.
    The profile is auto-created via database trigger.
    """
    db = get_supabase()
    settings = get_settings()
    
    try:
        # Create user in Supabase Auth
        auth_response = db.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "name": data.name,
                    "nickname": data.nickname or data.email.split("@")[0],
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=400, 
                detail="Failed to create user. Email may already be registered."
            )
        
        # Check if email confirmation is required
        if not auth_response.session:
            # Email confirmation required
            return Token(
                access_token="",
                token_type="bearer",
                user_id=auth_response.user.id,
                email=data.email,
                expires_in=0  # Indicates email confirmation needed
            )
        
        # Update profile with additional data if needed
        if data.name or data.nickname:
            db.table("user_profiles").update({
                "name": data.name,
                "nickname": data.nickname or data.email.split("@")[0],
            }).eq("id", auth_response.user.id).execute()
        
        # Check if user should be admin
        admin_emails = settings.get_admin_emails()
        if data.email.lower() in admin_emails:
            db.table("user_profiles").update({"is_admin": True}).eq(
                "id", auth_response.user.id
            ).execute()
        
        return Token(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            user_id=auth_response.user.id,
            email=data.email,
            expires_in=auth_response.session.expires_in or 3600
        )
        
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {error_msg}")


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    """
    Login user using Supabase Auth.
    
    Returns JWT token for authenticated user.
    """
    db = get_supabase()
    
    try:
        # Sign in with Supabase Auth
        auth_response = db.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last active timestamp
        try:
            db.table("user_profiles").update({
                "last_active_at": datetime.utcnow().isoformat()
            }).eq("id", auth_response.user.id).execute()
        except Exception as e:
            logger.warning(f"Failed to update last_active_at: {e}")
        
        return Token(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            user_id=auth_response.user.id,
            email=data.email,
            expires_in=auth_response.session.expires_in or 3600
        )
        
    except Exception as e:
        error_msg = str(e)
        if "invalid login credentials" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid credentials")
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """
    Logout user.
    
    With Supabase Auth, logout is handled by invalidating the session
    on the client side. The server can also invalidate the refresh token.
    """
    db = get_supabase()
    
    try:
        # Sign out on the server side
        db.auth.sign_out()
    except Exception:
        pass  # Client-side token removal is sufficient
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info."""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user.get("name"),
        nickname=user.get("nickname"),
        is_admin=user.get("is_admin", False),
        created_at=user.get("created_at"),
        last_active_at=user.get("last_active_at"),
        has_claude_key=user.get("claude_api_key_encrypted") is not None,
        has_tavily_key=user.get("tavily_api_key_encrypted") is not None,
    )


@router.put("/me")
async def update_user(data: UserUpdate, user: dict = Depends(get_current_user)):
    """Update current user profile information."""
    db = get_supabase()
    
    update_data = {"updated_at": datetime.utcnow().isoformat()}
    if data.name is not None:
        update_data["name"] = data.name
    if data.nickname is not None:
        update_data["nickname"] = data.nickname
    
    result = db.table("user_profiles").update(update_data).eq("id", user["id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update user")
    
    return {"message": "User updated successfully"}


@router.put("/api-keys")
async def update_api_keys(
    data: APIKeyUpdate, 
    user: dict = Depends(get_current_user)
):
    """
    Update user's API keys.
    
    API keys are encrypted before storage using AES-256-GCM.
    """
    db = get_supabase()
    encryption_key = get_encryption_key()
    
    try:
        # Use the database function to encrypt and store keys
        db.rpc(
            "set_user_api_keys",
            {
                "user_id": user["id"],
                "claude_key": data.claude_api_key or "",
                "tavily_key": data.tavily_api_key or "",
                "encryption_key": encryption_key
            }
        ).execute()
        
        return {"message": "API keys updated successfully"}
        
    except Exception as e:
        logger.error(f"Failed to update API keys: {e}")
        raise HTTPException(status_code=500, detail="Failed to update API keys")


@router.get("/api-keys")
async def get_api_keys_status(user: dict = Depends(get_current_user)):
    """Get status of user's API keys (not the actual keys)."""
    return {
        "has_claude_key": user.get("claude_api_key_encrypted") is not None,
        "has_tavily_key": user.get("tavily_api_key_encrypted") is not None,
    }


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Refresh the access token.
    
    Uses the current valid token to get a new session.
    """
    db = get_supabase()
    token = credentials.credentials
    
    try:
        # Get the current session and refresh
        # Note: In Supabase, you typically use the refresh_token for this
        # But we can also just verify the current token is still valid
        user = db.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get a new session
        session = db.auth.get_session()
        
        if session:
            return Token(
                access_token=session.access_token,
                token_type="bearer",
                user_id=user.user.id,
                email=user.user.email or "",
                expires_in=session.expires_in or 3600
            )
        else:
            # Return the same token if we can't refresh
            return Token(
                access_token=token,
                token_type="bearer",
                user_id=user.user.id,
                email=user.user.email or "",
                expires_in=3600  # Approximate
            )
            
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/forgot-password")
async def forgot_password(
    data: PasswordResetRequest, 
    background_tasks: BackgroundTasks
):
    """
    Request password reset.
    
    Supabase Auth handles sending the reset email.
    """
    db = get_supabase()
    settings = get_settings()
    
    try:
        # Use Supabase's built-in password reset
        db.auth.reset_password_email(
            data.email,
            {
                "redirect_to": f"{settings.frontend_url}/reset-password"
            }
        )
    except Exception as e:
        # Don't reveal if email exists or not
        logger.info(f"Password reset requested for {data.email}: {e}")
    
    # Always return success to prevent email enumeration
    return {"message": "If this email is registered, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    data: PasswordUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Reset password using the token from reset email.
    
    The user clicks the link in the email, which redirects to the frontend
    with the token in the URL. The frontend then calls this endpoint.
    """
    db = get_supabase()
    token = credentials.credentials
    
    try:
        # First, set the session using the recovery token
        # The token from the email is actually an access token
        user = db.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid reset token")
        
        # Update the password
        db.auth.update_user({
            "password": data.new_password
        })
        
        return {"message": "Password reset successfully"}
        
    except Exception as e:
        logger.error(f"Password reset failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to reset password")


@router.put("/change-password")
async def change_password(
    data: PasswordUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Change password for logged-in user.
    """
    db = get_supabase()
    
    try:
        # Update user password
        db.auth.update_user({
            "password": data.new_password
        })
        
        return {"message": "Password changed successfully"}
        
    except Exception as e:
        logger.error(f"Password change failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to change password")


# ============================================================================
# Admin Endpoints
# ============================================================================

async def verify_admin(user: dict = Depends(get_current_user)) -> str:
    """Verify the current user is an admin."""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user["id"]


@router.get("/admin/users")
async def list_users(admin_id: str = Depends(verify_admin)):
    """List all users (admin only)."""
    db = get_supabase()
    
    try:
        # Use the admin_user_list view
        result = db.table("user_profiles").select(
            "id, name, nickname, is_admin, is_active, created_at, last_active_at"
        ).order("created_at", desc=True).execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        raise HTTPException(status_code=500, detail="Failed to list users")


@router.post("/admin/users/{user_id}/make-admin")
async def make_user_admin(
    user_id: str,
    admin_id: str = Depends(verify_admin)
):
    """Make a user an admin (admin only)."""
    db = get_supabase()
    
    result = db.table("user_profiles").update({"is_admin": True}).eq(
        "id", user_id
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {user_id} is now an admin"}


@router.post("/admin/users/{user_id}/revoke-admin")
async def revoke_admin(
    user_id: str,
    admin_id: str = Depends(verify_admin)
):
    """Revoke admin privileges (admin only)."""
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own admin privileges")
    
    db = get_supabase()
    
    result = db.table("user_profiles").update({"is_admin": False}).eq(
        "id", user_id
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Admin privileges revoked from user {user_id}"}


@router.post("/admin/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    admin_id: str = Depends(verify_admin)
):
    """Deactivate a user account (admin only)."""
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    db = get_supabase()
    
    result = db.table("user_profiles").update({"is_active": False}).eq(
        "id", user_id
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {user_id} deactivated"}


@router.post("/admin/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    admin_id: str = Depends(verify_admin)
):
    """Activate a user account (admin only)."""
    db = get_supabase()
    
    result = db.table("user_profiles").update({"is_active": True}).eq(
        "id", user_id
    ).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {user_id} activated"}