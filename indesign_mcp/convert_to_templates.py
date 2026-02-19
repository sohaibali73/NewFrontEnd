"""
Potomac InDesign -> pptxgenjs JSON Template Converter
=====================================================
Reads the manifest JSON from export_manifest.jsx and converts each slide
into a pptxgenjs-compatible JSON template definition.

This integrates with the Potomac PPTX skill system which uses pptxgenjs
for programmatic slide generation via Claude.

Output per slide:
  - pptxgenjs objects array (text, rect, image definitions)
  - Background color
  - Slide metadata (type, title, fonts, colors)
  - Slide reference PNG path

Usage:
    python convert_to_templates.py \
        --manifest ./potomac_export/Bull_Bear_manifest.json \
        --images   ./potomac_export/slide_images/ \
        --output   ./templates/bull-bear/
"""

import json
import os
import sys
import argparse
from pathlib import Path


# --- Potomac Brand Constants ---
BRAND = {
    "colors": {
        "yellow": "FEC00F",
        "dark_gray": "212121",
        "turquoise": "00DED1",
        "pink": "EB2F5C",
        "white": "FFFFFF",
        "light_bg": "F2F2F2",
    },
    "fonts": {
        "header": "Rajdhani",
        "body": "Quicksand",
        "accent": "Lexend Deca",
    }
}

# Slide map for Bull Bear deck
BULL_BEAR_SLIDE_MAP = {
    1:  "cover-hero",
    2:  "strategy-intro",
    3:  "data-flow-diagram-light",
    4:  "three-step-circles-dark",
    5:  "chart-full-light",
    6:  "chart-full-light",
    7:  "chart-full-light",
    8:  "three-col-equation-dark",
    9:  "four-col-equation-dark",
    10: "split-dark-light",
    11: "data-table-light",
    12: "comparison-table",
    13: "three-circles-dark",
    14: "thank-you",
    15: "text-dark",
    16: "text-dark",
}


def is_dark_bg(hex_color):
    """Determine if background is dark for text color choice."""
    if not hex_color:
        return False
    h = hex_color.lstrip("#")
    if len(h) != 6:
        return False
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128


def classify_slide_type(slide_data):
    """Classify slide type based on content analysis."""
    items = slide_data.get("items", [])
    bg = slide_data.get("background_color", "")
    text_items = [i for i in items if i.get("type") == "text"]
    shape_items = [i for i in items if i.get("type") == "shape"]
    image_items = [i for i in items if i.get("type") == "image"]
    group_items = [i for i in items if i.get("type") == "group"]

    # Get all text content
    all_text = " ".join(i.get("text_content", "") for i in text_items).lower()

    if "disclos" in all_text or "definition" in all_text:
        return "disclosure"
    if "thank you" in all_text:
        return "closing"
    if len(text_items) <= 2 and len(image_items) >= 1:
        return "title"
    if len(shape_items) > 8:
        return "data_chart"
    if bg and is_dark_bg(bg):
        return "dark_section"
    if len(text_items) > 5:
        return "content"
    return "content"


def item_to_pptxgenjs_object(item, slide_w_in, slide_h_in, elements_dir=None):
    """Convert a manifest item to a pptxgenjs object definition."""
    pos = item.get("position", {})
    x = pos.get("x_in", 0)
    y = pos.get("y_in", 0)
    w = pos.get("w_in", 1)
    h = pos.get("h_in", 1)
    item_type = item.get("type", "other")
    layer = item.get("layer", "unknown")

    # --- TEXT ---
    if item_type == "text":
        paragraphs = item.get("paragraphs", [])
        if not paragraphs:
            text_content = item.get("text_content", "")
            if not text_content.strip():
                return None
            return {
                "text": {
                    "text": text_content,
                    "options": {
                        "x": round(x, 4), "y": round(y, 4),
                        "w": round(w, 4), "h": round(h, 4),
                        "fontSize": 12,
                        "fontFace": BRAND["fonts"]["body"],
                        "color": "212121",
                        "isTextBox": True,
                        "autoFit": True,
                    }
                }
            }

        # Build multi-paragraph text array for pptxgenjs
        text_parts = []
        primary_font = BRAND["fonts"]["body"]
        primary_size = 12
        primary_color = "212121"
        primary_align = "left"
        primary_bold = False

        for i, para in enumerate(paragraphs):
            text = para.get("text", "")
            if not text.strip():
                continue

            font = para.get("font", BRAND["fonts"]["body"])
            size = para.get("size_pt", 12)
            color = para.get("color", "212121") or "212121"
            align = para.get("align", "left")
            bold = para.get("bold", False)
            italic = para.get("italic", False)
            all_caps = para.get("all_caps", False)

            if i == 0:
                primary_font = font
                primary_size = size
                primary_color = color
                primary_align = align
                primary_bold = bold

            part = {
                "text": text.upper() if all_caps else text,
                "options": {
                    "fontSize": round(size, 1),
                    "fontFace": font,
                    "color": color,
                    "bold": bold,
                    "italic": italic,
                    "breakLine": True,
                }
            }
            text_parts.append(part)

        if not text_parts:
            return None

        # Use simple string for single-paragraph text
        if len(text_parts) == 1:
            return {
                "text": {
                    "text": text_parts[0]["text"],
                    "options": {
                        "x": round(x, 4), "y": round(y, 4),
                        "w": round(w, 4), "h": round(h, 4),
                        "fontSize": round(primary_size, 1),
                        "fontFace": primary_font,
                        "color": primary_color,
                        "bold": primary_bold,
                        "align": primary_align,
                        "isTextBox": True,
                        "autoFit": True,
                    }
                }
            }

        # Multi-paragraph: use text array
        return {
            "text": {
                "text": text_parts,
                "options": {
                    "x": round(x, 4), "y": round(y, 4),
                    "w": round(w, 4), "h": round(h, 4),
                    "align": primary_align,
                    "isTextBox": True,
                    "autoFit": True,
                }
            }
        }

    # --- SHAPE ---
    if item_type == "shape":
        fill_color = item.get("fill_color")
        stroke_color = item.get("stroke_color")
        stroke_weight = item.get("stroke_weight", 0)
        corner_radius = item.get("corner_radius", 0)
        opacity = item.get("opacity", 100)

        obj = {
            "rect": {
                "options": {
                    "x": round(x, 4), "y": round(y, 4),
                    "w": round(w, 4), "h": round(h, 4),
                }
            }
        }

        if corner_radius and corner_radius > 0:
            obj["rect"]["options"]["rectRadius"] = round(corner_radius / 72, 4)
            obj["rect"]["options"]["shape"] = "roundRect"

        if fill_color:
            obj["rect"]["options"]["fill"] = {"color": fill_color}
            if opacity < 100:
                obj["rect"]["options"]["fill"]["transparency"] = round(100 - opacity)

        if stroke_color and stroke_weight and stroke_weight > 0:
            obj["rect"]["options"]["line"] = {
                "color": stroke_color,
                "width": round(stroke_weight, 2)
            }

        return obj

    # --- IMAGE ---
    if item_type == "image":
        linked = item.get("linked_file") or item.get("linked_name") or ""
        exported = item.get("exported_png", "")

        # Determine image path
        img_path = None
        if exported and elements_dir:
            candidate = os.path.join(elements_dir, exported)
            if os.path.exists(candidate):
                img_path = candidate
        if not img_path and linked and os.path.exists(linked):
            img_path = linked

        obj = {
            "image": {
                "options": {
                    "x": round(x, 4), "y": round(y, 4),
                    "w": round(w, 4), "h": round(h, 4),
                },
                "linked_file": linked,
                "exported_png": exported,
            }
        }
        if img_path:
            obj["image"]["path"] = img_path
        return obj

    # --- GROUP (exported as PNG) ---
    if item_type == "group":
        exported = item.get("exported_png", "")
        img_path = None
        if exported and elements_dir:
            candidate = os.path.join(elements_dir, exported)
            if os.path.exists(candidate):
                img_path = candidate

        if img_path:
            return {
                "image": {
                    "path": img_path,
                    "options": {
                        "x": round(x, 4), "y": round(y, 4),
                        "w": round(w, 4), "h": round(h, 4),
                    },
                    "source": "group_export",
                    "exported_png": exported,
                }
            }
        # Group without export — skip or return placeholder
        return None

    # --- LINE ---
    if item_type == "line":
        stroke_color = item.get("stroke_color", "212121")
        stroke_weight = item.get("stroke_weight", 1)
        return {
            "line": {
                "options": {
                    "x": round(x, 4), "y": round(y, 4),
                    "w": round(w, 4), "h": round(h, 4),
                    "line": {
                        "color": stroke_color or "212121",
                        "width": round(stroke_weight, 2) if stroke_weight else 1,
                    }
                }
            }
        }

    return None


def convert(manifest_path: str, images_dir: str, output_dir: str,
            logos_dir: str = None):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.loads(f.read(), strict=False)

    print(f"Loaded manifest: {manifest['document_name']}")
    print(f"Slides: {manifest['total_slides']}")
    print(f"Dimensions: {manifest['slide_width_in']}\" x {manifest['slide_height_in']}\"")

    slide_w_in = manifest["slide_width_in"]
    slide_h_in = manifest["slide_height_in"]

    # Detect elements directory
    elements_dir = os.path.join(os.path.dirname(images_dir), "elements")
    if not os.path.isdir(elements_dir):
        elements_dir = None

    # Build pptxgenjs template for each slide
    pptxgenjs_slides = []
    built_templates = {}

    for slide_data in manifest["slides"]:
        slide_num = slide_data["slide_number"]
        template_id = slide_data.get("template_id") or \
                      BULL_BEAR_SLIDE_MAP.get(slide_num, f"slide-{slide_num}")

        bg_color = slide_data.get("background_color")
        slide_type = classify_slide_type(slide_data)
        ref_image = slide_data.get("reference_image")

        # Convert all items to pptxgenjs objects
        objects = []
        items = slide_data.get("items", [])
        for item in items:
            obj = item_to_pptxgenjs_object(item, slide_w_in, slide_h_in, elements_dir)
            if obj:
                objects.append(obj)

        # Build slide template
        slide_template = {
            "slide_number": slide_num,
            "template_id": template_id,
            "slide_type": slide_type,
            "background": {"color": bg_color} if bg_color else {"color": "FFFFFF"},
            "objects": objects,
            "metadata": {
                "layer": slide_data.get("items", [{}])[0].get("layer", "unknown") if items else "unknown",
                "item_count": len(items),
                "object_count": len(objects),
                "reference_image": f"slide_images/{ref_image}" if ref_image else None,
            }
        }

        pptxgenjs_slides.append(slide_template)

        # Also save individual template JSON (deduplicated)
        if template_id not in built_templates:
            template_file = output_path / f"{template_id}.json"
            with open(str(template_file), "w", encoding="utf-8") as f:
                json.dump(slide_template, f, indent=2, ensure_ascii=False)
            built_templates[template_id] = str(template_file)
            print(f"  -> {template_id}: {len(objects)} pptxgenjs objects")
        else:
            print(f"  [OK] Slide {slide_num}: '{template_id}' already built")

    # Build master template catalog
    catalog = {
        "deck_family": manifest.get("deck_family", "unknown"),
        "document_name": manifest["document_name"],
        "total_slides": manifest["total_slides"],
        "slide_width_in": slide_w_in,
        "slide_height_in": slide_h_in,
        "aspect_ratio": manifest.get("aspect_ratio", 1.7778),
        "layers": manifest.get("layers", []),
        "brand": BRAND,
        "pptxgenjs_defaults": {
            "presLayout": "LAYOUT_WIDE",
            "slideWidth": slide_w_in,
            "slideHeight": slide_h_in,
        },
        "slide_type_guide": {
            "title": "Full-width title with hero image",
            "dark_section": "Dark background with white/yellow text",
            "content": "Light background with body text",
            "data_chart": "Full-width chart or data visualization",
            "disclosure": "Dense legal/disclosure text",
            "closing": "Thank you / contact information",
        },
        "templates": built_templates,
        "slide_map": {str(k): v for k, v in BULL_BEAR_SLIDE_MAP.items()},
        "slides": pptxgenjs_slides,
    }

    catalog_path = output_path / "template_catalog.json"
    with open(str(catalog_path), "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"\nDone! {len(built_templates)} pptxgenjs templates built.")
    print(f"   Catalog: {catalog_path}")
    print(f"   Total objects: {sum(len(s['objects']) for s in pptxgenjs_slides)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert InDesign manifest to pptxgenjs JSON templates")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--images", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--logos", default=None)
    args = parser.parse_args()

    convert(args.manifest, args.images, args.output, args.logos)
