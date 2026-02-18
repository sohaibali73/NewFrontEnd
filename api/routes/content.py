"""Content management routes for articles, documents, slides, and dashboards.

Includes:
- Full CRUD for articles, documents, slides, dashboards
- Background task processing for slide generation (potomac-pptx skill)
- Job status polling endpoint
- Graceful degradation when DB tables don't exist yet
"""

from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import uuid
import asyncio
import time
import logging

from api.dependencies import get_current_user_id, get_user_api_keys
from db.supabase_client import get_supabase

router = APIRouter(prefix="/content", tags=["Content"])
logger = logging.getLogger(__name__)

# ============================================================================
# POTOMAC PPTX SKILL CONFIGURATION
# ============================================================================

POTOMAC_PPTX_SKILL_ID = "skill_01Aa2Us1EDWXRkrxg1PgqbaC"
POTOMAC_PPTX_SKILL_NAME = "potomac-pptx"

# ============================================================================
# IN-MEMORY JOB STORE (survives within a single process; Railway single instance)
# For multi-instance deployments, move to Redis or Supabase job table.
# ============================================================================

_jobs: dict = {}  # job_id -> JobRecord dict


def _make_job(job_id: str, user_id: str, job_type: str, meta: dict) -> dict:
    record = {
        "id": job_id,
        "user_id": user_id,
        "type": job_type,
        "status": "pending",   # pending | running | complete | error
        "progress": 0,
        "message": "Queued…",
        "result": None,
        "error": None,
        "created_at": time.time(),
        "updated_at": time.time(),
        **meta,
    }
    _jobs[job_id] = record
    return record


def _update_job(job_id: str, **kwargs):
    if job_id in _jobs:
        _jobs[job_id].update(kwargs)
        _jobs[job_id]["updated_at"] = time.time()


# Prune jobs older than 2 hours to avoid memory leak
def _prune_old_jobs():
    cutoff = time.time() - 7200
    stale = [jid for jid, j in _jobs.items() if j.get("created_at", 0) < cutoff]
    for jid in stale:
        del _jobs[jid]


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ContentItem(BaseModel):
    title: str
    content: str = ""
    content_type: str  # article, document, slide, dashboard
    status: str = "draft"
    tags: Optional[List[str]] = []


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None


class WritingStyle(BaseModel):
    name: str
    tone: str = "professional"
    formality: str = "medium"
    personality_tags: Optional[List[str]] = []
    sample_text: Optional[str] = ""


class SlideGenerateRequest(BaseModel):
    prompt: str
    title: Optional[str] = None
    slide_count: Optional[int] = 10


class ContentChatRequest(BaseModel):
    text: str
    contentType: str = "article"


# ============================================================================
# HELPER: safe DB operations (gracefully handles missing tables)
# ============================================================================

def _safe_insert(db, table: str, data: dict):
    try:
        return db.table(table).insert(data).execute()
    except Exception as e:
        logger.warning(f"_safe_insert({table}) failed: {e}")
        return None


def _safe_select(db, table: str, filters: dict, limit: int = 50):
    try:
        q = db.table(table).select("*")
        for k, v in filters.items():
            q = q.eq(k, v)
        return q.order("created_at", desc=True).limit(limit).execute().data
    except Exception as e:
        logger.warning(f"_safe_select({table}) failed: {e}")
        return []


def _safe_update(db, table: str, item_id: str, data: dict):
    try:
        return db.table(table).update(data).eq("id", item_id).execute()
    except Exception as e:
        logger.warning(f"_safe_update({table}) failed: {e}")
        return None


def _safe_delete(db, table: str, item_id: str):
    try:
        db.table(table).delete().eq("id", item_id).execute()
        return True
    except Exception as e:
        logger.warning(f"_safe_delete({table}) failed: {e}")
        return False


# ============================================================================
# GENERIC CONTENT CRUD HELPERS
# ============================================================================

def _verify_ownership(db, table: str, item_id: str, user_id: str):
    """Raise 404 if item doesn't exist or belongs to another user."""
    try:
        result = db.table(table).select("user_id").eq("id", item_id).execute()
        if not result.data or result.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Item not found")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Item not found")


# ============================================================================
# ARTICLES ENDPOINTS
# ============================================================================

@router.get("/articles")
async def get_articles(
    user_id: str = Depends(get_current_user_id),
    status: Optional[str] = None,
    limit: int = 50,
):
    db = get_supabase()
    try:
        q = db.table("content_items").select("*").eq("user_id", user_id).eq("content_type", "article")
        if status:
            q = q.eq("status", status)
        return q.order("created_at", desc=True).limit(limit).execute().data
    except Exception:
        return []


@router.post("/articles")
async def create_article(article: ContentItem, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    row = {
        "user_id": user_id,
        "title": article.title,
        "content": article.content,
        "content_type": "article",
        "status": article.status,
        "tags": article.tags or [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = _safe_insert(db, "content_items", row)
    if result and result.data:
        return result.data[0]
    return {"id": str(uuid.uuid4()), **row, "_local": True}


@router.put("/articles/{item_id}")
async def update_article(
    item_id: str, update: ContentUpdate, user_id: str = Depends(get_current_user_id)
):
    db = get_supabase()
    _verify_ownership(db, "content_items", item_id, user_id)
    patch = {k: v for k, v in update.dict().items() if v is not None}
    patch["updated_at"] = datetime.utcnow().isoformat()
    result = _safe_update(db, "content_items", item_id, patch)
    return result.data[0] if result and result.data else {"id": item_id, **patch}


@router.delete("/articles/{item_id}")
async def delete_article(item_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    _verify_ownership(db, "content_items", item_id, user_id)
    _safe_delete(db, "content_items", item_id)
    return {"status": "deleted"}


# ============================================================================
# DOCUMENTS ENDPOINTS
# ============================================================================

@router.get("/documents")
async def get_documents(user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    return _safe_select(db, "content_items", {"user_id": user_id, "content_type": "document"})


@router.post("/documents")
async def create_document(document: ContentItem, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    row = {
        "user_id": user_id,
        "title": document.title,
        "content": document.content,
        "content_type": "document",
        "status": document.status,
        "tags": document.tags or [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = _safe_insert(db, "content_items", row)
    if result and result.data:
        return result.data[0]
    return {"id": str(uuid.uuid4()), **row, "_local": True}


@router.put("/documents/{item_id}")
async def update_document(
    item_id: str, update: ContentUpdate, user_id: str = Depends(get_current_user_id)
):
    return await update_article(item_id, update, user_id)


@router.delete("/documents/{item_id}")
async def delete_document(item_id: str, user_id: str = Depends(get_current_user_id)):
    return await delete_article(item_id, user_id)


# ============================================================================
# SLIDES ENDPOINTS (stored records)
# ============================================================================

@router.get("/slides")
async def get_slides(user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    return _safe_select(db, "content_items", {"user_id": user_id, "content_type": "slide"})


@router.post("/slides")
async def create_slide_record(slides: ContentItem, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    row = {
        "user_id": user_id,
        "title": slides.title,
        "content": slides.content,
        "content_type": "slide",
        "status": slides.status,
        "tags": slides.tags or [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = _safe_insert(db, "content_items", row)
    if result and result.data:
        return result.data[0]
    return {"id": str(uuid.uuid4()), **row, "_local": True}


@router.put("/slides/{item_id}")
async def update_slide(
    item_id: str, update: ContentUpdate, user_id: str = Depends(get_current_user_id)
):
    return await update_article(item_id, update, user_id)


@router.delete("/slides/{item_id}")
async def delete_slide(item_id: str, user_id: str = Depends(get_current_user_id)):
    return await delete_article(item_id, user_id)


# ============================================================================
# DASHBOARDS ENDPOINTS
# ============================================================================

@router.get("/dashboards")
async def get_dashboards(user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    return _safe_select(db, "content_items", {"user_id": user_id, "content_type": "dashboard"})


@router.post("/dashboards")
async def create_dashboard(dashboard: ContentItem, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    row = {
        "user_id": user_id,
        "title": dashboard.title,
        "content": dashboard.content,
        "content_type": "dashboard",
        "status": dashboard.status,
        "tags": dashboard.tags or [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = _safe_insert(db, "content_items", row)
    if result and result.data:
        return result.data[0]
    return {"id": str(uuid.uuid4()), **row, "_local": True}


@router.put("/dashboards/{item_id}")
async def update_dashboard(
    item_id: str, update: ContentUpdate, user_id: str = Depends(get_current_user_id)
):
    return await update_article(item_id, update, user_id)


@router.delete("/dashboards/{item_id}")
async def delete_dashboard(item_id: str, user_id: str = Depends(get_current_user_id)):
    return await delete_article(item_id, user_id)


# ============================================================================
# BACKGROUND SLIDE GENERATION — async job system
# ============================================================================

async def _run_slide_generation(job_id: str, user_id: str, prompt: str, title: str, slide_count: int, claude_key: str):
    """
    Background task: call Claude with potomac-pptx skill, persist result, update job status.
    Runs in FastAPI's threadpool via asyncio.to_thread.
    """
    _update_job(job_id, status="running", progress=10, message="Calling Potomac PPTX skill…")

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=claude_key)

        user_prompt = (
            f"Create a professional Potomac-branded PowerPoint presentation titled '{title}'. "
            f"The presentation should have approximately {slide_count} slides. "
            f"Topic/content: {prompt}. "
            f"Apply strict Potomac brand compliance with the yellow (#FEC00F) and dark color scheme. "
            f"Include a title slide, agenda, content slides with data/charts where appropriate, and a closing slide."
        )

        _update_job(job_id, progress=25, message="Generating slides with AI…")

        def _call_claude():
            return client.beta.messages.create(
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

        response = await asyncio.to_thread(_call_claude)
        _update_job(job_id, progress=70, message="Processing response…")

        # Extract text and presentation_id from response
        presentation_id = None
        assistant_text = ""

        for block in response.content:
            if hasattr(block, "text"):
                assistant_text += block.text
            elif hasattr(block, "type") and block.type == "tool_use":
                tool_result = block.input if hasattr(block, "input") else {}
                if isinstance(tool_result, dict):
                    presentation_id = tool_result.get("presentation_id") or tool_result.get("file_id")

        if not presentation_id:
            import re
            match = re.search(r'presentation[_\s]?id[:\s]+([a-zA-Z0-9_-]+)', assistant_text, re.IGNORECASE)
            if match:
                presentation_id = match.group(1)

        _update_job(job_id, progress=85, message="Saving to database…")

        # Persist to Supabase
        db = get_supabase()
        db_row = {
            "user_id": user_id,
            "title": title,
            "content": assistant_text,
            "content_type": "slide",
            "status": "complete",
            "tags": ["potomac-pptx", "ai-generated"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        if presentation_id:
            db_row["metadata"] = {"presentation_id": presentation_id}

        saved = _safe_insert(db, "content_items", db_row)
        saved_id = saved.data[0]["id"] if saved and saved.data else str(uuid.uuid4())

        download_url = f"/api/presentation/{presentation_id}" if presentation_id else None

        _update_job(
            job_id,
            status="complete",
            progress=100,
            message="Done!",
            result={
                "id": saved_id,
                "title": title,
                "content": assistant_text,
                "presentation_id": presentation_id,
                "download_url": download_url,
                "slide_count": slide_count,
                "status": "complete",
                "updatedAt": "just now",
                "filename": f"{title}.pptx",
            },
        )

    except Exception as e:
        logger.error(f"Slide generation job {job_id} failed: {e}", exc_info=True)
        _update_job(job_id, status="error", progress=0, message="Generation failed", error=str(e))


@router.post("/slides/generate")
async def generate_presentation(
    data: SlideGenerateRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    api_keys: dict = Depends(get_user_api_keys),
):
    """
    Start an async slide generation job.
    Returns job_id immediately — poll /content/jobs/{job_id} for status.
    Also streams SSE progress so existing frontend code keeps working.
    """
    claude_key = api_keys.get("claude")
    if not claude_key:
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    _prune_old_jobs()

    slide_count = data.slide_count or 10
    title = data.title or data.prompt[:60]
    job_id = str(uuid.uuid4())

    _make_job(job_id, user_id, "slide_generation", {"title": title, "prompt": data.prompt, "slide_count": slide_count})

    # Kick off background task
    background_tasks.add_task(
        _run_slide_generation, job_id, user_id, data.prompt, title, slide_count, claude_key
    )

    # Stream SSE progress so the existing CreationChatModal keeps working
    async def _sse_stream():
        yield f"data: {json.dumps({'type': 'status', 'job_id': job_id, 'message': 'Job started, processing in background…'})}\n\n"

        max_wait = 180  # 3 min timeout
        poll_interval = 2
        elapsed = 0

        while elapsed < max_wait:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            job = _jobs.get(job_id, {})
            status = job.get("status", "pending")
            progress = job.get("progress", 0)
            message = job.get("message", "Processing…")

            yield f"data: {json.dumps({'type': 'status', 'job_id': job_id, 'status': status, 'progress': progress, 'message': message})}\n\n"

            if status == "complete":
                result = job.get("result", {})
                yield f"data: {json.dumps({'type': 'complete', 'job_id': job_id, **result})}\n\n"
                return

            if status == "error":
                yield f"data: {json.dumps({'type': 'error', 'job_id': job_id, 'error': job.get('error', 'Unknown error')})}\n\n"
                return

        # Timeout — tell frontend to poll via job endpoint
        yield f"data: {json.dumps({'type': 'timeout', 'job_id': job_id, 'message': 'Still processing. Poll /content/jobs/' + job_id + ' for result.'})}\n\n"

    return StreamingResponse(
        _sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


# ============================================================================
# JOB STATUS POLLING ENDPOINT
# ============================================================================

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, user_id: str = Depends(get_current_user_id)):
    """Poll background job status. Returns current status, progress, and result when done."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired")
    if job.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "job_id": job_id,
        "type": job.get("type"),
        "status": job.get("status"),
        "progress": job.get("progress", 0),
        "message": job.get("message", ""),
        "result": job.get("result"),
        "error": job.get("error"),
        "title": job.get("title"),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at"),
    }


@router.get("/jobs")
async def list_jobs(user_id: str = Depends(get_current_user_id)):
    """List all active jobs for the current user."""
    _prune_old_jobs()
    user_jobs = [
        {
            "job_id": jid,
            "type": j.get("type"),
            "status": j.get("status"),
            "progress": j.get("progress", 0),
            "message": j.get("message", ""),
            "title": j.get("title"),
            "created_at": j.get("created_at"),
        }
        for jid, j in _jobs.items()
        if j.get("user_id") == user_id
    ]
    return {"jobs": sorted(user_jobs, key=lambda x: x.get("created_at", 0), reverse=True)}


# ============================================================================
# CONTENT CHAT — streaming generation for non-slide content
# ============================================================================

@router.post("/chat")
async def content_chat_stream(
    message: ContentChatRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    api_keys: dict = Depends(get_user_api_keys),
):
    """Stream content generation for articles, documents, dashboards. Auto-persists when done."""
    claude_key = api_keys.get("claude")
    if not claude_key:
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    text = message.text
    content_type = message.contentType

    prompts = {
        "slides": f"Create a detailed slide deck outline for: {text}. Provide slide titles, bullet points, and speaker notes.",
        "articles": f"Write a comprehensive, well-structured article about: {text}. Include an engaging introduction, detailed sections with subheadings, key insights, and a conclusion.",
        "documents": f"Draft a professional document about: {text}. Structure it with an executive summary, clear sections, recommendations, and appendices if needed.",
        "dashboards": f"Design a detailed dashboard specification for: {text}. Describe widgets, charts, KPIs, data sources, layout, and refresh intervals.",
    }
    prompt = prompts.get(content_type, f"Create professional content about: {text}")

    async def _stream():
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=claude_key)

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}],
            )
            full_content = response.content[0].text

            # Stream in chunks for real-time feel
            chunk_size = 60
            for i in range(0, len(full_content), chunk_size):
                chunk = full_content[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'text', 'text': chunk})}\n\n"
                await asyncio.sleep(0.01)

            # Persist to DB in background
            db = get_supabase()
            _safe_insert(db, "content_items", {
                "user_id": user_id,
                "title": text[:80],
                "content": full_content,
                "content_type": content_type.rstrip("s"),  # articles -> article
                "status": "complete",
                "tags": ["ai-generated"],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            })

            yield f"data: {json.dumps({'type': 'complete', 'content': full_content, 'title': text[:80]})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


# ============================================================================
# ALL CONTENT — combined listing for dashboard
# ============================================================================

@router.get("/all")
async def get_all_content(user_id: str = Depends(get_current_user_id), limit: int = 100):
    """Get all content items for the current user (for dashboard/search)."""
    db = get_supabase()
    try:
        result = (
            db.table("content_items")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data
    except Exception:
        return []


# ============================================================================
# WRITING STYLES MANAGEMENT
# ============================================================================

@router.get("/styles")
async def get_writing_styles(user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    try:
        return db.table("writing_styles").select("*").eq("user_id", user_id).execute().data
    except Exception:
        return []


@router.post("/styles")
async def create_writing_style(style: WritingStyle, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    row = {
        "user_id": user_id,
        "name": style.name,
        "tone": style.tone,
        "formality": style.formality,
        "personality_tags": style.personality_tags or [],
        "sample_text": style.sample_text or "",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = _safe_insert(db, "writing_styles", row)
    if result and result.data:
        return result.data[0]
    return {"id": str(uuid.uuid4()), **row}


@router.put("/styles/{style_id}")
async def update_writing_style(
    style_id: str, style: WritingStyle, user_id: str = Depends(get_current_user_id)
):
    db = get_supabase()
    _verify_ownership(db, "writing_styles", style_id, user_id)
    result = _safe_update(db, "writing_styles", style_id, {
        "name": style.name,
        "tone": style.tone,
        "formality": style.formality,
        "personality_tags": style.personality_tags or [],
        "sample_text": style.sample_text or "",
        "updated_at": datetime.utcnow().isoformat(),
    })
    return result.data[0] if result and result.data else {"id": style_id}


@router.delete("/styles/{style_id}")
async def delete_writing_style(style_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_supabase()
    _verify_ownership(db, "writing_styles", style_id, user_id)
    _safe_delete(db, "writing_styles", style_id)
    return {"status": "deleted"}
