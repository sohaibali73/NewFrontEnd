"""Content management routes for articles, documents, slides, and dashboards."""

from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from api.dependencies import get_current_user_id
from db.supabase_client import get_supabase

router = APIRouter(prefix="/content", tags=["Content"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ContentItem(BaseModel):
    title: str
    content: str
    content_type: str  # article, document, slide, dashboard
    status: str = "draft"  # draft, published, review
    tags: Optional[List[str]] = []

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None

# ============================================================================
# ARTICLES ENDPOINTS
# ============================================================================

@router.get("/articles")
async def get_articles(
    user_id: str = Depends(get_current_user_id),
    status: Optional[str] = None,
    limit: int = 50
):
    """Get user's articles."""
    db = get_supabase()
    
    query = db.table("content_items").select("*").eq("user_id", user_id).eq("content_type", "article")
    
    if status:
        query = query.eq("status", status)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data

@router.post("/articles")
async def create_article(
    article: ContentItem,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new article."""
    db = get_supabase()
    
    result = db.table("content_items").insert({
        "user_id": user_id,
        "title": article.title,
        "content": article.content,
        "content_type": "article",
        "status": article.status,
        "tags": article.tags,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    
    return result.data[0]

# ============================================================================
# BASIC ENDPOINTS FOR OTHER CONTENT TYPES
# ============================================================================

@router.get("/documents")
async def get_documents(user_id: str = Depends(get_current_user_id)):
    """Get user's documents."""
    db = get_supabase()
    result = db.table("content_items").select("*").eq("user_id", user_id).eq("content_type", "document").execute()
    return result.data

@router.get("/slides")
async def get_slides(user_id: str = Depends(get_current_user_id)):
    """Get user's slide decks."""
    db = get_supabase()
    result = db.table("content_items").select("*").eq("user_id", user_id).eq("content_type", "slide").execute()
    return result.data

@router.get("/dashboards")
async def get_dashboards(user_id: str = Depends(get_current_user_id)):
    """Get user's dashboards."""
    db = get_supabase()
    result = db.table("content_items").select("*").eq("user_id", user_id).eq("content_type", "dashboard").execute()
    return result.data