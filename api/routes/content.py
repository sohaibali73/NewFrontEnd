"""Content management routes for articles, documents, slides, and dashboards."""

from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from api.dependencies import get_current_user_id, get_user_api_keys
from db.supabase_client import get_supabase

router = APIRouter(prefix="/content", tags=["Content"])

# ============================================================================
# POTOMAC PPTX SKILL CONFIGURATION
# ============================================================================

POTOMAC_PPTX_SKILL_ID = "skill_01Aa2Us1EDWXRkrxg1PgqbaC"
POTOMAC_PPTX_SKILL_NAME = "potomac-pptx"

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

# ============================================================================
# CONTENT CHAT ENDPOINTS - Full CRUD + Streaming
# ============================================================================

@router.post("/chat")
async def content_chat_stream(
    message: dict,
    user_id: str = Depends(get_current_user_id)
):
    """Content creation chat with streaming support."""
    from fastapi.responses import StreamingResponse
    from core.claude_engine import ClaudeAFLEngine  # Reuse Claude engine
    import json
    
    text = message.get("text", "")
    content_type = message.get("contentType", "article")
    
    if not text:
        return {"error": "Message text required"}
    
    # Get user's API keys for Claude
    db = get_supabase()
    user_result = db.table("users").select("claude_api_key").eq("id", user_id).execute()
    if not user_result.data:
        return {"error": "User not found"}
    
    claude_key = user_result.data[0].get("claude_api_key")
    if not claude_key:
        return {"error": "Claude API key not configured"}
    
    async def generate_content_stream():
        """Stream content creation responses."""
        try:
            # Create specialized prompt based on content type
            prompts = {
                "slides": f"Create a professional slide deck outline for: {text}. Provide slide titles, bullet points, and speaker notes.",
                "articles": f"Write a comprehensive article about: {text}. Include an engaging introduction, main sections with headers, and a conclusion.",
                "documents": f"Draft a professional document about: {text}. Structure it with clear sections, executive summary, and recommendations.",
                "dashboards": f"Design a dashboard layout for: {text}. Describe widgets, charts, KPIs, and data sources needed."
            }
            
            prompt = prompts.get(content_type, f"Create content about: {text}")
            
            engine = ClaudeAFLEngine(api_key=claude_key, use_condensed_prompts=True)
            
            # Use Claude to generate content (simplified streaming)
            import anthropic
            client = anthropic.Anthropic(api_key=claude_key)
            
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            
            # Stream the response in chunks
            chunk_size = 50
            for i in range(0, len(content), chunk_size):
                chunk = content[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'text', 'text': chunk})}\n\n"
                
            # Final completion signal
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_content_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ============================================================================
# FULL CRUD ENDPOINTS FOR ALL CONTENT TYPES
# ============================================================================

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

@router.put("/articles/{item_id}")
async def update_article(
    item_id: str,
    update: ContentUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update an article."""
    db = get_supabase()
    
    # Verify ownership
    existing = db.table("content_items").select("user_id").eq("id", item_id).execute()
    if not existing.data or existing.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Article not found")
    
    update_data = {}
    if update.title is not None:
        update_data["title"] = update.title
    if update.content is not None:
        update_data["content"] = update.content
    if update.status is not None:
        update_data["status"] = update.status
    if update.tags is not None:
        update_data["tags"] = update.tags
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = db.table("content_items").update(update_data).eq("id", item_id).execute()
    return result.data[0]

@router.delete("/articles/{item_id}")
async def delete_article(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete an article."""
    db = get_supabase()
    
    # Verify ownership
    existing = db.table("content_items").select("user_id").eq("id", item_id).execute()
    if not existing.data or existing.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Article not found")
    
    db.table("content_items").delete().eq("id", item_id).execute()
    return {"status": "deleted"}

# ============================================================================
# DOCUMENTS CRUD
# ============================================================================

@router.post("/documents")
async def create_document(
    document: ContentItem,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new document."""
    db = get_supabase()
    
    result = db.table("content_items").insert({
        "user_id": user_id,
        "title": document.title,
        "content": document.content,
        "content_type": "document",
        "status": document.status,
        "tags": document.tags,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    
    return result.data[0]

@router.put("/documents/{item_id}")
async def update_document(
    item_id: str,
    update: ContentUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a document."""
    return await update_article(item_id, update, user_id)  # Same logic

@router.delete("/documents/{item_id}")
async def delete_document(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a document."""
    return await delete_article(item_id, user_id)  # Same logic

# ============================================================================
# SLIDES CRUD
# ============================================================================

@router.post("/slides")
async def create_slide_deck(
    slides: ContentItem,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new slide deck."""
    db = get_supabase()
    
    result = db.table("content_items").insert({
        "user_id": user_id,
        "title": slides.title,
        "content": slides.content,
        "content_type": "slide",
        "status": slides.status,
        "tags": slides.tags,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    
    return result.data[0]

@router.put("/slides/{item_id}")
async def update_slide_deck(
    item_id: str,
    update: ContentUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a slide deck."""
    return await update_article(item_id, update, user_id)  # Same logic

@router.delete("/slides/{item_id}")
async def delete_slide_deck(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a slide deck."""
    return await delete_article(item_id, user_id)  # Same logic

# ============================================================================
# DASHBOARDS CRUD
# ============================================================================

@router.post("/dashboards")
async def create_dashboard(
    dashboard: ContentItem,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new dashboard."""
    db = get_supabase()
    
    result = db.table("content_items").insert({
        "user_id": user_id,
        "title": dashboard.title,
        "content": dashboard.content,
        "content_type": "dashboard",
        "status": dashboard.status,
        "tags": dashboard.tags,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    
    return result.data[0]

@router.put("/dashboards/{item_id}")
async def update_dashboard(
    item_id: str,
    update: ContentUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a dashboard."""
    return await update_article(item_id, update, user_id)  # Same logic

@router.delete("/dashboards/{item_id}")
async def delete_dashboard(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a dashboard."""
    return await delete_article(item_id, user_id)  # Same logic

# ============================================================================
# WRITING STYLES MANAGEMENT
# ============================================================================

class WritingStyle(BaseModel):
    name: str
    tone: str = "professional"  # professional, casual, formal, creative
    formality: str = "medium"  # high, medium, low  
    personality_tags: Optional[List[str]] = []
    sample_text: Optional[str] = ""

@router.get("/styles")
async def get_writing_styles(user_id: str = Depends(get_current_user_id)):
    """Get user's writing styles."""
    db = get_supabase()
    result = db.table("writing_styles").select("*").eq("user_id", user_id).execute()
    return result.data

@router.post("/styles")
async def create_writing_style(
    style: WritingStyle,
    user_id: str = Depends(get_current_user_id)
):
    """Create a writing style."""
    db = get_supabase()
    
    result = db.table("writing_styles").insert({
        "user_id": user_id,
        "name": style.name,
        "tone": style.tone,
        "formality": style.formality,
        "personality_tags": style.personality_tags,
        "sample_text": style.sample_text,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    
    return result.data[0]

@router.put("/styles/{style_id}")
async def update_writing_style(
    style_id: str,
    style: WritingStyle,
    user_id: str = Depends(get_current_user_id)
):
    """Update a writing style."""
    db = get_supabase()
    
    # Verify ownership
    existing = db.table("writing_styles").select("user_id").eq("id", style_id).execute()
    if not existing.data or existing.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Style not found")
    
    result = db.table("writing_styles").update({
        "name": style.name,
        "tone": style.tone,
        "formality": style.formality,
        "personality_tags": style.personality_tags,
        "sample_text": style.sample_text,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", style_id).execute()
    
    return result.data[0]

@router.delete("/styles/{style_id}")
async def delete_writing_style(
    style_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a writing style."""
    db = get_supabase()
    
    # Verify ownership
    existing = db.table("writing_styles").select("user_id").eq("id", style_id).execute()
    if not existing.data or existing.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Style not found")
    
    db.table("writing_styles").delete().eq("id", style_id).execute()
    return {"status": "deleted"}


# ============================================================================
# SLIDES GENERATION WITH POTOMAC-PPTX SKILL
# ============================================================================

class SlideGenerateRequest(BaseModel):
    prompt: str
    title: Optional[str] = None
    slide_count: Optional[int] = 10


@router.post("/slides/generate")
async def generate_presentation(
    data: SlideGenerateRequest,
    user_id: str = Depends(get_current_user_id),
    api_keys: dict = Depends(get_user_api_keys),
):
    """
    Generate a Potomac-branded PPTX presentation using the potomac-pptx skill.
    Streams progress events and returns a download URL when complete.
    """
    claude_key = api_keys.get("claude")
    if not claude_key:
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    async def generate_stream():
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=claude_key)

            # Build the user prompt for the skill
            slide_count = data.slide_count or 10
            title = data.title or data.prompt[:60]
            user_prompt = (
                f"Create a professional Potomac-branded PowerPoint presentation titled '{title}'. "
                f"The presentation should have approximately {slide_count} slides. "
                f"Topic/content: {data.prompt}. "
                f"Apply strict Potomac brand compliance with the yellow (#FEC00F) and dark color scheme. "
                f"Include a title slide, agenda, content slides with data/charts where appropriate, and a closing slide."
            )

            yield f"data: {json.dumps({'type': 'status', 'message': 'Initializing Potomac PPTX skill...'})}\n\n"

            # Call Claude with the potomac-pptx skill
            response = client.beta.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8096,
                messages=[{"role": "user", "content": user_prompt}],
                betas=["skills-2025-05-14"],
                tools=[
                    {
                        "type": "skill",
                        "id": POTOMAC_PPTX_SKILL_ID,
                        "name": POTOMAC_PPTX_SKILL_NAME,
                    }
                ],
            )

            yield f"data: {json.dumps({'type': 'status', 'message': 'Skill executed, processing response...'})}\n\n"

            # Extract text and any tool results from the response
            presentation_id = None
            assistant_text = ""

            for block in response.content:
                if hasattr(block, "text"):
                    assistant_text += block.text
                elif hasattr(block, "type") and block.type == "tool_use":
                    # The skill may return a presentation_id or file reference
                    tool_result = block.input if hasattr(block, "input") else {}
                    if isinstance(tool_result, dict):
                        presentation_id = tool_result.get("presentation_id") or tool_result.get("file_id")

            # If the skill produced a presentation via the existing create_presentation tool path,
            # check the chat tools store for the presentation bytes
            if not presentation_id:
                # Try to extract presentation_id from assistant text
                import re
                match = re.search(r'presentation[_\s]?id[:\s]+([a-zA-Z0-9_-]+)', assistant_text, re.IGNORECASE)
                if match:
                    presentation_id = match.group(1)

            # Save the slide deck record to DB
            db = get_supabase()
            db.table("content_items").insert({
                "user_id": user_id,
                "title": title,
                "content": assistant_text,
                "content_type": "slide",
                "status": "complete",
                "tags": ["potomac-pptx", "ai-generated"],
                "created_at": datetime.utcnow().isoformat(),
            }).execute()

            # Build the download URL if we have a presentation_id
            download_url = None
            if presentation_id:
                download_url = f"/api/presentation/{presentation_id}"

            yield f"data: {json.dumps({'type': 'complete', 'text': assistant_text, 'presentation_id': presentation_id, 'download_url': download_url, 'title': title})}\n\n"

        except Exception as e:
            import traceback
            error_detail = f"{str(e)}\n{traceback.format_exc()[:300]}"
            yield f"data: {json.dumps({'type': 'error', 'error': str(e), 'detail': error_detail})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
