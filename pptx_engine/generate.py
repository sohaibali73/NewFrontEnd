"""
PPTX Generate — Claude → Slide Plan → PPTX pipeline
=====================================================
End-to-end endpoint that takes a user brief, sends it to Claude to produce
a JSON slide plan, then assembles the branded .pptx deck.

Public API:
    generate_router  — FastAPI APIRouter (mounted by routes.py)
    load_skill_md()  — Read the SKILL.md system prompt
"""

from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import get_settings
from db.supabase_client import get_supabase
from pptx_engine.assembly import assemble_deck

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_ENGINE_DIR = Path(__file__).resolve().parent
SKILL_MD_PATH = _ENGINE_DIR / "skill" / "SKILL.md"
TEMPLATES_DIR = str(_ENGINE_DIR / "templates")
UPLOADS_DIR = str(_ENGINE_DIR / "uploads")
OUTPUTS_DIR = str(_ENGINE_DIR / "outputs")

# ---------------------------------------------------------------------------
# Skill loader
# ---------------------------------------------------------------------------

_DEFAULT_SYSTEM_PROMPT = (
    "You are a Potomac presentation builder. "
    "You generate structured JSON slide plans for branded PowerPoint decks."
)


def load_skill_md() -> str:
    """Read ``pptx_engine/skill/SKILL.md`` and return its contents.

    Returns a sensible default if the file is missing.
    """
    try:
        return SKILL_MD_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.info(
            "SKILL.md not found at %s – using default system prompt.", SKILL_MD_PATH
        )
        return _DEFAULT_SYSTEM_PROMPT


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    """Request body for POST /pptx/generate."""
    outline: str = Field(..., description="The user's presentation brief or outline")
    deck_family: str = Field("default", description="Template deck family, e.g. 'bull-bear'")
    uploaded_images: List[str] = Field(default_factory=list, description="Filenames of previously uploaded chart images")
    user_id: Optional[str] = Field(None, description="Supabase user ID — used to fetch per-user Claude API key")


class GenerateResponse(BaseModel):
    download_url: str
    slide_count: int
    plan: Dict[str, Any]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_api_key(user_id: Optional[str]) -> str:
    """Return the Anthropic API key to use for this request.

    Priority:
      1. Per-user key stored in ``users.claude_api_key`` (if *user_id* given)
      2. Server-wide ``ANTHROPIC_API_KEY`` from environment / settings
    """
    if user_id:
        try:
            sb = get_supabase()
            result = (
                sb.table("users")
                .select("claude_api_key")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
            if result.data and result.data[0].get("claude_api_key"):
                logger.debug("Using per-user Claude API key for user %s", user_id)
                return result.data[0]["claude_api_key"]
        except Exception as exc:
            logger.warning(
                "Failed to fetch claude_api_key for user %s: %s – falling back to env key.",
                user_id, exc,
            )

    # Fallback to server-wide key
    settings = get_settings()
    key = settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="No Anthropic API key configured. Set ANTHROPIC_API_KEY or provide a user_id with a stored key.",
        )
    return key


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` fences that Claude sometimes wraps around JSON."""
    text = text.strip()
    # Remove leading ```json or ``` and trailing ```
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def _build_user_message(outline: str, deck_family: str, uploaded_images: List[str]) -> str:
    """Construct the user message sent to Claude."""
    images_str = ", ".join(uploaded_images) if uploaded_images else "(none)"
    return (
        "Generate a complete branded Potomac slide plan for the following brief.\n"
        "\n"
        f"Deck family: {deck_family}\n"
        "\n"
        f"Available uploaded chart images: {images_str}\n"
        "\n"
        "Brief:\n"
        f"{outline}\n"
        "\n"
        "Return ONLY valid JSON. No markdown fences. No explanation."
    )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
generate_router = APIRouter(prefix="/pptx", tags=["pptx"])


@generate_router.post("/generate", response_model=GenerateResponse)
async def generate_presentation(req: GenerateRequest):
    """Full Claude → slide-plan → PPTX pipeline.

    1. Loads the SKILL.md system prompt.
    2. Resolves the Anthropic API key (per-user or server-wide).
    3. Calls Claude to produce a JSON slide plan.
    4. Parses the plan and assembles the .pptx deck.
    5. Returns the download URL, slide count, and raw plan.
    """
    # ---- 1. System prompt ----
    system_prompt = load_skill_md()

    # ---- 2. API key ----
    api_key = _resolve_api_key(req.user_id)

    # ---- 3. Call Claude ----
    user_message = _build_user_message(req.outline, req.deck_family, req.uploaded_images)

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Anthropic rate limit exceeded. Try again shortly.")
    except Exception as exc:
        logger.exception("Claude API call failed")
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}")

    # Extract text content from response
    raw_text = ""
    for block in response.content:
        if hasattr(block, "text"):
            raw_text += block.text

    if not raw_text.strip():
        raise HTTPException(status_code=502, detail="Claude returned an empty response.")

    # ---- 4. Parse JSON ----
    cleaned = _strip_markdown_fences(raw_text)
    try:
        plan = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Claude response as JSON:\n%s", cleaned[:500])
        raise HTTPException(
            status_code=502,
            detail=f"Claude did not return valid JSON: {exc}",
        )

    # Inject deck_family if Claude omitted it
    if "deck_family" not in plan:
        plan["deck_family"] = req.deck_family

    # ---- 5. Assemble deck ----
    try:
        output_path = assemble_deck(
            plan=plan,
            templates_dir=TEMPLATES_DIR,
            uploads_dir=UPLOADS_DIR,
            outputs_dir=OUTPUTS_DIR,
        )
    except Exception as exc:
        logger.exception("Deck assembly failed after Claude generation")
        raise HTTPException(status_code=500, detail=f"Assembly error: {exc}")

    filename = os.path.basename(output_path)
    slide_count = len(plan.get("slides", []))

    return GenerateResponse(
        download_url=f"/pptx/download/{filename}",
        slide_count=slide_count,
        plan=plan,
    )
