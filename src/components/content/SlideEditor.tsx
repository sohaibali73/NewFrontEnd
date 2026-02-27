'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Download, Copy,
  Type, Save, X, Layers, GripVertical, Palette, Layout,
  StickyNote, ChevronLeft, Settings2, Columns2, Quote,
  ImageIcon, Minus, AlignCenter,
} from 'lucide-react';
import { generatePptx, type ParsedSlide } from '@/lib/pptxExport';
import { useResponsive } from '@/hooks/useResponsive';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SlideLayout =
  | 'title-bullets' | 'title-only' | 'two-columns' | 'image-left' | 'quote' | 'section-divider'
  | 'full-image' | 'video-embed' | 'animated-intro' | 'image-grid' | 'comparison';

export type SlideContentType = 'text' | 'image' | 'video' | 'animated';

export interface EditorSlide {
  id: string;
  title: string;
  bullets: string[];
  layout: SlideLayout;
  notes: string;
  contentType?: SlideContentType;
  mediaUrl?: string;
  mediaCaption?: string;
  animationType?: 'fade-in' | 'slide-up' | 'zoom-in' | 'typewriter' | 'stagger';
}

export type ThemePreset = 'potomac-dark' | 'minimal-light' | 'bold-color' | 'corporate-blue';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  accent: string;
  accentSecondary: string;
  titleColor: string;
  bodyColor: string;
  mutedColor: string;
  footerBg: string;
  footerText: string;
  label: string;
}

const THEMES: Record<ThemePreset, ThemeColors> = {
  'potomac-dark': {
    bg: '#0F0F0F', cardBg: '#1A1A1A', accent: '#FEC00F', accentSecondary: '#00DED1',
    titleColor: '#FEC00F', bodyColor: '#E0E0E0', mutedColor: '#666',
    footerBg: '#1A1A1A', footerText: '#666', label: 'Potomac Dark',
  },
  'minimal-light': {
    bg: '#FFFFFF', cardBg: '#F8F8F8', accent: '#1A1A1A', accentSecondary: '#666',
    titleColor: '#1A1A1A', bodyColor: '#333', mutedColor: '#999',
    footerBg: '#F0F0F0', footerText: '#999', label: 'Minimal Light',
  },
  'bold-color': {
    bg: '#1B1464', cardBg: '#231C78', accent: '#FF6B35', accentSecondary: '#FFD166',
    titleColor: '#FFD166', bodyColor: '#FFFFFF', mutedColor: '#8B86B8',
    footerBg: '#15104E', footerText: '#8B86B8', label: 'Bold Color',
  },
  'corporate-blue': {
    bg: '#0A1628', cardBg: '#0F1F3D', accent: '#3B82F6', accentSecondary: '#60A5FA',
    titleColor: '#60A5FA', bodyColor: '#E2E8F0', mutedColor: '#64748B',
    footerBg: '#0A1628', footerText: '#64748B', label: 'Corporate Blue',
  },
};

const LAYOUT_OPTIONS: { value: SlideLayout; label: string; icon: React.ReactNode; desc: string; contentType: SlideContentType }[] = [
  { value: 'title-bullets', label: 'Title + Bullets', icon: <Type size={12} />, desc: 'Standard layout', contentType: 'text' },
  { value: 'title-only', label: 'Title Only', icon: <AlignCenter size={12} />, desc: 'Large centered title', contentType: 'text' },
  { value: 'two-columns', label: 'Two Columns', icon: <Columns2 size={12} />, desc: 'Split bullets', contentType: 'text' },
  { value: 'image-left', label: 'Image Left', icon: <ImageIcon size={12} />, desc: 'Image placeholder + text', contentType: 'image' },
  { value: 'quote', label: 'Quote', icon: <Quote size={12} />, desc: 'Centered callout', contentType: 'text' },
  { value: 'section-divider', label: 'Section Break', icon: <Minus size={12} />, desc: 'Full-bleed title', contentType: 'text' },
  { value: 'full-image', label: 'Full Image', icon: <ImageIcon size={12} />, desc: 'Full-bleed image slide', contentType: 'image' },
  { value: 'image-grid', label: 'Image Grid', icon: <ImageIcon size={12} />, desc: '2x2 image gallery', contentType: 'image' },
  { value: 'video-embed', label: 'Video Embed', icon: <Type size={12} />, desc: 'Video with caption', contentType: 'video' },
  { value: 'animated-intro', label: 'Animated Intro', icon: <Type size={12} />, desc: 'Animated entrance text', contentType: 'animated' },
  { value: 'comparison', label: 'Comparison', icon: <Columns2 size={12} />, desc: 'Side-by-side compare', contentType: 'text' },
];

interface SlideEditorProps {
  title: string;
  initialContent: string;
  colors: Record<string, string>;
  isDark: boolean;
  onSave: (content: string) => void;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseContentToSlides(content: string): EditorSlide[] {
  if (!content) return [{ id: genId(), title: 'New Slide', bullets: [''], layout: 'title-bullets', notes: '', contentType: 'text' }];
  const sections = content.split(/^##\s+/gm).filter(Boolean);
  if (sections.length === 0) {
    return [{ id: genId(), title: 'Slide 1', bullets: content.split('\n').filter(l => l.trim()), layout: 'title-bullets', notes: '', contentType: 'text' }];
  }
  return sections.map(section => {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || 'Untitled';

    // Extract notes from HTML comment
    let notes = '';
    const noteMatch = section.match(/<!--\s*notes:\s*([\s\S]*?)\s*-->/);
    if (noteMatch) notes = noteMatch[1].trim();

    // Extract layout from HTML comment
    let layout: SlideLayout = 'title-bullets';
    const layoutMatch = section.match(/<!--\s*layout:\s*(\S+)\s*-->/);
    if (layoutMatch && LAYOUT_OPTIONS.some(o => o.value === layoutMatch[1])) {
      layout = layoutMatch[1] as SlideLayout;
    }

    // Extract content type
    let contentType: SlideContentType = 'text';
    const ctMatch = section.match(/<!--\s*contentType:\s*(\S+)\s*-->/);
    if (ctMatch) contentType = ctMatch[1] as SlideContentType;

    // Extract media URL
    let mediaUrl = '';
    const muMatch = section.match(/<!--\s*mediaUrl:\s*([\s\S]*?)\s*-->/);
    if (muMatch) mediaUrl = muMatch[1].trim();

    // Extract media caption
    let mediaCaption = '';
    const mcMatch = section.match(/<!--\s*mediaCaption:\s*([\s\S]*?)\s*-->/);
    if (mcMatch) mediaCaption = mcMatch[1].trim();

    // Extract animation type
    let animationType: EditorSlide['animationType'];
    const anMatch = section.match(/<!--\s*animationType:\s*(\S+)\s*-->/);
    if (anMatch) animationType = anMatch[1] as EditorSlide['animationType'];

    const bullets = lines.slice(1)
      .map(l => l.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
      .filter(l => l && !l.startsWith('<!--'));
    return { id: genId(), title, bullets: bullets.length > 0 ? bullets : [''], layout, notes, contentType, mediaUrl, mediaCaption, animationType };
  });
}

function slidesToMarkdown(slides: EditorSlide[]): string {
  return slides.map(s => {
    const bullets = s.bullets.filter(b => b.trim()).map(b => `- ${b}`).join('\n');
    let md = `## ${s.title}\n\n${bullets}`;
    if (s.layout !== 'title-bullets') md += `\n\n<!-- layout: ${s.layout} -->`;
    if (s.contentType && s.contentType !== 'text') md += `\n\n<!-- contentType: ${s.contentType} -->`;
    if (s.mediaUrl?.trim()) md += `\n\n<!-- mediaUrl: ${s.mediaUrl.trim()} -->`;
    if (s.mediaCaption?.trim()) md += `\n\n<!-- mediaCaption: ${s.mediaCaption.trim()} -->`;
    if (s.animationType) md += `\n\n<!-- animationType: ${s.animationType} -->`;
    if (s.notes.trim()) md += `\n\n<!-- notes: ${s.notes.trim()} -->`;
    return md;
  }).join('\n\n');
}

let _counter = 0;
function genId() { return `slide_${Date.now()}_${++_counter}`; }

/* ------------------------------------------------------------------ */
/*  Canvas Renderers per Layout                                        */
/* ------------------------------------------------------------------ */

function SlideCanvas({ slide, theme, slideIdx, totalSlides, deckTitle }: {
  slide: EditorSlide; theme: ThemeColors; slideIdx: number; totalSlides: number; deckTitle: string;
}) {
  const t = theme;

  const footer = (
    <div style={{
      height: '28px', flexShrink: 0, borderTop: `2px solid ${t.accent}`,
      backgroundColor: t.footerBg,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
    }}>
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '8px', fontWeight: 700, color: t.footerText, letterSpacing: '2px' }}>
        POTOMAC ASSET MANAGEMENT
      </span>
      <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '8px', color: t.footerText }}>
        {slideIdx + 1}
      </span>
    </div>
  );

  // -- Title Only --
  if (slide.layout === 'title-only') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 36px' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(20px, 2.8vw, 28px)', color: t.titleColor,
            letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', margin: 0,
          }}>{slide.title}</h2>
        </div>
        {footer}
      </div>
    );
  }

  // -- Section Divider --
  if (slide.layout === 'section-divider') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: `linear-gradient(135deg, ${t.accent}22, ${t.bg})`,
        backgroundColor: t.bg,
      }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px 48px',
        }}>
          <div style={{ width: '60px', height: '3px', backgroundColor: t.accent, borderRadius: '2px', marginBottom: '16px' }} />
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(22px, 3vw, 32px)', color: t.titleColor,
            letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', margin: 0,
          }}>{slide.title}</h2>
          {slide.bullets[0]?.trim() && (
            <p style={{
              fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(11px, 1.2vw, 13px)',
              color: t.mutedColor, marginTop: '12px', textAlign: 'center',
            }}>{slide.bullets[0]}</p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // -- Quote --
  if (slide.layout === 'quote') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 48px' }}>
          <span style={{ fontSize: '48px', color: t.accent, fontFamily: 'Georgia, serif', lineHeight: 1, marginBottom: '4px', opacity: 0.5 }}>{'\u201C'}</span>
          <p style={{
            fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(14px, 1.8vw, 18px)',
            color: t.bodyColor, textAlign: 'center', lineHeight: 1.8,
            fontStyle: 'italic', maxWidth: '80%', margin: '0 0 8px',
          }}>{slide.bullets[0] || slide.title}</p>
          {slide.bullets[1]?.trim() && (
            <p style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600,
              color: t.accent, letterSpacing: '1px', textTransform: 'uppercase', margin: 0,
            }}>{'\u2014 '}{slide.bullets[1]}</p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // -- Image Left --
  if (slide.layout === 'image-left') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{
            width: '40%', backgroundColor: `${t.accent}10`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${t.accent}20`,
          }}>
            <div style={{ textAlign: 'center', color: t.mutedColor }}>
              <ImageIcon size={32} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: '9px', fontFamily: "'Quicksand', sans-serif", marginTop: '6px', opacity: 0.5 }}>Image area</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: 'clamp(14px, 1.8vw, 18px)', color: t.titleColor,
              letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px',
            }}>{slide.title}</h2>
            {renderBullets(slide.bullets, t)}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // -- Two Columns --
  if (slide.layout === 'two-columns') {
    const mid = Math.ceil(slide.bullets.length / 2);
    const left = slide.bullets.slice(0, mid);
    const right = slide.bullets.slice(mid);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: t.accent }} />
        <div style={{ flex: 1, padding: '20px 32px 20px 20px', overflow: 'auto' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(14px, 2vw, 20px)', color: t.titleColor,
            letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px', paddingLeft: '12px',
          }}>{slide.title}</h2>
          <div style={{ height: '1px', backgroundColor: `${t.accent}30`, margin: '0 0 14px 12px' }} />
          <div style={{ display: 'flex', gap: '20px', paddingLeft: '12px' }}>
            <div style={{ flex: 1 }}>{renderBullets(left, t)}</div>
            <div style={{ flex: 1 }}>{renderBullets(right, t)}</div>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // -- Full Image --
  if (slide.layout === 'full-image') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {slide.mediaUrl ? (
            <div style={{ flex: 1, backgroundImage: `url(${slide.mediaUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${t.bg}CC, transparent 50%)` }} />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.accent}08` }}>
              <div style={{ textAlign: 'center', color: t.mutedColor }}>
                <ImageIcon size={40} style={{ opacity: 0.2 }} />
                <div style={{ fontSize: '10px', fontFamily: "'Quicksand', sans-serif", marginTop: '8px', opacity: 0.4 }}>Full-bleed image</div>
                <div style={{ fontSize: '8px', fontFamily: "'Quicksand', sans-serif", marginTop: '4px', opacity: 0.3 }}>Add URL in properties</div>
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '40px', left: '24px', right: '24px', zIndex: 1 }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: 'clamp(16px, 2.2vw, 22px)', color: '#FFFFFF',
              letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}>{slide.title}</h2>
            {slide.mediaCaption && (
              <p style={{
                fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(9px, 1vw, 11px)',
                color: '#FFFFFF', opacity: 0.7, margin: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}>{slide.mediaCaption}</p>
            )}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // -- Image Grid --
  if (slide.layout === 'image-grid') {
    const placeholders = [1, 2, 3, 4];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ padding: '12px 16px 6px' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(12px, 1.6vw, 16px)', color: t.titleColor,
            letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0,
          }}>{slide.title}</h2>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', padding: '4px 16px 8px' }}>
          {placeholders.map(i => (
            <div key={i} style={{
              backgroundColor: `${t.accent}08`, borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${t.accent}20`,
            }}>
              <div style={{ textAlign: 'center', color: t.mutedColor }}>
                <ImageIcon size={16} style={{ opacity: 0.2 }} />
                <div style={{ fontSize: '7px', fontFamily: "'Quicksand', sans-serif", marginTop: '2px', opacity: 0.3 }}>Image {i}</div>
              </div>
            </div>
          ))}
        </div>
        {footer}
      </div>
    );
  }

  // -- Video Embed --
  if (slide.layout === 'video-embed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 24px' }}>
          <div style={{
            width: '80%', aspectRatio: '16/9', backgroundColor: `${t.accent}08`,
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px dashed ${t.accent}20`, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: `${t.accent}30`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: `14px solid ${t.accent}`, borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent', marginLeft: '3px',
              }} />
            </div>
            {slide.mediaUrl && (
              <div style={{
                position: 'absolute', bottom: '6px', left: '8px', right: '8px',
                backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '4px 8px',
              }}>
                <span style={{
                  fontFamily: "'Quicksand', sans-serif", fontSize: '7px', color: '#aaa',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                }}>{slide.mediaUrl}</span>
              </div>
            )}
          </div>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(12px, 1.6vw, 16px)', color: t.titleColor,
            letterSpacing: '1.5px', textTransform: 'uppercase', margin: '12px 0 4px', textAlign: 'center',
          }}>{slide.title}</h2>
          {slide.mediaCaption && (
            <p style={{
              fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(9px, 1vw, 11px)',
              color: t.mutedColor, textAlign: 'center', margin: 0,
            }}>{slide.mediaCaption}</p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // -- Animated Intro --
  if (slide.layout === 'animated-intro') {
    const animType = slide.animationType || 'fade-in';
    const animLabel = animType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 36px' }}>
          <div style={{
            position: 'absolute', top: '10px', right: '12px',
            padding: '2px 8px', borderRadius: '10px',
            backgroundColor: `${t.accent}15`, border: `1px solid ${t.accent}30`,
          }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: '7px', fontWeight: 700,
              color: t.accent, letterSpacing: '0.5px',
            }}>{animLabel}</span>
          </div>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(18px, 2.4vw, 26px)', color: t.titleColor,
            letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center',
            margin: '0 0 12px',
          }}>{slide.title}</h2>
          {slide.bullets[0]?.trim() && (
            <p style={{
              fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(11px, 1.2vw, 13px)',
              color: t.bodyColor, textAlign: 'center', lineHeight: 1.7, maxWidth: '80%',
            }}>{slide.bullets[0]}</p>
          )}
          <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: t.accent, opacity: 0.15 + (i * 0.3),
              }} />
            ))}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // -- Comparison --
  if (slide.layout === 'comparison') {
    const mid = Math.ceil(slide.bullets.length / 2);
    const left = slide.bullets.slice(0, mid);
    const right = slide.bullets.slice(mid);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ padding: '14px 16px 4px' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(14px, 1.8vw, 18px)', color: t.titleColor,
            letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0, textAlign: 'center',
          }}>{slide.title}</h2>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '2px', padding: '8px 16px' }}>
          {/* Left column */}
          <div style={{
            flex: 1, backgroundColor: `${t.accent}08`, borderRadius: '6px 0 0 6px',
            padding: '12px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: '9px', fontWeight: 700,
              color: t.accent, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px',
            }}>OPTION A</div>
            {renderBullets(left, t)}
          </div>
          {/* Divider */}
          <div style={{ width: '2px', backgroundColor: `${t.accent}30`, flexShrink: 0, alignSelf: 'stretch' }} />
          {/* Right column */}
          <div style={{
            flex: 1, backgroundColor: `${t.accentSecondary}08`, borderRadius: '0 6px 6px 0',
            padding: '12px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: '9px', fontWeight: 700,
              color: t.accentSecondary, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px',
            }}>OPTION B</div>
            {renderBullets(right, t)}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // -- Default: Title + Bullets --
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: t.accent }} />
      <div style={{ flex: 1, padding: '24px 36px 24px 24px', overflow: 'auto' }}>
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: 'clamp(16px, 2.2vw, 22px)', color: t.titleColor,
          letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px', paddingLeft: '12px',
        }}>{slide.title}</h2>
        <div style={{ height: '1px', backgroundColor: `${t.accent}30`, margin: '0 0 16px 12px' }} />
        <div style={{ paddingLeft: '12px' }}>
          {renderBullets(slide.bullets, t)}
        </div>
      </div>
      {footer}
    </div>
  );
}

function renderBullets(bullets: string[], t: ThemeColors) {
  return bullets.map((b, i) => (
    b.trim() ? (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.accent, flexShrink: 0, marginTop: '7px' }} />
        <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(11px, 1.4vw, 14px)', color: t.bodyColor, lineHeight: 1.6 }}>{b}</span>
      </div>
    ) : null
  ));
}

/* ------------------------------------------------------------------ */
/*  Mini Slide Thumbnail (for left sidebar)                            */
/* ------------------------------------------------------------------ */

function MiniSlide({ slide, theme, isActive }: { slide: EditorSlide; theme: ThemeColors; isActive: boolean }) {
  const t = theme;
  return (
    <div style={{
      aspectRatio: '16/9', backgroundColor: t.bg, borderRadius: '4px',
      position: 'relative', overflow: 'hidden',
      border: isActive ? `1px solid ${t.accent}` : `1px solid ${t.accent}30`,
    }}>
      {slide.layout === 'title-only' || slide.layout === 'section-divider' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '4px' }}>
          <div style={{
            fontSize: '5px', fontWeight: 700, color: t.titleColor,
            fontFamily: "'Rajdhani', sans-serif", textTransform: 'uppercase',
            letterSpacing: '0.5px', textAlign: 'center',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{slide.title}</div>
        </div>
      ) : (
        <>
          {slide.layout !== 'image-left' && (
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', backgroundColor: t.accent }} />
          )}
          <div style={{ padding: '4px 6px' }}>
            <div style={{
              fontSize: '5px', fontWeight: 700, color: t.titleColor,
              fontFamily: "'Rajdhani', sans-serif",
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{slide.title}</div>
            {slide.bullets.slice(0, 3).map((b, i) => (
              <div key={i} style={{
                fontSize: '3.5px', color: t.bodyColor, opacity: 0.6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px',
              }}>{b ? `\u2022 ${b}` : ''}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SlideEditor({ title, initialContent, colors, isDark, onSave, onClose }: SlideEditorProps) {
  const [slides, setSlides] = useState<EditorSlide[]>(() => parseContentToSlides(initialContent));
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [themePreset, setThemePreset] = useState<ThemePreset>('potomac-dark');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  // Mobile state
  const { isMobile } = useResponsive();
  const [mobilePanel, setMobilePanel] = useState<'list' | 'canvas' | 'properties'>('list');

  const theme = THEMES[themePreset];
  const selected = slides[selectedIdx] || null;
  const border = `1px solid ${colors.border}`;

  /* ----- Slide CRUD ----- */
  const updateSlide = useCallback((idx: number, updates: Partial<EditorSlide>) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  }, []);

  const addSlide = useCallback((layoutOverride?: SlideLayout, ct?: SlideContentType) => {
    const newSlide: EditorSlide = {
      id: genId(), title: 'New Slide', bullets: [''], notes: '',
      layout: layoutOverride || 'title-bullets',
      contentType: ct || 'text',
    };
    setSlides(prev => [...prev.slice(0, selectedIdx + 1), newSlide, ...prev.slice(selectedIdx + 1)]);
    setSelectedIdx(prev => prev + 1);
  }, [selectedIdx]);

  const deleteSlide = useCallback((idx: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== idx));
    if (selectedIdx >= idx && selectedIdx > 0) setSelectedIdx(prev => prev - 1);
  }, [slides.length, selectedIdx]);

  const moveSlide = useCallback((idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    setSlides(prev => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
    setSelectedIdx(newIdx);
  }, [slides.length]);

  const duplicateSlide = useCallback((idx: number) => {
    const src = slides[idx];
    const dup: EditorSlide = { ...src, id: genId(), title: `${src.title} (Copy)`, bullets: [...src.bullets] };
    setSlides(prev => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setSelectedIdx(idx + 1);
  }, [slides]);

  /* ----- Drag & Drop ----- */
  const handleDragStart = useCallback((idx: number) => { setDragIdx(idx); }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) setDropIdx(idx);
  }, [dragIdx]);

  const handleDrop = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDropIdx(null); return; }
    setSlides(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    setSelectedIdx(idx);
    setDragIdx(null);
    setDropIdx(null);
  }, [dragIdx]);

  const handleDragEnd = useCallback(() => { setDragIdx(null); setDropIdx(null); }, []);

  /* ----- Bullet editing ----- */
  const updateBullet = useCallback((slideIdx: number, bulletIdx: number, value: string) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      const newBullets = [...s.bullets];
      newBullets[bulletIdx] = value;
      return { ...s, bullets: newBullets };
    }));
  }, []);

  const addBullet = useCallback((slideIdx: number) => {
    setSlides(prev => prev.map((s, i) => i === slideIdx ? { ...s, bullets: [...s.bullets, ''] } : s));
  }, []);

  const removeBullet = useCallback((slideIdx: number, bulletIdx: number) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      if (s.bullets.length <= 1) return s;
      return { ...s, bullets: s.bullets.filter((_, bi) => bi !== bulletIdx) };
    }));
  }, []);

  /* ----- Save / Download ----- */
  const handleSave = useCallback(() => {
    onSave(slidesToMarkdown(slides));
  }, [slides, onSave]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const parsed: ParsedSlide[] = slides.map(s => ({
        title: s.title, bullets: s.bullets.filter(b => b.trim()),
        notes: s.notes || undefined, layout: s.layout,
      }));
      const blob = await generatePptx(title, parsed);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.pptx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { console.error('PPTX download failed:', err); }
    finally { setDownloading(false); }
  }, [slides, title]);

  /* ================================================================ */
  /*  MOBILE LAYOUT                                                    */
  /* ================================================================ */

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: colors.background }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderBottom: border, flexShrink: 0,
          backgroundColor: isDark ? '#111' : '#fafafa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mobilePanel !== 'list' && (
              <button onClick={() => setMobilePanel('list')} style={{
                padding: '6px', background: 'none', border, borderRadius: '6px',
                color: colors.textMuted, cursor: 'pointer', display: 'flex',
              }}><ChevronLeft size={14} /></button>
            )}
            <Layers size={14} color={colors.primaryYellow} />
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: '12px', color: colors.primaryYellow, letterSpacing: '0.5px',
            }}>EDITOR</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={handleSave} style={{
              padding: '6px 10px', backgroundColor: isDark ? '#00DED1' : '#00b8ab',
              color: '#1a1a1a', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '10px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}><Save size={10} /> SAVE</button>
            <button onClick={onClose} style={{
              padding: '6px 8px', backgroundColor: 'transparent', border, borderRadius: '6px',
              color: colors.textMuted, cursor: 'pointer', display: 'flex',
            }}><X size={14} /></button>
          </div>
        </div>

        {/* Mobile panels */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {mobilePanel === 'list' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', borderBottom: border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: colors.textMuted, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>
                  SLIDES ({slides.length})
                </span>
                <button onClick={addSlide} style={{
                  padding: '4px 10px', backgroundColor: colors.primaryYellow, color: '#1a1a1a',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                  fontFamily: "'Rajdhani', sans-serif", display: 'flex', alignItems: 'center', gap: '3px',
                }}><Plus size={10} /> Add</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {slides.map((slide, idx) => (
                  <button key={slide.id} onClick={() => { setSelectedIdx(idx); setMobilePanel('canvas'); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px', marginBottom: '4px', textAlign: 'left', cursor: 'pointer',
                      backgroundColor: selectedIdx === idx ? (isDark ? '#222' : '#e0e0e0') : 'transparent',
                      border: selectedIdx === idx ? `1px solid ${colors.primaryYellow}40` : '1px solid transparent',
                      borderRadius: '8px', transition: 'all 0.1s ease', minHeight: '48px',
                    }}>
                    <div style={{ width: '64px', flexShrink: 0 }}>
                      <MiniSlide slide={slide} theme={theme} isActive={selectedIdx === idx} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {idx + 1}. {slide.title}
                      </div>
                      <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px' }}>
                        {LAYOUT_OPTIONS.find(l => l.value === slide.layout)?.label || 'Standard'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mobilePanel === 'canvas' && selected && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', backgroundColor: isDark ? '#0a0a0a' : '#e0e0e0' }}>
                <div style={{ width: '100%', maxWidth: '560px', aspectRatio: '16/9', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative' }}>
                  <SlideCanvas slide={selected} theme={theme} slideIdx={selectedIdx} totalSlides={slides.length} deckTitle={title} />
                </div>
              </div>
              {/* Mobile bottom nav */}
              <div style={{ display: 'flex', borderTop: border, flexShrink: 0, backgroundColor: isDark ? '#111' : '#fafafa' }}>
                <button onClick={() => setMobilePanel('properties')} style={{
                  flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '11px', letterSpacing: '0.5px',
                }}><Settings2 size={13} /> PROPERTIES</button>
                <button onClick={() => { if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1); }} disabled={selectedIdx === 0} style={{
                  padding: '10px 16px', background: 'none', border: 'none',
                  color: selectedIdx === 0 ? colors.borderSubtle : colors.textMuted, cursor: selectedIdx === 0 ? 'not-allowed' : 'pointer',
                }}><ChevronLeft size={16} /></button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>
                  {selectedIdx + 1} / {slides.length}
                </span>
                <button onClick={() => { if (selectedIdx < slides.length - 1) setSelectedIdx(selectedIdx + 1); }} disabled={selectedIdx === slides.length - 1} style={{
                  padding: '10px 16px', background: 'none', border: 'none',
                  color: selectedIdx === slides.length - 1 ? colors.borderSubtle : colors.textMuted, cursor: selectedIdx === slides.length - 1 ? 'not-allowed' : 'pointer',
                }}><ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} /></button>
              </div>
            </div>
          )}

          {mobilePanel === 'properties' && selected && (
            <div style={{ height: '100%', overflowY: 'auto', padding: '12px' }}>
              {renderPropertiesContent(selected, selectedIdx, slides, theme, colors, isDark, border, updateSlide, addSlide, duplicateSlide, deleteSlide, addBullet, updateBullet, removeBullet, themePreset, setThemePreset)}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  DESKTOP LAYOUT                                                   */
  /* ================================================================ */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: colors.background }}>
      {/* ========== Toolbar ========== */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: border, flexShrink: 0,
        backgroundColor: isDark ? '#111' : '#fafafa',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color={colors.primaryYellow} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '13px', color: colors.primaryYellow,
            letterSpacing: '1px', textTransform: 'uppercase',
          }}>SLIDE EDITOR</span>
          <span style={{ fontSize: '11px', color: colors.textMuted, fontFamily: "'Quicksand', sans-serif" }}>
            {slides.length} slides
          </span>

          {/* Theme picker toggle */}
          <div style={{ position: 'relative', marginLeft: '12px' }}>
            <button onClick={() => setShowThemePicker(!showThemePicker)} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', backgroundColor: showThemePicker ? `${colors.primaryYellow}15` : 'transparent',
              border: showThemePicker ? `1px solid ${colors.primaryYellow}40` : border,
              borderRadius: '6px', cursor: 'pointer', fontSize: '10px',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.5px',
              color: showThemePicker ? colors.primaryYellow : colors.textMuted,
            }}>
              <Palette size={11} />
              {THEMES[themePreset].label.toUpperCase()}
            </button>
            {showThemePicker && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 50,
                backgroundColor: isDark ? '#1a1a1a' : '#fff', border,
                borderRadius: '8px', padding: '4px', minWidth: '160px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}>
                {(Object.entries(THEMES) as [ThemePreset, ThemeColors][]).map(([key, t]) => (
                  <button key={key} onClick={() => { setThemePreset(key); setShowThemePicker(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', background: themePreset === key ? `${t.accent}15` : 'transparent',
                      border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{ width: '20px', height: '14px', borderRadius: '3px', backgroundColor: t.bg, border: `1px solid ${t.accent}`, display: 'flex' }}>
                      <div style={{ width: '50%', backgroundColor: t.accent, borderRadius: '2px 0 0 2px' }} />
                    </div>
                    <span style={{
                      fontSize: '11px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                      color: themePreset === key ? colors.primaryYellow : colors.text,
                      letterSpacing: '0.3px',
                    }}>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleDownload} disabled={downloading} style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
            background: `linear-gradient(135deg, ${colors.primaryYellow}, #FFD700)`,
            color: '#1a1a1a', border: 'none', borderRadius: '6px',
            cursor: downloading ? 'wait' : 'pointer',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px',
          }}>
            <Download size={12} />{downloading ? 'EXPORTING...' : 'DOWNLOAD .PPTX'}
          </button>
          <button onClick={handleSave} style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
            backgroundColor: isDark ? '#00DED1' : '#00b8ab',
            color: '#1a1a1a', border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px',
          }}><Save size={12} /> SAVE</button>
          <button onClick={onClose} style={{
            padding: '6px 10px', backgroundColor: 'transparent', border, borderRadius: '6px',
            color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}><X size={14} /></button>
        </div>
      </div>

      {/* ========== Three-Panel Layout ========== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* --- Left: Slide List (Drag & Drop) --- */}
        <div style={{
          width: '180px', flexShrink: 0, borderRight: border,
          display: 'flex', flexDirection: 'column',
          backgroundColor: isDark ? '#111' : '#f5f5f5',
        }}>
          <div style={{
            padding: '8px', borderBottom: border,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, color: colors.textMuted,
              fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
            }}>SLIDES ({slides.length})</span>
            <button onClick={addSlide} style={{
              padding: '3px 8px', backgroundColor: colors.primaryYellow,
              color: '#1a1a1a', border: 'none', borderRadius: '4px',
              cursor: 'pointer', fontSize: '10px', fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif",
              display: 'flex', alignItems: 'center', gap: '3px',
            }}><Plus size={10} /> Add</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
            {slides.map((slide, idx) => (
              <div key={slide.id}>
                {/* Drop indicator */}
                {dropIdx === idx && dragIdx !== null && dragIdx !== idx && (
                  <div style={{ height: '2px', backgroundColor: colors.primaryYellow, borderRadius: '1px', margin: '2px 4px' }} />
                )}
                <div
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    padding: '6px 8px', marginBottom: '3px',
                    backgroundColor: selectedIdx === idx ? (isDark ? '#222' : '#e0e0e0') : 'transparent',
                    border: selectedIdx === idx ? `1px solid ${colors.primaryYellow}40` : '1px solid transparent',
                    borderRadius: '6px', cursor: 'grab',
                    transition: 'all 0.1s ease',
                    opacity: dragIdx === idx ? 0.4 : 1,
                  }}
                >
                  <MiniSlide slide={slide} theme={theme} isActive={selectedIdx === idx} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <GripVertical size={9} color={colors.textMuted} style={{ opacity: 0.4 }} />
                      <span style={{
                        fontSize: '9px', fontWeight: 600,
                        color: selectedIdx === idx ? colors.text : colors.textMuted,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px',
                      }}>{idx + 1}. {slide.title}</span>
                    </div>
                    {selectedIdx === idx && (
                      <div style={{ display: 'flex', gap: '1px' }}>
                        <button onClick={(e) => { e.stopPropagation(); moveSlide(idx, -1); }}
                          style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '1px' }}>
                          <ChevronUp size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveSlide(idx, 1); }}
                          style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '1px' }}>
                          <ChevronDown size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                          style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '1px' }}>
                          <Copy size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '1px' }}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Center: Slide Canvas --- */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#0a0a0a' : '#e0e0e0',
          padding: '20px', overflow: 'auto', position: 'relative',
        }}>
          {selected && (
            <div style={{
              width: '100%', maxWidth: '780px', aspectRatio: '16/9',
              borderRadius: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              overflow: 'hidden', position: 'relative',
            }}>
              {/* Live editable canvas overlay */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <SlideCanvas slide={selected} theme={theme} slideIdx={selectedIdx} totalSlides={slides.length} deckTitle={title} />
              </div>
              {/* Invisible editing layer */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, padding: '24px 36px 52px 24px', display: 'flex', flexDirection: 'column' }}>
                {/* Title input overlay */}
                <input
                  value={selected.title}
                  onChange={e => updateSlide(selectedIdx, { title: e.target.value })}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    fontSize: 'clamp(16px, 2.2vw, 22px)', color: 'transparent',
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    caretColor: theme.accent, padding: '0',
                    ...(selected.layout === 'title-only' || selected.layout === 'section-divider'
                      ? { textAlign: 'center', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(20px, 2.8vw, 28px)' }
                      : { paddingLeft: '12px', marginBottom: '24px' }),
                  }}
                  placeholder="Slide title..."
                />
                {/* Bullet inputs */}
                {selected.layout !== 'title-only' && selected.layout !== 'section-divider' && (
                  <div style={{ flex: 1, paddingLeft: '12px', paddingTop: '16px' }}>
                    {selected.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'transparent', flexShrink: 0, marginTop: '10px' }} />
                        <input
                          value={bullet}
                          onChange={e => updateBullet(selectedIdx, bIdx, e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); addBullet(selectedIdx); }
                            if (e.key === 'Backspace' && !bullet && selected.bullets.length > 1) { e.preventDefault(); removeBullet(selectedIdx, bIdx); }
                          }}
                          style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(11px, 1.4vw, 14px)',
                            color: 'transparent', lineHeight: 1.6, padding: '2px 0',
                            caretColor: theme.bodyColor,
                            borderBottom: '1px solid transparent',
                          }}
                          onFocus={e => { e.currentTarget.style.borderBottom = `1px solid ${theme.accent}30`; }}
                          onBlur={e => { e.currentTarget.style.borderBottom = '1px solid transparent'; }}
                          placeholder="Type bullet text... (Enter to add)"
                        />
                        {selected.bullets.length > 1 && (
                          <button onClick={() => removeBullet(selectedIdx, bIdx)} style={{
                            background: 'none', border: 'none', color: '#444',
                            cursor: 'pointer', padding: '2px', marginTop: '6px', opacity: 0.5,
                          }}><X size={12} /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addBullet(selectedIdx)} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 8px', marginTop: '4px',
                      background: 'none', border: `1px dashed ${theme.accent}30`,
                      borderRadius: '4px', color: theme.mutedColor, cursor: 'pointer',
                      fontSize: '11px', fontFamily: "'Quicksand', sans-serif",
                    }}><Plus size={10} /> Add bullet</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- Right: Properties Panel --- */}
        <div style={{
          width: '250px', flexShrink: 0, borderLeft: border,
          display: 'flex', flexDirection: 'column',
          backgroundColor: isDark ? '#111' : '#f5f5f5',
          overflowY: 'auto',
        }}>
          {selected && renderPropertiesContent(selected, selectedIdx, slides, theme, colors, isDark, border, updateSlide, addSlide, duplicateSlide, deleteSlide, addBullet, updateBullet, removeBullet, themePreset, setThemePreset)}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Properties Panel Content (shared between mobile & desktop)         */
/* ------------------------------------------------------------------ */

function renderPropertiesContent(
  selected: EditorSlide, selectedIdx: number, slides: EditorSlide[],
  theme: ThemeColors, colors: Record<string, string>, isDark: boolean, border: string,
  updateSlide: (idx: number, u: Partial<EditorSlide>) => void,
  addSlide: () => void, duplicateSlide: (idx: number) => void,
  deleteSlide: (idx: number) => void,
  addBullet: (idx: number) => void,
  updateBullet: (idx: number, bIdx: number, val: string) => void,
  removeBullet: (idx: number, bIdx: number) => void,
  themePreset: ThemePreset, setThemePreset: (t: ThemePreset) => void,
) {
  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700, color: colors.textMuted,
    fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
    textTransform: 'uppercase', display: 'block', marginBottom: '6px',
  };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ borderBottom: border, paddingBottom: '8px' }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: '11px', color: colors.primaryYellow,
          letterSpacing: '1px', textTransform: 'uppercase',
        }}>PROPERTIES</span>
      </div>

      {/* Slide info */}
      <div>
        <label style={labelStyle}>SLIDE {selectedIdx + 1} OF {slides.length}</label>
      </div>

      {/* Layout picker - grouped by content type */}
      <div>
        <label style={labelStyle}>LAYOUT</label>
        {(['text', 'image', 'video', 'animated'] as SlideContentType[]).map(ct => {
          const groupLayouts = LAYOUT_OPTIONS.filter(o => o.contentType === ct);
          if (groupLayouts.length === 0) return null;
          return (
            <div key={ct} style={{ marginBottom: '8px' }}>
              <div style={{
                fontSize: '8px', fontWeight: 700, color: colors.textMuted,
                fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
                textTransform: 'uppercase', marginBottom: '3px', opacity: 0.6,
              }}>{ct}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                {groupLayouts.map(opt => (
                  <button key={opt.value} onClick={() => updateSlide(selectedIdx, { layout: opt.value, contentType: ct })}
                    style={{
                      padding: '5px 7px', display: 'flex', alignItems: 'center', gap: '5px',
                      backgroundColor: selected.layout === opt.value ? `${colors.primaryYellow}15` : 'transparent',
                      border: selected.layout === opt.value ? `1px solid ${colors.primaryYellow}40` : `1px solid ${colors.borderSubtle || colors.border}`,
                      borderRadius: '5px', cursor: 'pointer', textAlign: 'left',
                    }}>
                    <span style={{ color: selected.layout === opt.value ? colors.primaryYellow : colors.textMuted }}>{opt.icon}</span>
                    <span style={{
                      fontSize: '8px', fontFamily: "'Quicksand', sans-serif", fontWeight: 600,
                      color: selected.layout === opt.value ? colors.primaryYellow : colors.textMuted,
                    }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Title field */}
      <div>
        <label style={labelStyle}>TITLE</label>
        <input
          value={selected.title}
          onChange={e => updateSlide(selectedIdx, { title: e.target.value })}
          style={{
            width: '100%', padding: '6px 8px',
            backgroundColor: colors.inputBg || (isDark ? '#222' : '#fff'),
            border: `1px solid ${colors.border}`, borderRadius: '4px',
            color: colors.text, fontSize: '12px', outline: 'none',
            fontFamily: "'Quicksand', sans-serif", boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content type badge */}
      <div>
        <label style={labelStyle}>CONTENT TYPE</label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['text', 'image', 'video', 'animated'] as SlideContentType[]).map(ct => (
            <button key={ct} onClick={() => updateSlide(selectedIdx, { contentType: ct })}
              style={{
                padding: '4px 10px', fontSize: '9px', fontWeight: 700,
                fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
                textTransform: 'uppercase', borderRadius: '12px', cursor: 'pointer',
                backgroundColor: (selected.contentType || 'text') === ct ? `${colors.primaryYellow}20` : 'transparent',
                border: (selected.contentType || 'text') === ct ? `1px solid ${colors.primaryYellow}50` : `1px solid ${colors.borderSubtle || colors.border}`,
                color: (selected.contentType || 'text') === ct ? colors.primaryYellow : colors.textMuted,
              }}>
              {ct}
            </button>
          ))}
        </div>
      </div>

      {/* Bullets count */}
      <div>
        <label style={labelStyle}>BULLET POINTS</label>
        <span style={{ fontSize: '12px', color: colors.text }}>
          {selected.bullets.filter(b => b.trim()).length} items
        </span>
      </div>

      {/* -- Media fields (Image / Video content types) -- */}
      {(selected.contentType === 'image' || selected.contentType === 'video' ||
        selected.layout === 'full-image' || selected.layout === 'image-grid' ||
        selected.layout === 'image-left' || selected.layout === 'video-embed') && (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <ImageIcon size={10} color={colors.primaryYellow} />
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', fontWeight: 700,
              color: colors.primaryYellow, letterSpacing: '1px',
            }}>MEDIA</span>
          </div>
          <div>
            <label style={labelStyle}>{selected.contentType === 'video' || selected.layout === 'video-embed' ? 'VIDEO URL' : 'IMAGE URL'}</label>
            <input
              value={selected.mediaUrl || ''}
              onChange={e => updateSlide(selectedIdx, { mediaUrl: e.target.value })}
              placeholder={selected.contentType === 'video' || selected.layout === 'video-embed' ? 'https://youtube.com/...' : 'https://images.unsplash.com/...'}
              style={{
                width: '100%', padding: '6px 8px',
                backgroundColor: colors.inputBg || (isDark ? '#222' : '#fff'),
                border: `1px solid ${colors.border}`, borderRadius: '4px',
                color: colors.text, fontSize: '11px', outline: 'none',
                fontFamily: "'Quicksand', sans-serif", boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>CAPTION</label>
            <input
              value={selected.mediaCaption || ''}
              onChange={e => updateSlide(selectedIdx, { mediaCaption: e.target.value })}
              placeholder="Describe the media..."
              style={{
                width: '100%', padding: '6px 8px',
                backgroundColor: colors.inputBg || (isDark ? '#222' : '#fff'),
                border: `1px solid ${colors.border}`, borderRadius: '4px',
                color: colors.text, fontSize: '11px', outline: 'none',
                fontFamily: "'Quicksand', sans-serif", boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}

      {/* -- Animation fields (Animated content type) -- */}
      {(selected.contentType === 'animated' || selected.layout === 'animated-intro') && (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', fontWeight: 700,
              color: colors.primaryYellow, letterSpacing: '1px',
            }}>ANIMATION</span>
          </div>
          <div>
            <label style={labelStyle}>ENTRANCE EFFECT</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(['fade-in', 'slide-up', 'zoom-in', 'typewriter', 'stagger'] as const).map(anim => (
                <button key={anim} onClick={() => updateSlide(selectedIdx, { animationType: anim })}
                  style={{
                    width: '100%', padding: '5px 8px', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: selected.animationType === anim ? `${colors.primaryYellow}15` : 'transparent',
                    border: selected.animationType === anim ? `1px solid ${colors.primaryYellow}40` : `1px solid ${colors.borderSubtle || colors.border}`,
                    borderRadius: '4px', cursor: 'pointer',
                  }}>
                  <span style={{
                    fontSize: '9px', fontFamily: "'Quicksand', sans-serif", fontWeight: 600,
                    color: selected.animationType === anim ? colors.primaryYellow : colors.textMuted,
                  }}>{anim.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Speaker Notes */}
      <div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <StickyNote size={10} /> SPEAKER NOTES
        </label>
        <textarea
          value={selected.notes}
          onChange={e => updateSlide(selectedIdx, { notes: e.target.value })}
          placeholder="Add notes for this slide..."
          rows={4}
          style={{
            width: '100%', padding: '8px',
            backgroundColor: colors.inputBg || (isDark ? '#222' : '#fff'),
            border: `1px solid ${colors.border}`, borderRadius: '6px',
            color: colors.text, fontSize: '11px', outline: 'none',
            fontFamily: "'Quicksand', sans-serif", boxSizing: 'border-box',
            resize: 'vertical', lineHeight: 1.6,
          }}
        />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
        <button onClick={() => addSlide()} style={{
          width: '100%', padding: '6px', display: 'flex', alignItems: 'center',
          gap: '6px', backgroundColor: 'transparent', border,
          borderRadius: '4px', color: colors.textMuted, cursor: 'pointer',
          fontSize: '10px', fontFamily: "'Quicksand', sans-serif",
        }}><Plus size={12} /> Add Slide After</button>
        <button onClick={() => duplicateSlide(selectedIdx)} style={{
          width: '100%', padding: '6px', display: 'flex', alignItems: 'center',
          gap: '6px', backgroundColor: 'transparent', border,
          borderRadius: '4px', color: colors.textMuted, cursor: 'pointer',
          fontSize: '10px', fontFamily: "'Quicksand', sans-serif",
        }}><Copy size={12} /> Duplicate Slide</button>
        {slides.length > 1 && (
          <button onClick={() => deleteSlide(selectedIdx)} style={{
            width: '100%', padding: '6px', display: 'flex', alignItems: 'center',
            gap: '6px', backgroundColor: 'transparent',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '4px', color: '#ef4444', cursor: 'pointer',
            fontSize: '10px', fontFamily: "'Quicksand', sans-serif",
          }}><Trash2 size={12} /> Delete Slide</button>
        )}
      </div>
    </div>
  );
}

export default SlideEditor;
