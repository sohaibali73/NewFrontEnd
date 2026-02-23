"""FastAPI dependencies for authentication and user context."""

from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and validate user ID from Supabase JWT token.
    Returns the user ID (UUID string).
    """
    token = credentials.credentials
    db = get_supabase()

    try:
        user = db.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user.user.id
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user with full profile data from user_profiles table.
    Does NOT include API keys.
    """
    token = credentials.credentials
    db = get_supabase()

    try:
        auth_user = db.auth.get_user(token)
        if not auth_user or not auth_user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = auth_user.user.id
        email = auth_user.user.email or ""

        # Get profile from user_profiles
        profile_result = db.table("user_profiles").select(
            "id, name, nickname, is_admin, is_active, created_at, last_active_at, claude_api_key, tavily_api_key"
        ).eq("id", user_id).execute()

        if not profile_result.data:
            # Auto-create profile if trigger didn't fire
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
            # Include key presence flags (not the actual keys)
            "has_claude_key": bool(profile.get("claude_api_key")),
            "has_tavily_key": bool(profile.get("tavily_api_key")),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get current user: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_user_api_keys(user_id: str) -> Dict[str, str]:
    """
    Get user's API keys directly from user_profiles table.
    Keys are stored as plain text - no encryption needed.
    """
    db = get_supabase()

    try:
        result = db.table("user_profiles").select(
            "claude_api_key, tavily_api_key"
        ).eq("id", user_id).execute()

        if result.data:
            row = result.data[0]
            return {
                "claude": row.get("claude_api_key") or "",
                "tavily": row.get("tavily_api_key") or "",
            }
    except Exception as e:
        logger.error(f"Failed to get user API keys: {e}")

    return {"claude": "", "tavily": ""}


async def get_user_with_api_keys(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user with API keys.
    Use this dependency when you need the actual API keys.
    """
    user = await get_current_user(credentials)
    api_keys = await get_user_api_keys(user["id"])
    user["claude_api_key"] = api_keys["claude"]
    user["tavily_api_key"] = api_keys["tavily"]
    return user


async def verify_admin(user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """Verify the current user is an admin. Returns user ID."""
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user["id"]
