"""
Presentations API — Potomac Brand-Compliant PPTX Generation
=============================================================
Endpoints:
  POST /presentations/generate          — AI-powered generation with SSE streaming
  POST /presentations/generate-market-outlook — Pre-built Market Outlook deck
  GET  /presentations                   — List user's generated presentations
  GET  /presentations/{id}/download     — Download a generated .pptx file
  DELETE /presentations/{id}            — Delete a presentation record + file
"""

import os
import json
import uuid
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from api.dependencies import get_current_user_id, get_user_api_keys
from db.supabase_client import get_supabase
from core.pptx_generator import PotomacPPTXGenerator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/presentations", tags=["Presentations"])

# Output directory for generated files
PRESENTATIONS_DIR = Path(os.getenv("PRESENTATIONS_OUTPUT_DIR",
                                   Path(__file__).parent.parent.parent / "data" / "presentations"))

# ── Claude model ──────────────────────────────────────────────────────────────
CLAUDE_MODEL = "claude-opus-4-5"


# ── Pydantic models ───────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str
    title: Optional[str] = None
    presentation_type: str = "general"   # general | market_outlook | strategy | firm_overview
    slide_count: int = 10


class MarketOutlookRequest(BaseModel):
    title: str = "MARKET OUTLOOK"
    subtitle: str = "Q1 2025 — ECONOMIC & INVESTMENT REVIEW"
    date: str = "February 2025"


# ── helpers ───────────────────────────────────────────────────────────────────

def _save_record(db, user_id: str, pres_id: str, title: str, file_path: str,
                 slide_count: int, prompt: str = "") -> dict:
    """Persist presentation metadata to content_items (graceful fallback)."""
    record = {
        "id": pres_id,
        "user_id": user_id,
        "title": title,
        "content": json.dumps({
            "file_path": file_path,
            "slide_count": slide_count,
            "prompt": prompt,
            "generated_at": datetime.utcnow().isoformat(),
        }),
        "content_type": "presentation",
        "status": "complete",
        "tags": ["ai-generated", "pptx", "potomac-brand"],
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        db.table("content_items").insert(record).execute()
    except Exception as e:
        logger.warning(f"Could not save presentation record: {e}")
    return record


def _get_user_dir(user_id: str) -> Path:
    d = PRESENTATIONS_DIR / user_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _resolve_file(user_id: str, pres_id: str) -> Optional[Path]:
    """Find the .pptx file for a given presentation ID."""
    user_dir = _get_user_dir(user_id)
    for f in user_dir.glob(f"{pres_id}*.pptx"):
        return f
    return None


# ── Claude outline generation ─────────────────────────────────────────────────

OUTLINE_SYSTEM = """You are a Potomac Fund Management presentation specialist.
Generate a professional JSON slide outline for a PowerPoint presentation.

Available slide types and their required fields:
- "title"      : title, subtitle, date, presenter (optional)
- "agenda"     : topics (list of {num, title, sub})
- "chart"      : title, image (filename from asset library), panel_title, callouts ([{label, text}])
                 OR bullets ([string]) if no callouts
- "stats"      : title, image, panel_title, stats ([{val, label}]), background ("light")
- "two_charts" : title, charts ([{image, label}])
- "content"    : title, bullets ([string]), background ("light"|"dark")
- "summary"    : title, columns ([{title, color ("green"|"yellow"|"red"), items ([string])}])
- "closing"    : tagline, contacts ([{label, val}])

Available images in the asset library (use EXACT filenames):
  "1 - SPX.png", "Slide 7 - CPI.png", "4 - LQD.png", "GLD.png", "MOVE.png",
  "Scoring_basket.png", "Market_Outlook.002.jpeg", "Market_Outlook.026.jpeg",
  "Technical Indicators Vert.jpg", "Bull-Bear_Strategy-Deck-Slide_Page_04.jpg"

Rules:
1. ALWAYS start with a "title" slide and end with a "closing" slide
2. Include an "agenda" slide as slide 2
3. Brand colors: yellow=#FEC00F dark=#212121 teal=#00DED1
4. All text in headers should be ALL CAPS
5. Return ONLY valid JSON — no markdown, no explanation, no code blocks
"""


def _generate_outline(claude_key: str, prompt: str, slide_count: int, ptype: str) -> dict:
    """Call Claude (sync) to generate a structured slide outline JSON."""
    import anthropic

    client = anthropic.Anthropic(api_key=claude_key)
    user_msg = (
        f"Create a Potomac Fund Management presentation outline.\n"
        f"Topic / request: {prompt}\n"
        f"Presentation type: {ptype}\n"
        f"Target slide count: {slide_count} slides\n\n"
        f"Return ONLY a JSON object with a 'title' key and a 'slides' array."
    )

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=OUTLINE_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = response.content[0].text.strip()
    # Strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_presentation(
    data: GenerateRequest,
    user_id: str = Depends(get_current_user_id),
    api_keys: dict = Depends(get_user_api_keys),
):
    """
    AI-powered PPTX generation with SSE progress streaming.

    Flow:
      1. Claude generates a JSON slide outline from the user's prompt
      2. PotomacPPTXGenerator builds the branded .pptx
      3. Returns SSE events: status → complete (with download_url)

    Example SSE events:
      data: {"type":"status","message":"Generating slide outline..."}
      data: {"type":"status","message":"Building 10-slide presentation..."}
      data: {"type":"complete","presentation_id":"...","download_url":"/presentations/id/download","slide_count":10}
    """
    claude_key = api_keys.get("claude")
    if not claude_key:
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    title = data.title or data.prompt[:60]
    pres_id = str(uuid.uuid4())

    async def stream():
        try:
            # Step 1 — outline
            yield f"data: {json.dumps({'type': 'status', 'message': 'Generating slide outline with Claude...'})}\n\n"
            await asyncio.sleep(0)

            try:
                loop = asyncio.get_event_loop()
                outline = await loop.run_in_executor(
                    None,
                    lambda: _generate_outline(
                        claude_key, data.prompt, data.slide_count, data.presentation_type
                    )
                )
            except Exception as e:
                logger.error(f"Outline generation failed: {e}", exc_info=True)
                outline = {
                    "title": title,
                    "slides": [
                        {"type": "title", "title": title, "subtitle": data.prompt[:80], "date": datetime.utcnow().strftime("%B %Y")},
                        {"type": "content", "title": "OVERVIEW", "bullets": [data.prompt]},
                        {"type": "closing"},
                    ]
                }

            slide_count = len(outline.get("slides", []))
            yield f"data: {json.dumps({'type': 'status', 'message': f'Building {slide_count}-slide Potomac presentation...'})}\n\n"
            await asyncio.sleep(0)

            # Step 2 — build PPTX
            safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip()[:50]
            file_name = f"{pres_id}_{safe_title}.pptx"
            file_path = str(_get_user_dir(user_id) / file_name)

            gen = PotomacPPTXGenerator()
            gen.generate_from_outline(outline, file_path)

            yield f"data: {json.dumps({'type': 'status', 'message': 'Saving presentation record...'})}\n\n"
            await asyncio.sleep(0)

            # Step 3 — save record
            db = get_supabase()
            _save_record(db, user_id, pres_id, title, file_path, slide_count, data.prompt)

            download_url = f"/presentations/{pres_id}/download"
            yield f"data: {json.dumps({'type': 'complete', 'presentation_id': pres_id, 'title': title, 'slide_count': slide_count, 'download_url': download_url, 'file_name': file_name})}\n\n"

        except Exception as e:
            logger.error(f"Presentation generation error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.post("/generate-market-outlook")
async def generate_market_outlook(
    data: MarketOutlookRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate the pre-built Potomac Market Outlook deck (no Claude call needed).
    Uses the standard 10-slide template with Scoring Basket, SPX, CPI, LQD, GLD, MOVE.

    Returns a streaming SSE response for frontend progress tracking.
    """
    pres_id = str(uuid.uuid4())

    async def stream():
        try:
            yield f"data: {json.dumps({'type': 'status', 'message': 'Building Potomac Market Outlook deck...'})}\n\n"
            await asyncio.sleep(0)

            file_name = f"{pres_id}_Market_Outlook.pptx"
            file_path = str(_get_user_dir(user_id) / file_name)

            gen = PotomacPPTXGenerator()
            gen.generate_market_outlook(
                output_path=file_path,
                title=data.title,
                subtitle=data.subtitle,
                date=data.date,
            )

            yield f"data: {json.dumps({'type': 'status', 'message': 'Saving record...'})}\n\n"
            await asyncio.sleep(0)

            db = get_supabase()
            _save_record(db, user_id, pres_id, data.title, file_path, 10,
                         f"Market Outlook: {data.subtitle}")

            download_url = f"/presentations/{pres_id}/download"
            yield f"data: {json.dumps({'type': 'complete', 'presentation_id': pres_id, 'title': data.title, 'slide_count': 10, 'download_url': download_url, 'file_name': file_name})}\n\n"

        except Exception as e:
            logger.error(f"Market Outlook generation error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("")
async def list_presentations(
    user_id: str = Depends(get_current_user_id),
    limit: int = 20,
):
    """List the user's generated presentations."""
    db = get_supabase()
    try:
        result = (
            db.table("content_items")
            .select("*")
            .eq("user_id", user_id)
            .eq("content_type", "presentation")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        items = result.data or []
        # Enrich with download URL
        for item in items:
            item["download_url"] = f"/presentations/{item['id']}/download"
        return {"presentations": items, "total": len(items)}
    except Exception as e:
        logger.warning(f"Could not fetch presentations: {e}")
        return {"presentations": [], "total": 0}


@router.get("/{presentation_id}/download")
async def download_presentation(
    presentation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Download a generated .pptx file.
    Looks up the file by presentation_id in the user's output directory.
    """
    # First check DB for ownership
    db = get_supabase()
    record = None
    file_path_from_db = None
    try:
        result = (
            db.table("content_items")
            .select("user_id, title, content")
            .eq("id", presentation_id)
            .execute()
        )
        if result.data:
            record = result.data[0]
            if record["user_id"] != user_id:
                raise HTTPException(status_code=403, detail="Access denied")
            meta = json.loads(record.get("content") or "{}")
            file_path_from_db = meta.get("file_path")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB lookup failed: {e}")

    # Try DB path first, then scan user dir
    file_path = None
    if file_path_from_db and Path(file_path_from_db).exists():
        file_path = Path(file_path_from_db)
    else:
        file_path = _resolve_file(user_id, presentation_id)

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Presentation file not found")

    title = (record.get("title") if record else "presentation").replace(" ", "_")
    download_name = f"Potomac_{title}.pptx"

    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=download_name,
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
    )


@router.delete("/{presentation_id}")
async def delete_presentation(
    presentation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a presentation record and its .pptx file."""
    db = get_supabase()
    try:
        result = (
            db.table("content_items")
            .select("user_id, content")
            .eq("id", presentation_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Presentation not found")
        record = result.data[0]
        if record["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Delete file
        meta = json.loads(record.get("content") or "{}")
        file_path = meta.get("file_path")
        if file_path and Path(file_path).exists():
            Path(file_path).unlink()

        # Delete DB record
        db.table("content_items").delete().eq("id", presentation_id).execute()
        return {"status": "deleted", "id": presentation_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
