"""FastAPI dependencies."""

from typing import Optional
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

async def get_user_api_keys(user_id: str = Depends(get_current_user_id)) -> dict:
    """Get user's API keys from database."""

    db = get_db()
    settings = get_settings()

    result = db.table("users").select(
        "claude_api_key, tavily_api_key"
    ).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data[0]

    return {
        "claude": user.get("claude_api_key") or settings.anthropic_api_key,
        "tavily": user.get("tavily_api_key") or settings.tavily_api_key,
    }
