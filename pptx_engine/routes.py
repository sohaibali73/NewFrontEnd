"""
PPTX Engine — FastAPI Router
=============================
Endpoints for uploading chart images, assembling decks, downloading
finished presentations, and listing available templates.
"""

from __future__ import annotations

import logging
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from pptx_engine.assembly import assemble_deck

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Directories (relative to project root)
# ---------------------------------------------------------------------------
_ENGINE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = str(_ENGINE_DIR / "templates")
UPLOADS_DIR = str(_ENGINE_DIR / "uploads")
OUTPUTS_DIR = str(_ENGINE_DIR / "outputs")

# Ensure directories exist
for _d in (TEMPLATES_DIR, UPLOADS_DIR, OUTPUTS_DIR):
    os.makedirs(_d, exist_ok=True)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SlideContent(BaseModel):
    """A single slide in the slide plan."""
    template_id: str
    content: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class SlidePlan(BaseModel):
    """Full deck assembly request body."""
    deck_family: str = "default"
    presentation_title: str = "Untitled Presentation"
    output_filename: str = "output.pptx"
    slides: List[SlideContent]


class UploadResponse(BaseModel):
    filename: str
    upload_id: str
    saved_as: str


class AssembleResponse(BaseModel):
    download_url: str
    slide_count: int


class TemplatesResponse(BaseModel):
    families: Dict[str, List[str]]


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/pptx", tags=["pptx"])


@router.post("/upload-image", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload a chart / graphic image for later embedding in a slide.

    The file is saved to ``uploads/`` with a UUID prefix so names never
    collide.  Returns the original filename, the upload_id (UUID), and the
    on-disk filename.
    """
    upload_id = str(uuid.uuid4())
    original_name = file.filename or "image.png"
    saved_name = f"{upload_id}_{original_name}"
    dest_path = os.path.join(UPLOADS_DIR, saved_name)

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    logger.info("Saved upload '%s' → %s", original_name, dest_path)

    return UploadResponse(
        filename=original_name,
        upload_id=upload_id,
        saved_as=saved_name,
    )


@router.post("/assemble", response_model=AssembleResponse)
async def assemble(plan: SlidePlan):
    """Assemble a complete .pptx deck from a JSON slide plan.

    The plan references template IDs and optionally upload_ids for images
    previously uploaded via ``POST /pptx/upload-image``.
    """
    plan_dict = plan.model_dump()

    try:
        output_path = assemble_deck(
            plan=plan_dict,
            templates_dir=TEMPLATES_DIR,
            uploads_dir=UPLOADS_DIR,
            outputs_dir=OUTPUTS_DIR,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Deck assembly failed")
        raise HTTPException(status_code=500, detail=f"Assembly error: {exc}")

    filename = os.path.basename(output_path)
    return AssembleResponse(
        download_url=f"/pptx/download/{filename}",
        slide_count=len(plan.slides),
    )


@router.get("/download/{filename}")
async def download(filename: str):
    """Stream a generated .pptx file as a download."""
    file_path = os.path.join(OUTPUTS_DIR, filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=(
            "application/vnd.openxmlformats-officedocument"
            ".presentationml.presentation"
        ),
    )


@router.get("/templates", response_model=TemplatesResponse)
async def list_templates():
    """List available deck families and their template IDs.

    Scans ``templates/`` for sub-directories (families) containing
    ``.pptx`` files (template IDs).
    """
    families: Dict[str, List[str]] = {}

    if not os.path.isdir(TEMPLATES_DIR):
        return TemplatesResponse(families=families)

    for family_name in sorted(os.listdir(TEMPLATES_DIR)):
        family_path = os.path.join(TEMPLATES_DIR, family_name)
        if not os.path.isdir(family_path):
            continue

        template_ids: List[str] = []
        for fname in sorted(os.listdir(family_path)):
            if fname.lower().endswith(".pptx"):
                template_ids.append(os.path.splitext(fname)[0])

        if template_ids:
            families[family_name] = template_ids

    return TemplatesResponse(families=families)
