"""
Potomac InDesign -> PPTX Template Converter (v2 - Native Elements)
==================================================================
Reads the manifest JSON produced by export_manifest.jsx and builds
python-pptx template files with NATIVE PowerPoint elements:
  - Shapes are recreated as PowerPoint shapes (fills, strokes, corners)
  - Text is editable PowerPoint text (fonts, sizes, colors, alignment)
  - Images become placeholder zones
  - No background PNG screenshots

Usage:
    pip install python-pptx lxml Pillow
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
from typing import Optional

try:
    from pptx import Presentation
    from pptx.util import Inches, Pt, Emu
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
    from pptx.enum.shapes import MSO_SHAPE
    from lxml import etree
except ImportError:
    print("Install required packages: pip install python-pptx lxml Pillow")
    sys.exit(1)


# --- HELPERS ---

def hex_to_rgb(hex_str: Optional[str]) -> Optional[RGBColor]:
    """Convert hex string (no #) to RGBColor."""
    if not hex_str:
        return None
    h = hex_str.lstrip("#")
    if len(h) != 6:
        return None
    try:
        return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    except Exception:
        return None


def pt_to_emu(pt_val):
    """Convert points to EMU."""
    return int(pt_val * 12700)


ALIGN_MAP = {
    "left": PP_ALIGN.LEFT,
    "center": PP_ALIGN.CENTER,
    "right": PP_ALIGN.RIGHT,
}


def set_slide_bg_color(slide, hex_color):
    """Set the slide background to a solid fill color."""
    if not hex_color:
        return
    rgb = hex_to_rgb(hex_color)
    if not rgb:
        return
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def add_shape_to_slide(slide, item, slide_w_in, slide_h_in):
    """Add a native PowerPoint shape from manifest shape data."""
    pos = item.get("position", {})
    x = Inches(pos.get("x_in", 0))
    y = Inches(pos.get("y_in", 0))
    w = Inches(pos.get("w_in", 1))
    h = Inches(pos.get("h_in", 1))

    corner_radius = item.get("corner_radius", 0)

    # Choose shape type based on corner radius
    if corner_radius and corner_radius > 0:
        shape_type = MSO_SHAPE.ROUNDED_RECTANGLE
    else:
        shape_type = MSO_SHAPE.RECTANGLE

    shape = slide.shapes.add_shape(shape_type, x, y, w, h)

    # Fill
    fill_color = hex_to_rgb(item.get("fill_color"))
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()  # transparent

    # Stroke
    stroke_color = hex_to_rgb(item.get("stroke_color"))
    stroke_weight = item.get("stroke_weight", 0)
    if stroke_color and stroke_weight and stroke_weight > 0:
        shape.line.color.rgb = stroke_color
        shape.line.width = Pt(stroke_weight)
    else:
        shape.line.fill.background()  # no stroke

    # Opacity
    opacity = item.get("opacity", 100)
    if opacity < 100:
        # Set shape transparency via XML
        try:
            sp = shape._element
            ns = 'http://schemas.openxmlformats.org/drawingml/2006/main'
            solid_fill = sp.find('.//' + '{%s}solidFill' % ns)
            if solid_fill is not None:
                srgb = solid_fill.find('{%s}srgbClr' % ns)
                if srgb is not None:
                    alpha = etree.SubElement(srgb, '{%s}alpha' % ns)
                    alpha.set('val', str(int(opacity * 1000)))
        except Exception:
            pass

    return shape


def add_text_to_slide(slide, item, slide_w_in, slide_h_in):
    """Add an editable text box from manifest text data."""
    pos = item.get("position", {})
    x = Inches(pos.get("x_in", 0))
    y = Inches(pos.get("y_in", 0))
    w = Inches(pos.get("w_in", 1))
    h = Inches(pos.get("h_in", 1))

    txBox = slide.shapes.add_textbox(x, y, w, h)
    tf = txBox.text_frame
    tf.word_wrap = True

    # Background fill for text frame
    fill_color = hex_to_rgb(item.get("fill_color"))
    is_transparent = item.get("is_transparent", True)
    if fill_color and not is_transparent:
        txBox.fill.solid()
        txBox.fill.fore_color.rgb = fill_color
    else:
        txBox.fill.background()

    # Stroke
    stroke_color = hex_to_rgb(item.get("stroke_color"))
    stroke_weight = item.get("stroke_weight", 0)
    if stroke_color and stroke_weight and stroke_weight > 0:
        txBox.line.color.rgb = stroke_color
        txBox.line.width = Pt(stroke_weight)

    # Add paragraphs
    paragraphs = item.get("paragraphs", [])
    if not paragraphs:
        # No paragraph data - just put the raw text content
        text_content = item.get("text_content", "")
        if text_content:
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = text_content
        return txBox

    for i, para_data in enumerate(paragraphs):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()

        text = para_data.get("text", "")
        font_name = para_data.get("font", "Quicksand")
        font_style = para_data.get("style", "Regular")
        size_pt = para_data.get("size_pt", 12)
        color_hex = para_data.get("color")
        align = para_data.get("align", "left")
        bold = para_data.get("bold", False)
        italic = para_data.get("italic", False)
        all_caps = para_data.get("all_caps", False)

        run = p.add_run()
        run.text = text

        # Font settings
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.font.bold = bold
        run.font.italic = italic

        if all_caps:
            try:
                run.font.all_caps = True
            except Exception:
                pass

        color = hex_to_rgb(color_hex)
        if color:
            run.font.color.rgb = color

        # Paragraph alignment
        p.alignment = ALIGN_MAP.get(align, PP_ALIGN.LEFT)

    return txBox


def add_image_zone_to_slide(slide, item, images_dir=None):
    """Add an image placeholder zone (or actual image if available)."""
    pos = item.get("position", {})
    x = Inches(pos.get("x_in", 0))
    y = Inches(pos.get("y_in", 0))
    w = Inches(pos.get("w_in", 1))
    h = Inches(pos.get("h_in", 1))

    linked_file = item.get("linked_file")

    # Try to find the actual linked image
    if linked_file and images_dir:
        img_path = os.path.join(images_dir, linked_file)
        if os.path.exists(img_path):
            try:
                slide.shapes.add_picture(img_path, x, y, w, h)
                return
            except Exception:
                pass

    # Fallback: add a placeholder rectangle
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shape.name = "image_placeholder"
    shape.fill.background()
    # Light gray dashed border
    shape.line.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
    shape.line.width = Pt(0.5)
    shape.line.dash_style = 2  # dash


def add_line_to_slide(slide, item):
    """Add a line shape."""
    pos = item.get("position", {})
    x = Inches(pos.get("x_in", 0))
    y = Inches(pos.get("y_in", 0))
    w = Inches(pos.get("w_in", 0.01))
    h = Inches(pos.get("h_in", 0.01))

    # Determine if horizontal or vertical
    cx = x + w
    cy = y + h
    connector = slide.shapes.add_connector(1, x, y, cx, cy)  # straight connector

    stroke_color = hex_to_rgb(item.get("stroke_color"))
    stroke_weight = item.get("stroke_weight", 1)
    if stroke_color:
        connector.line.color.rgb = stroke_color
    if stroke_weight:
        connector.line.width = Pt(stroke_weight)


def process_item(slide, item, slide_w_in, slide_h_in, images_dir=None, depth=0):
    """Process a single manifest item and add it to the slide."""
    if depth > 5:
        return

    item_type = item.get("type", "other")
    pos = item.get("position", {})

    # Skip tiny invisible items
    if pos.get("w_pt", 0) < 2 or pos.get("h_pt", 0) < 2:
        return

    if item_type == "shape":
        add_shape_to_slide(slide, item, slide_w_in, slide_h_in)

    elif item_type == "text":
        add_text_to_slide(slide, item, slide_w_in, slide_h_in)

    elif item_type == "image":
        add_image_zone_to_slide(slide, item, images_dir)

    elif item_type == "line":
        try:
            add_line_to_slide(slide, item)
        except Exception:
            pass

    elif item_type == "group":
        children = item.get("children", [])
        for child in children:
            process_item(slide, child, slide_w_in, slide_h_in, images_dir, depth + 1)


# --- SLIDE MAP (Bull Bear specific) ---

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


# --- MAIN CONVERTER ---

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
    slide_w = Inches(slide_w_in)
    slide_h = Inches(slide_h_in)

    # Build one .pptx per template type (deduplicated by template_id)
    built_templates = {}

    for slide_data in manifest["slides"]:
        slide_num = slide_data["slide_number"]
        template_id = slide_data.get("template_id") or \
                      BULL_BEAR_SLIDE_MAP.get(slide_num)

        if not template_id:
            print(f"  [WARN] Slide {slide_num}: no template_id, skipping")
            continue

        if template_id in built_templates:
            print(f"  [OK] Slide {slide_num}: template '{template_id}' already built")
            continue

        print(f"  -> Building template '{template_id}' from slide {slide_num}...")

        # Create presentation with single slide
        prs = Presentation()
        prs.slide_width = slide_w
        prs.slide_height = slide_h

        slide_layout = prs.slide_layouts[6]  # blank
        slide = prs.slides.add_slide(slide_layout)

        # Set background color
        bg_color = slide_data.get("background_color")
        set_slide_bg_color(slide, bg_color)

        # Process all items from the manifest (native elements)
        items = slide_data.get("items", [])
        item_count = 0
        for item in items:
            try:
                process_item(slide, item, slide_w_in, slide_h_in, images_dir)
                item_count += 1
            except Exception as e:
                print(f"     [WARN] Item error: {e}")

        # Save
        out_file = output_path / f"{template_id}.pptx"
        try:
            prs.save(str(out_file))
            built_templates[template_id] = str(out_file)
            print(f"     Saved: {out_file} ({item_count} elements)")
        except Exception as e:
            print(f"     ERROR saving: {e}")
            continue

    # Write summary registry
    summary = {
        "deck_family": manifest.get("deck_family", "unknown"),
        "slide_w_in": slide_w_in,
        "slide_h_in": slide_h_in,
        "templates": built_templates,
        "slide_map": {str(k): v for k, v in BULL_BEAR_SLIDE_MAP.items()},
    }
    summary_path = output_path / "template_registry.json"
    with open(str(summary_path), "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\nDone! {len(built_templates)} templates built with native elements.")
    print(f"   Registry: {summary_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert InDesign manifest to native PPTX templates")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--images", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--logos", default=None)
    args = parser.parse_args()

    convert(args.manifest, args.images, args.output, args.logos)
