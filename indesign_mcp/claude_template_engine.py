"""
Claude-Powered Template Engine
Analyzes PDF slides visually and generates pptxgenjs JSON templates.
"""
import base64
import json
import os
import io
from pathlib import Path
from typing import Optional, Callable

# Load API key from .env
def get_api_key():
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        for line in open(env_path):
            if line.startswith("ANTHROPIC_API_KEY="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("ANTHROPIC_API_KEY", "")

SYSTEM_PROMPT = """You are a PowerPoint template reconstruction expert. You analyze slide images from InDesign presentations and produce pptxgenjs-compatible JSON that recreates each slide as closely as possible in PowerPoint.

BRAND: Potomac Fund Management
- Primary Yellow: FEC00F
- Dark Gray: 212121
- Turquoise: 00DED1
- Pink: EB2F5C
- Header Font: Rajdhani (bold, ALL CAPS)
- Body Font: Quicksand

OUTPUT FORMAT: Return ONLY valid JSON (no markdown). Each slide is an object:
{
  "template_id": "descriptive-name",
  "slide_type": "title|content|dark_section|data_chart|disclosure|closing",
  "background": {"color": "HEXCOLOR"},
  "objects": [
    {"rect": {"options": {"x": INCHES, "y": INCHES, "w": INCHES, "h": INCHES, "fill": {"color": "HEX"}}}},
    {"text": {"text": "ACTUAL TEXT", "options": {"x": INCHES, "y": INCHES, "w": INCHES, "h": INCHES, "fontSize": PT, "fontFace": "Rajdhani", "color": "HEX", "bold": true, "align": "center"}}},
    {"image": {"options": {"x": INCHES, "y": INCHES, "w": INCHES, "h": INCHES}, "description": "what goes here"}}
  ]
}

RULES:
- All positions in INCHES. Slide is 13.333" x 7.5" (standard widescreen)
- Colors are 6-char hex WITHOUT #
- Recreate EVERY visible element: backgrounds, shapes, text boxes, images
- Text must be the ACTUAL text from the slide (read it carefully)
- For images/charts you can't recreate, add an image placeholder with description
- Shapes go BEFORE text (z-order)
- Be precise with positions — match the original layout exactly"""


def scan_assets_folder(folder_path: str) -> dict:
    """Scan a folder for all design assets."""
    assets = {"images": [], "pdfs": [], "indesign": [], "illustrator": [],
              "powerpoint": [], "other": [], "total": 0}
    ext_map = {
        ".png": "images", ".jpg": "images", ".jpeg": "images",
        ".gif": "images", ".tif": "images", ".tiff": "images",
        ".bmp": "images", ".svg": "images",
        ".pdf": "pdfs", ".indd": "indesign", ".ai": "illustrator",
        ".eps": "illustrator", ".pptx": "powerpoint", ".ppt": "powerpoint",
        ".psd": "images",
    }
    for root, dirs, files in os.walk(folder_path):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            category = ext_map.get(ext, "other")
            full_path = os.path.join(root, f)
            size_kb = os.path.getsize(full_path) / 1024
            assets[category].append({
                "name": f, "path": full_path,
                "size_kb": round(size_kb, 1),
                "ext": ext
            })
            assets["total"] += 1
    return assets


def pdf_page_to_base64(pdf_path: str, page_num: int, dpi: int = 150) -> Optional[str]:
    """Convert a PDF page to base64 PNG."""
    try:
        import fitz
        doc = fitz.open(pdf_path)
        page = doc.load_page(page_num)
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        doc.close()
        return base64.standard_b64encode(img_bytes).decode("utf-8")
    except Exception as e:
        return None


def analyze_slide_with_claude(api_key: str, slide_image_b64: str,
                              slide_num: int, total_slides: int,
                              asset_summary: str = "",
                              log_fn: Callable = None) -> Optional[dict]:
    """Send a slide image to Claude and get pptxgenjs JSON back."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        user_msg = f"Analyze slide {slide_num}/{total_slides} and produce the pptxgenjs JSON reconstruction."
        if asset_summary:
            user_msg += f"\n\nAvailable assets in the project folder:\n{asset_summary}"

        if log_fn:
            log_fn(f"Sending slide {slide_num} to Claude...")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {
                        "type": "base64", "media_type": "image/png",
                        "data": slide_image_b64
                    }},
                    {"type": "text", "text": user_msg}
                ]
            }]
        )

        # Extract JSON from response
        text = response.content[0].text.strip()
        # Try to parse directly
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            import re
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            # Try finding first { to last }
            start = text.find('{')
            end = text.rfind('}')
            if start >= 0 and end > start:
                return json.loads(text[start:end+1])
        return None

    except Exception as e:
        if log_fn:
            log_fn(f"Claude API error: {e}")
        return None


def build_templates_with_claude(pdf_path: str, assets_folder: str,
                                 output_dir: str, log_fn: Callable = None):
    """Full pipeline: PDF -> Claude vision -> pptxgenjs JSON templates."""
    api_key = get_api_key()
    if not api_key:
        if log_fn: log_fn("ERROR: No ANTHROPIC_API_KEY found in .env")
        return None

    if log_fn: log_fn("Scanning assets folder...")
    assets = scan_assets_folder(assets_folder)
    asset_summary = (f"{assets['total']} files: {len(assets['images'])} images, "
                     f"{len(assets['pdfs'])} PDFs, {len(assets['indesign'])} InDesign, "
                     f"{len(assets['illustrator'])} Illustrator, "
                     f"{len(assets['powerpoint'])} PowerPoint")
    if log_fn: log_fn(f"Assets found: {asset_summary}")

    # Get PDF page count
    try:
        import fitz
        doc = fitz.open(pdf_path)
        page_count = doc.page_count
        doc.close()
    except:
        if log_fn: log_fn("ERROR: Can't read PDF")
        return None

    if log_fn: log_fn(f"PDF: {page_count} pages")

    # Process each page
    os.makedirs(output_dir, exist_ok=True)
    all_slides = []

    for i in range(page_count):
        if log_fn: log_fn(f"--- Slide {i+1}/{page_count} ---")

        img_b64 = pdf_page_to_base64(pdf_path, i)
        if not img_b64:
            if log_fn: log_fn(f"  Failed to convert page {i+1}")
            continue

        slide_json = analyze_slide_with_claude(
            api_key, img_b64, i+1, page_count, asset_summary, log_fn)

        if slide_json:
            slide_json["slide_number"] = i + 1
            all_slides.append(slide_json)
            tmpl_id = slide_json.get("template_id", f"slide-{i+1}")
            obj_count = len(slide_json.get("objects", []))
            if log_fn: log_fn(f"  {tmpl_id}: {obj_count} objects")

            # Save individual template
            with open(os.path.join(output_dir, f"{tmpl_id}.json"), "w") as f:
                json.dump(slide_json, f, indent=2)
        else:
            if log_fn: log_fn(f"  No valid JSON returned for slide {i+1}")

    # Save catalog
    catalog = {
        "document_name": Path(pdf_path).stem,
        "total_slides": page_count,
        "slide_width_in": 13.333, "slide_height_in": 7.5,
        "assets": asset_summary,
        "brand": {"colors": {"yellow": "FEC00F", "dark_gray": "212121"},
                  "fonts": {"header": "Rajdhani", "body": "Quicksand"}},
        "slides": all_slides,
    }
    catalog_path = os.path.join(output_dir, "template_catalog.json")
    with open(catalog_path, "w") as f:
        json.dump(catalog, f, indent=2)

    if log_fn: log_fn(f"\nDone! {len(all_slides)} templates in {output_dir}")
    return catalog_path
