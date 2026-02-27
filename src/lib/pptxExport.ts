'use client';

import PptxGenJS from 'pptxgenjs';
import type { SlideLayout } from '@/components/content/SlideEditor';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SlideContentType = 'text' | 'image' | 'video' | 'animated';

export interface ParsedSlide {
  title: string;
  bullets: string[];
  notes?: string;
  layout?: SlideLayout;
  contentType?: SlideContentType;
  mediaUrl?: string;
  mediaCaption?: string;
  animationType?: 'fade-in' | 'slide-up' | 'zoom-in' | 'typewriter' | 'stagger';
}

/* ------------------------------------------------------------------ */
/*  Parse markdown content into individual slides                      */
/* ------------------------------------------------------------------ */

export function parseMarkdownToSlides(content: string): ParsedSlide[] {
  if (!content) return [];

  const sections = content.split(/^##\s+/gm).filter(Boolean);

  if (sections.length === 0) {
    return [{
      title: 'Slide 1',
      bullets: content.split('\n').filter(l => l.trim()),
    }];
  }

  return sections.map((section) => {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || 'Untitled Slide';

    // Extract notes from HTML comment
    let notes: string | undefined;
    const noteMatch = section.match(/<!--\s*notes:\s*([\s\S]*?)\s*-->/);
    if (noteMatch) notes = noteMatch[1].trim();

    // Extract layout from HTML comment
    let layout: SlideLayout | undefined;
    const layoutMatch = section.match(/<!--\s*layout:\s*(\S+)\s*-->/);
    if (layoutMatch) layout = layoutMatch[1] as SlideLayout;

    // Extract content type
    let contentType: SlideContentType | undefined;
    const ctMatch = section.match(/<!--\s*contentType:\s*(\S+)\s*-->/);
    if (ctMatch) contentType = ctMatch[1] as SlideContentType;

    // Extract media URL
    let mediaUrl: string | undefined;
    const muMatch = section.match(/<!--\s*mediaUrl:\s*([\s\S]*?)\s*-->/);
    if (muMatch) mediaUrl = muMatch[1].trim();

    // Extract media caption
    let mediaCaption: string | undefined;
    const mcMatch = section.match(/<!--\s*mediaCaption:\s*([\s\S]*?)\s*-->/);
    if (mcMatch) mediaCaption = mcMatch[1].trim();

    // Extract animation type
    let animationType: ParsedSlide['animationType'];
    const anMatch = section.match(/<!--\s*animationType:\s*(\S+)\s*-->/);
    if (anMatch) animationType = anMatch[1] as ParsedSlide['animationType'];

    const bodyLines = lines.slice(1).filter(l => l.trim() && !l.trim().startsWith('<!--'));

    const bullets: string[] = [];
    for (const line of bodyLines) {
      const cleaned = line
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .trim();
      if (cleaned) bullets.push(cleaned);
    }

    return { title, bullets, notes, layout, contentType, mediaUrl, mediaCaption, animationType };
  });
}

/* ------------------------------------------------------------------ */
/*  Brand constants                                                    */
/* ------------------------------------------------------------------ */

const BRAND = {
  darkBg: '0F0F0F',
  cardBg: '1A1A1A',
  yellow: 'FEC00F',
  turquoise: '00DED1',
  white: 'FFFFFF',
  lightGray: 'B0B0B0',
  darkGray: '222222',
  midGray: '666666',
  fontTitle: 'Rajdhani',
  fontBody: 'Quicksand',
} as const;

/* ------------------------------------------------------------------ */
/*  Generate PPTX from parsed slides                                   */
/* ------------------------------------------------------------------ */

export async function generatePptx(
  title: string,
  slides: ParsedSlide[],
): Promise<Blob> {
  const pptx = new PptxGenJS();

  pptx.author = 'Potomac Analyst Workbench';
  pptx.company = 'Potomac Asset Management';
  pptx.title = title;
  pptx.layout = 'LAYOUT_WIDE';

  // Define slide master
  pptx.defineSlideMaster({
    title: 'POTOMAC_DARK',
    background: { color: BRAND.darkBg },
    objects: [
      { rect: { x: 0, y: 6.95, w: '100%', h: 0.55, fill: { color: BRAND.cardBg } } },
      { rect: { x: 0, y: 6.93, w: '100%', h: 0.03, fill: { color: BRAND.yellow } } },
      {
        text: {
          text: 'POTOMAC ASSET MANAGEMENT',
          options: {
            x: 0.5, y: 7.05, w: 5, h: 0.35,
            fontSize: 8, fontFace: BRAND.fontTitle,
            color: BRAND.lightGray, bold: true, charSpacing: 2,
          },
        },
      },
      {
        text: {
          text: '{{slideNumber}}',
          options: {
            x: 11.5, y: 7.05, w: 1.5, h: 0.35,
            fontSize: 8, fontFace: BRAND.fontBody,
            color: BRAND.lightGray, align: 'right',
          },
        },
      },
    ],
  });

  // --- TITLE SLIDE ---
  const titleSlide = pptx.addSlide({ masterName: 'POTOMAC_DARK' });

  titleSlide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: '100%', h: 0.06, fill: { color: BRAND.yellow },
  });

  titleSlide.addText(title.toUpperCase(), {
    x: 0.8, y: 1.8, w: 11.7, h: 1.5,
    fontSize: 36, fontFace: BRAND.fontTitle,
    color: BRAND.white, bold: true, charSpacing: 3, lineSpacing: 42,
  });

  titleSlide.addText('Generated by Potomac Analyst Workbench', {
    x: 0.8, y: 3.4, w: 11.7, h: 0.5,
    fontSize: 13, fontFace: BRAND.fontBody, color: BRAND.lightGray,
  });

  titleSlide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.8, y: 4.1, w: 2.5, h: 0.04, fill: { color: BRAND.yellow },
  });

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  titleSlide.addText(dateStr, {
    x: 0.8, y: 4.3, w: 11.7, h: 0.4,
    fontSize: 11, fontFace: BRAND.fontBody, color: BRAND.lightGray,
  });

  // --- CONTENT SLIDES ---
  for (const slide of slides) {
    const s = pptx.addSlide({ masterName: 'POTOMAC_DARK' });
    const layout = slide.layout || 'title-bullets';

    // Add speaker notes if present
    if (slide.notes) {
      s.addNotes(slide.notes);
    }

    // --- Layout-specific rendering ---
    switch (layout) {
      case 'title-only': {
        s.addText(slide.title.toUpperCase(), {
          x: 1, y: 2.5, w: 11.3, h: 2,
          fontSize: 32, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true,
          charSpacing: 3, align: 'center', valign: 'middle',
        });
        break;
      }

      case 'section-divider': {
        // Gradient accent block
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: { color: BRAND.darkBg },
        });
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 5.5, y: 3.0, w: 2.5, h: 0.04, fill: { color: BRAND.yellow },
        });
        s.addText(slide.title.toUpperCase(), {
          x: 1, y: 3.2, w: 11.3, h: 1.5,
          fontSize: 30, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true,
          charSpacing: 4, align: 'center',
        });
        if (slide.bullets[0]?.trim()) {
          s.addText(slide.bullets[0], {
            x: 2, y: 4.8, w: 9.3, h: 0.6,
            fontSize: 13, fontFace: BRAND.fontBody,
            color: BRAND.midGray, align: 'center',
          });
        }
        break;
      }

      case 'quote': {
        s.addText('\u201C', {
          x: 5.5, y: 1.5, w: 2, h: 1,
          fontSize: 72, fontFace: 'Georgia',
          color: BRAND.yellow, align: 'center', bold: true,
        });
        s.addText(slide.bullets[0] || slide.title, {
          x: 1.5, y: 2.5, w: 10.3, h: 2.5,
          fontSize: 20, fontFace: BRAND.fontBody,
          color: BRAND.white, align: 'center',
          italic: true, lineSpacing: 32,
        });
        if (slide.bullets[1]?.trim()) {
          s.addText(`\u2014 ${slide.bullets[1]}`, {
            x: 3, y: 5.2, w: 7.3, h: 0.5,
            fontSize: 12, fontFace: BRAND.fontTitle,
            color: BRAND.yellow, bold: true,
            charSpacing: 1, align: 'center',
          });
        }
        break;
      }

      case 'image-left': {
        // Image placeholder
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0, y: 0, w: 5.33, h: 6.93,
          fill: { color: BRAND.darkGray },
        });
        s.addText('IMAGE', {
          x: 1.5, y: 3.0, w: 2.5, h: 0.5,
          fontSize: 14, fontFace: BRAND.fontTitle,
          color: BRAND.midGray, align: 'center', bold: true, charSpacing: 3,
        });

        // Title
        s.addText(slide.title.toUpperCase(), {
          x: 5.8, y: 0.5, w: 7, h: 0.8,
          fontSize: 20, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true, charSpacing: 2,
        });

        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 5.8, y: 1.35, w: 7, h: 0.015, fill: { color: '333333' },
        });

        if (slide.bullets.length > 0) {
          const bulletRows: PptxGenJS.TextProps[] = slide.bullets.map(b => ({
            text: b,
            options: {
              fontSize: 13, fontFace: BRAND.fontBody,
              color: BRAND.white,
              bullet: { code: '25CF', color: BRAND.yellow } as never,
              lineSpacing: 24, paraSpaceBefore: 3, paraSpaceAfter: 3, indentLevel: 0,
            },
          }));
          s.addText(bulletRows, { x: 5.8, y: 1.6, w: 7, h: 5.0, valign: 'top' });
        }
        break;
      }

      case 'two-columns': {
        // Left accent bar
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0, y: 0, w: 0.06, h: '100%', fill: { color: BRAND.yellow },
        });

        s.addText(slide.title.toUpperCase(), {
          x: 0.8, y: 0.4, w: 11.7, h: 0.8,
          fontSize: 22, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true, charSpacing: 2,
        });

        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0.8, y: 1.25, w: 11.7, h: 0.015, fill: { color: '333333' },
        });

        const mid = Math.ceil(slide.bullets.length / 2);
        const leftBullets = slide.bullets.slice(0, mid);
        const rightBullets = slide.bullets.slice(mid);

        if (leftBullets.length > 0) {
          const rows: PptxGenJS.TextProps[] = leftBullets.map(b => ({
            text: b,
            options: {
              fontSize: 13, fontFace: BRAND.fontBody, color: BRAND.white,
              bullet: { code: '25CF', color: BRAND.yellow } as never,
              lineSpacing: 24, paraSpaceBefore: 3, paraSpaceAfter: 3, indentLevel: 0,
            },
          }));
          s.addText(rows, { x: 0.8, y: 1.5, w: 5.5, h: 5.2, valign: 'top' });
        }

        if (rightBullets.length > 0) {
          const rows: PptxGenJS.TextProps[] = rightBullets.map(b => ({
            text: b,
            options: {
              fontSize: 13, fontFace: BRAND.fontBody, color: BRAND.white,
              bullet: { code: '25CF', color: BRAND.yellow } as never,
              lineSpacing: 24, paraSpaceBefore: 3, paraSpaceAfter: 3, indentLevel: 0,
            },
          }));
          s.addText(rows, { x: 7.0, y: 1.5, w: 5.5, h: 5.2, valign: 'top' });
        }
        break;
      }

      case 'full-image': {
        // Full-bleed image placeholder with title overlay
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: { color: BRAND.darkGray },
        });
        s.addText('FULL IMAGE', {
          x: 4.5, y: 2.8, w: 4.5, h: 0.6,
          fontSize: 18, fontFace: BRAND.fontTitle,
          color: BRAND.midGray, align: 'center', bold: true, charSpacing: 3,
        });
        // Gradient-like overlay at bottom
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0, y: 5.0, w: '100%', h: 1.95,
          fill: { color: BRAND.darkBg },
        });
        s.addText(slide.title.toUpperCase(), {
          x: 0.8, y: 5.2, w: 11.7, h: 0.8,
          fontSize: 24, fontFace: BRAND.fontTitle,
          color: BRAND.white, bold: true, charSpacing: 2,
        });
        if (slide.mediaCaption) {
          s.addText(slide.mediaCaption, {
            x: 0.8, y: 6.0, w: 11.7, h: 0.5,
            fontSize: 11, fontFace: BRAND.fontBody, color: BRAND.lightGray,
          });
        }
        break;
      }

      case 'image-grid': {
        s.addText(slide.title.toUpperCase(), {
          x: 0.8, y: 0.4, w: 11.7, h: 0.8,
          fontSize: 22, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true, charSpacing: 2,
        });
        // 2x2 grid of placeholders
        const gridPositions = [
          { x: 0.8, y: 1.4, w: 5.7, h: 2.6 },
          { x: 6.7, y: 1.4, w: 5.7, h: 2.6 },
          { x: 0.8, y: 4.2, w: 5.7, h: 2.6 },
          { x: 6.7, y: 4.2, w: 5.7, h: 2.6 },
        ];
        gridPositions.forEach((pos, i) => {
          s.addShape('rect' as PptxGenJS.ShapeType, {
            ...pos, fill: { color: BRAND.darkGray },
          });
          s.addText(`Image ${i + 1}`, {
            x: pos.x, y: pos.y + (pos.h / 2) - 0.2, w: pos.w, h: 0.4,
            fontSize: 11, fontFace: BRAND.fontTitle,
            color: BRAND.midGray, align: 'center', charSpacing: 2,
          });
        });
        break;
      }

      case 'video-embed': {
        // Video placeholder
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 1.5, y: 1.0, w: 10.3, h: 4.0,
          fill: { color: BRAND.darkGray },
        });
        // Play button circle
        s.addShape('ellipse' as PptxGenJS.ShapeType, {
          x: 5.9, y: 2.4, w: 1.5, h: 1.2,
          fill: { color: BRAND.yellow + '44' },
        });
        s.addText('\u25B6', {
          x: 5.9, y: 2.4, w: 1.5, h: 1.2,
          fontSize: 28, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, align: 'center', valign: 'middle',
        });
        s.addText(slide.title.toUpperCase(), {
          x: 1.5, y: 5.2, w: 10.3, h: 0.6,
          fontSize: 20, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true, charSpacing: 2, align: 'center',
        });
        if (slide.mediaCaption) {
          s.addText(slide.mediaCaption, {
            x: 2.5, y: 5.8, w: 8.3, h: 0.5,
            fontSize: 12, fontFace: BRAND.fontBody,
            color: BRAND.lightGray, align: 'center',
          });
        }
        break;
      }

      case 'animated-intro': {
        // Animated slides export as static in PPTX
        s.addText(slide.title.toUpperCase(), {
          x: 1, y: 2.0, w: 11.3, h: 1.5,
          fontSize: 30, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true,
          charSpacing: 3, align: 'center',
        });
        if (slide.bullets[0]?.trim()) {
          s.addText(slide.bullets[0], {
            x: 2, y: 3.8, w: 9.3, h: 1.0,
            fontSize: 14, fontFace: BRAND.fontBody,
            color: BRAND.white, align: 'center', lineSpacing: 24,
          });
        }
        // Small animation type badge
        const animLabel = (slide.animationType || 'fade-in').replace('-', ' ').toUpperCase();
        s.addText(`\u2728 ${animLabel}`, {
          x: 4.5, y: 5.2, w: 4.3, h: 0.4,
          fontSize: 9, fontFace: BRAND.fontTitle,
          color: BRAND.midGray, align: 'center', charSpacing: 1,
        });
        break;
      }

      case 'comparison': {
        s.addText(slide.title.toUpperCase(), {
          x: 0.8, y: 0.4, w: 11.7, h: 0.8,
          fontSize: 22, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true, charSpacing: 2, align: 'center',
        });
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0.8, y: 1.25, w: 11.7, h: 0.015, fill: { color: '333333' },
        });
        // Left column
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0.8, y: 1.5, w: 5.5, h: 5.2,
          fill: { color: '1A1A1A' },
        });
        s.addText('OPTION A', {
          x: 0.8, y: 1.6, w: 5.5, h: 0.4,
          fontSize: 10, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true, charSpacing: 2,
        });
        // Vertical divider
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 6.5, y: 1.5, w: 0.03, h: 5.2, fill: { color: BRAND.yellow + '44' },
        });
        // Right column
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 7.0, y: 1.5, w: 5.5, h: 5.2,
          fill: { color: '1A1A1A' },
        });
        s.addText('OPTION B', {
          x: 7.0, y: 1.6, w: 5.5, h: 0.4,
          fontSize: 10, fontFace: BRAND.fontTitle,
          color: BRAND.turquoise, bold: true, charSpacing: 2,
        });
        // Bullets
        const cmpMid = Math.ceil(slide.bullets.length / 2);
        const leftB = slide.bullets.slice(0, cmpMid);
        const rightB = slide.bullets.slice(cmpMid);
        if (leftB.length > 0) {
          const rows: PptxGenJS.TextProps[] = leftB.map(b => ({
            text: b,
            options: {
              fontSize: 12, fontFace: BRAND.fontBody, color: BRAND.white,
              bullet: { code: '25CF', color: BRAND.yellow } as never,
              lineSpacing: 22, paraSpaceBefore: 2, paraSpaceAfter: 2, indentLevel: 0,
            },
          }));
          s.addText(rows, { x: 1.0, y: 2.1, w: 5.0, h: 4.3, valign: 'top' });
        }
        if (rightB.length > 0) {
          const rows: PptxGenJS.TextProps[] = rightB.map(b => ({
            text: b,
            options: {
              fontSize: 12, fontFace: BRAND.fontBody, color: BRAND.white,
              bullet: { code: '25CF', color: BRAND.turquoise } as never,
              lineSpacing: 22, paraSpaceBefore: 2, paraSpaceAfter: 2, indentLevel: 0,
            },
          }));
          s.addText(rows, { x: 7.2, y: 2.1, w: 5.0, h: 4.3, valign: 'top' });
        }
        break;
      }

      default: {
        // Standard title-bullets layout
        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0, y: 0, w: 0.06, h: '100%', fill: { color: BRAND.yellow },
        });

        s.addText(slide.title.toUpperCase(), {
          x: 0.8, y: 0.4, w: 11.7, h: 0.8,
          fontSize: 22, fontFace: BRAND.fontTitle,
          color: BRAND.yellow, bold: true, charSpacing: 2,
        });

        s.addShape('rect' as PptxGenJS.ShapeType, {
          x: 0.8, y: 1.25, w: 11.7, h: 0.015, fill: { color: '333333' },
        });

        if (slide.bullets.length > 0) {
          const bulletRows: PptxGenJS.TextProps[] = slide.bullets.map(b => ({
            text: b,
            options: {
              fontSize: 14, fontFace: BRAND.fontBody, color: BRAND.white,
              bullet: { code: '25CF', color: BRAND.yellow } as never,
              lineSpacing: 26, paraSpaceBefore: 4, paraSpaceAfter: 4, indentLevel: 0,
            },
          }));
          s.addText(bulletRows, { x: 0.8, y: 1.5, w: 11.7, h: 5.2, valign: 'top' });
        }
        break;
      }
    }
  }

  const output = await pptx.write({ outputType: 'blob' });
  return output as Blob;
}

/* ------------------------------------------------------------------ */
/*  Convenience: markdown -> download .pptx                            */
/* ------------------------------------------------------------------ */

export async function downloadSlidesAsPptx(title: string, content: string): Promise<void> {
  const slides = parseMarkdownToSlides(content);
  const blob = await generatePptx(title, slides);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
