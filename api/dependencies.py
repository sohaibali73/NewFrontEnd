"""FastAPI dependencies."""

from typing import Optional
from functools import lru_cache
from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError

from config import get_settings
from db import get_db

async def get_current_user_id(
    authorization: Optional[str] = Header(None)
) -> str:
    """Extract and validate user ID from JWT token."""

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    try:
        token = authorization.replace("Bearer ", "")
        settings = get_settings()

        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_user_api_keys_no_cache(user_id: str) -> dict:
    """Get user's API keys from database without caching (keys may be updated)."""
    db = get_db()

    result = db.table("users").select(
        "claude_api_key, tavily_api_key"
    ).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data[0]

    # Each user must use their own API keys - no fallback to server keys
    # This ensures proper usage tracking and billing per user
    return {
        "claude": user.get("claude_api_key") or "",
        "tavily": user.get("tavily_api_key") or "",
    }


@lru_cache(maxsize=1000)
def get_cached_api_keys(user_id: str) -> dict:
    """Get user's API keys from database with caching.

    DEPRECATED: Use get_user_api_keys_no_cache instead to ensure
    fresh API keys are retrieved after user updates them.
    """
    return get_user_api_keys_no_cache(user_id)


async def get_user_api_keys(user_id: str = Depends(get_current_user_id)) -> dict:
    """Get user's API keys from database.

    Each user must have their own Claude API key configured.
    Returns empty strings if not configured - routes should check and raise an error.
    """
    return get_user_api_keys_no_cache(user_id)
