"""FastAPI dependencies for authentication and user context."""

from typing import Optional, Dict, Any
from functools import lru_cache
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from config import get_settings
from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and validate user ID from Supabase JWT token.
    
    This validates the token with Supabase Auth and returns the user ID.
    Use this dependency when you only need the user ID.
    """
    token = credentials.credentials
    db = get_supabase()
    
    try:
        # Verify the JWT token with Supabase Auth
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
    Use this when you need user profile info but NOT API keys.
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
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get current user: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_encryption_key() -> str:
    """Get the encryption key from settings."""
    settings = get_settings()
    if not settings.encryption_key:
        raise HTTPException(
            status_code=500, 
            detail="Server encryption key not configured. Contact administrator."
        )
    return settings.encryption_key


async def get_user_api_keys(user_id: str) -> Dict[str, str]:
    """
    Get user's decrypted API keys from database.
    
    API keys are stored encrypted and decrypted on retrieval.
    Each user must have their own API keys configured.
    
    Args:
        user_id: The user's UUID
        
    Returns:
        Dict with 'claude' and 'tavily' keys (empty strings if not set)
    """
    db = get_supabase()
    encryption_key = get_encryption_key()
    
    try:
        # Use the database function to decrypt keys
        result = db.rpc(
            "get_user_api_keys",
            {
                "user_id": user_id,
                "encryption_key": encryption_key
            }
        ).execute()
        
        if result.data:
            return {
                "claude": result.data.get("claude") or "",
                "tavily": result.data.get("tavily") or "",
            }
    except Exception as e:
        logger.error(f"Failed to get user API keys: {e}")
    
    return {"claude": "", "tavily": ""}


def get_user_api_keys_no_cache(user_id: str) -> Dict[str, str]:
    """
    Get user's API keys from database without caching.
    
    This is a synchronous wrapper for backward compatibility.
    Keys are decrypted on retrieval.
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're in an async context, create a new loop
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, get_user_api_keys(user_id))
                return future.result()
        else:
            return loop.run_until_complete(get_user_api_keys(user_id))
    except Exception as e:
        logger.error(f"Failed to get user API keys: {e}")
        return {"claude": "", "tavily": ""}


@lru_cache(maxsize=1000)
def get_cached_api_keys(user_id: str) -> Dict[str, str]:
    """
    Get user's API keys from database with caching.

    DEPRECATED: Use get_user_api_keys instead to ensure
    fresh API keys are retrieved after user updates them.
    """
    return get_user_api_keys_no_cache(user_id)


async def get_user_with_api_keys(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user with decrypted API keys.
    
    Use this dependency when you need the user's API keys
    (e.g., for making API calls to Claude or Tavily).
    """
    user = await get_current_user(credentials)
    api_keys = await get_user_api_keys(user["id"])
    user["claude_api_key"] = api_keys["claude"]
    user["tavily_api_key"] = api_keys["tavily"]
    return user


async def verify_admin(user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """
    Verify the current user is an admin.
    
    Returns the user ID if admin, raises 403 otherwise.
    """
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user["id"]


# Backward compatibility - these are deprecated
async def get_current_user_id_legacy(
    authorization: Optional[str] = Header(None)
) -> str:
    """
    DEPRECATED: Use get_current_user_id instead.
    
    Extract and validate user ID from JWT token.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    token = authorization.replace("Bearer ", "")
    db = get_supabase()
    
    try:
        user = db.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user.id
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")