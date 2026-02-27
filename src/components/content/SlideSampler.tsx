'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Type, ImageIcon, Film, Wand2, ChevronRight,
  X, Play, Columns2, Quote, Layout, Sparkles,
  ChevronLeft, Copy,
} from 'lucide-react';
import type { SlideContentType, SlideLayout } from './SlideEditor';

/* ------------------------------------------------------------------ */
/*  Sample Slide Data                                                  */
/* ------------------------------------------------------------------ */

export interface SampleSlide {
  id: string;
  title: string;
  bullets: string[];
  layout: SlideLayout;
  contentType: SlideContentType;
  notes?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  animationType?: 'fade-in' | 'slide-up' | 'zoom-in' | 'typewriter' | 'stagger';
}

export interface SampleDeck {
  id: string;
  name: string;
  description: string;
  contentType: SlideContentType;
  slides: SampleSlide[];
}

const SAMPLE_DECKS: SampleDeck[] = [
  {
    id: 'text-sample',
    name: 'Market Analysis Report',
    description: 'Standard text-based slides with bullet points, two-column comparisons, and section dividers.',
    contentType: 'text',
    slides: [
      {
        id: 'ts1', title: 'Q4 2025 Market Overview', layout: 'title-only', contentType: 'text',
        bullets: [], notes: 'Opening slide to set context for the quarterly review.',
      },
      {
        id: 'ts2', title: 'Key Performance Metrics', layout: 'title-bullets', contentType: 'text',
        bullets: [
          'Revenue growth of 18.4% YoY exceeding target by 3.2pp',
          'Client retention rate holds steady at 94.7%',
          'New asset inflows of $2.4B in Q4 alone',
          'Operating margin improved to 41.2% from 38.8%',
        ],
        notes: 'Highlight the outperformance vs. targets. Reference slide 4 for breakdown.',
      },
      {
        id: 'ts3', title: 'Growth vs. Risk Assessment', layout: 'two-columns', contentType: 'text',
        bullets: [
          'Strong equity market tailwinds',
          'Diversified revenue streams',
          'Expanding product suite',
          'Geopolitical uncertainty remains',
          'Rate environment shifting',
          'Regulatory pressure increasing',
        ],
        notes: 'Left column = growth factors, Right column = risk factors.',
      },
      {
        id: 'ts4', title: 'Adapt. Execute. Lead.', layout: 'quote', contentType: 'text',
        bullets: [
          'The best time to invest in resilience was yesterday. The second best time is today.',
          'Annual Strategy Report 2025',
        ],
      },
      {
        id: 'ts5', title: 'Strategic Outlook', layout: 'section-divider', contentType: 'text',
        bullets: ['Looking ahead to 2026 and beyond'],
      },
    ],
  },
  {
    id: 'image-sample',
    name: 'Portfolio Visual Showcase',
    description: 'Image-driven slides with full-bleed photos, image grids, and captioned visuals.',
    contentType: 'image',
    slides: [
      {
        id: 'is1', title: 'Global Markets at a Glance', layout: 'full-image', contentType: 'image',
        bullets: [],
        mediaCaption: 'World financial centers connected by data flows',
        notes: 'Use a dramatic skyline photo for impact.',
      },
      {
        id: 'is2', title: 'Sector Allocation', layout: 'image-left', contentType: 'image',
        bullets: [
          'Technology: 28.4% allocation',
          'Healthcare: 19.2% allocation',
          'Financial Services: 15.8%',
          'Energy transition: 12.6%',
        ],
        mediaCaption: 'Sector breakdown pie chart',
        notes: 'Image area will display a pie chart graphic.',
      },
      {
        id: 'is3', title: 'Regional Performance Heat Map', layout: 'image-grid', contentType: 'image',
        bullets: [
          'North America',
          'Europe',
          'Asia Pacific',
          'Emerging Markets',
        ],
        mediaCaption: 'Four-region performance breakdown',
      },
      {
        id: 'is4', title: 'Our Team', layout: 'full-image', contentType: 'image',
        bullets: [],
        mediaCaption: 'Team photo - Annual offsite 2025',
      },
    ],
  },
  {
    id: 'video-sample',
    name: 'Client Onboarding Walkthrough',
    description: 'Video-embedded slides for training, demos, and multimedia presentations.',
    contentType: 'video',
    slides: [
      {
        id: 'vs1', title: 'Welcome to Potomac', layout: 'title-only', contentType: 'video',
        bullets: [],
        notes: 'Start with a warm welcome before the video content.',
      },
      {
        id: 'vs2', title: 'Platform Tour', layout: 'video-embed', contentType: 'video',
        bullets: ['A 3-minute walkthrough of the analyst dashboard'],
        mediaUrl: 'https://www.youtube.com/watch?v=demo-platform-tour',
        mediaCaption: 'Interactive dashboard demonstration',
        notes: 'Pause after the video for Q&A.',
      },
      {
        id: 'vs3', title: 'Risk Management Tools', layout: 'video-embed', contentType: 'video',
        bullets: ['Overview of real-time risk monitoring capabilities'],
        mediaUrl: 'https://www.youtube.com/watch?v=demo-risk-tools',
        mediaCaption: 'Risk dashboard live demo recording',
      },
      {
        id: 'vs4', title: 'Next Steps', layout: 'title-bullets', contentType: 'video',
        bullets: [
          'Schedule your personalized demo session',
          'Review the documentation portal',
          'Connect with your dedicated account manager',
          'Begin trial period with sample data',
        ],
      },
    ],
  },
  {
    id: 'animated-sample',
    name: 'Investment Strategy Reveal',
    description: 'Animated entrance slides with typewriter, fade-in, and staggered content reveals.',
    contentType: 'animated',
    slides: [
      {
        id: 'as1', title: '2026 Investment Thesis', layout: 'animated-intro', contentType: 'animated',
        bullets: ['A new paradigm for institutional asset management'],
        animationType: 'fade-in',
        notes: 'Let the animation complete before speaking.',
      },
      {
        id: 'as2', title: 'Three Pillars of Growth', layout: 'animated-intro', contentType: 'animated',
        bullets: ['Diversification, Technology, and Human Insight'],
        animationType: 'slide-up',
      },
      {
        id: 'as3', title: 'AI-Powered Analytics', layout: 'animated-intro', contentType: 'animated',
        bullets: ['Leveraging machine learning for alpha generation'],
        animationType: 'typewriter',
        notes: 'Typewriter effect emphasizes the technological angle.',
      },
      {
        id: 'as4', title: 'The Future is Now', layout: 'animated-intro', contentType: 'animated',
        bullets: ['Join us in shaping the next era of investment management'],
        animationType: 'zoom-in',
      },
      {
        id: 'as5', title: 'Key Differentiators', layout: 'comparison', contentType: 'animated',
        bullets: [
          'AI-first approach to analysis',
          'Real-time data integration',
          'Transparent fee structure',
          'Traditional analysis methods',
          'Batch processing delays',
          'Complex fee layering',
        ],
        animationType: 'stagger',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Type config                                                        */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<SlideContentType, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  text: { label: 'Text Slides', icon: <Type size={14} />, color: '#FEC00F', desc: 'Bullets, titles, quotes, and text-heavy layouts' },
  image: { label: 'Image Slides', icon: <ImageIcon size={14} />, color: '#00DED1', desc: 'Full-bleed photos, grids, and captioned visuals' },
  video: { label: 'Video Slides', icon: <Film size={14} />, color: '#3B82F6', desc: 'Embedded videos with captions and controls' },
  animated: { label: 'Animated Slides', icon: <Wand2 size={14} />, color: '#FF6B35', desc: 'Entrance animations and reveal transitions' },
};

/* ------------------------------------------------------------------ */
/*  Mini Preview Card (per-slide thumbnail)                            */
/* ------------------------------------------------------------------ */

function MiniPreviewCard({ slide, color }: { slide: SampleSlide; color: string }) {
  const bg = '#0F0F0F';
  const accent = color;

  // Simplified mini render based on layout type
  if (slide.layout === 'title-only' || slide.layout === 'animated-intro') {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', backgroundColor: bg,
        borderRadius: '3px', overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '4px',
      }}>
        {slide.animationType && (
          <div style={{
            position: 'absolute', top: '2px', right: '3px',
            padding: '1px 4px', borderRadius: '6px',
            backgroundColor: `${accent}20`, border: `1px solid ${accent}30`,
          }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '4px', fontWeight: 700, color: accent, letterSpacing: '0.3px' }}>
              {(slide.animationType || '').toUpperCase()}
            </span>
          </div>
        )}
        <div style={{
          fontSize: '5px', fontWeight: 700, color: accent,
          fontFamily: "'Rajdhani', sans-serif", textTransform: 'uppercase',
          letterSpacing: '0.5px', textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{slide.title}</div>
      </div>
    );
  }

  if (slide.layout === 'full-image') {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', backgroundColor: '#1a1a1a',
        borderRadius: '3px', overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ImageIcon size={10} style={{ opacity: 0.15, color: accent }} />
        <div style={{
          position: 'absolute', bottom: '3px', left: '4px',
          fontSize: '4px', fontWeight: 700, color: '#fff',
          fontFamily: "'Rajdhani', sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '90%',
        }}>{slide.title}</div>
      </div>
    );
  }

  if (slide.layout === 'video-embed') {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', backgroundColor: bg,
        borderRadius: '3px', overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '12px', height: '12px', borderRadius: '50%',
          backgroundColor: `${accent}30`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 0, height: 0,
            borderLeft: `5px solid ${accent}`, borderTop: '3px solid transparent',
            borderBottom: '3px solid transparent', marginLeft: '1px',
          }} />
        </div>
      </div>
    );
  }

  // Default: title + mini bullets
  return (
    <div style={{
      width: '100%', aspectRatio: '16/9', backgroundColor: bg,
      borderRadius: '3px', overflow: 'hidden', position: 'relative',
      padding: '4px 6px',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', backgroundColor: accent }} />
      <div style={{
        fontSize: '5px', fontWeight: 700, color: accent,
        fontFamily: "'Rajdhani', sans-serif",
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textTransform: 'uppercase', letterSpacing: '0.3px', marginLeft: '4px',
      }}>{slide.title}</div>
      {slide.bullets.slice(0, 2).map((b, i) => (
        <div key={i} style={{
          fontSize: '3.5px', color: '#999', opacity: 0.6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginTop: '1px', marginLeft: '4px',
        }}>{b ? `\u2022 ${b}` : ''}</div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Deck Detail Drawer                                                 */
/* ------------------------------------------------------------------ */

function DeckDetail({
  deck, colors, isDark, onClose, onUseSample,
}: {
  deck: SampleDeck;
  colors: Record<string, string>;
  isDark: boolean;
  onClose: () => void;
  onUseSample: (deck: SampleDeck) => void;
}) {
  const [previewIdx, setPreviewIdx] = useState(0);
  const config = TYPE_CONFIG[deck.contentType];
  const slide = deck.slides[previewIdx];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: colors.background,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={onClose} style={{
            padding: '4px', background: 'none', border: `1px solid ${colors.border}`,
            borderRadius: '6px', color: colors.textMuted, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ color: config.color, display: 'flex', alignItems: 'center' }}>{config.icon}</span>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '13px', color: colors.text, letterSpacing: '0.5px',
          }}>{deck.name}</span>
        </div>
        <button onClick={() => onUseSample(deck)} style={{
          display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px',
          background: `linear-gradient(135deg, ${config.color}, ${config.color}CC)`,
          color: isDark ? '#0F0F0F' : '#FFFFFF', border: 'none', borderRadius: '6px',
          cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: '11px', letterSpacing: '0.5px',
        }}>
          <Copy size={11} /> USE THIS SAMPLE
        </button>
      </div>

      {/* Main Preview */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', padding: '16px',
      }}>
        {/* Slide Canvas */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#0a0a0a' : '#e0e0e0', borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '100%', maxWidth: '600px', aspectRatio: '16/9',
            borderRadius: '6px', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backgroundColor: '#0F0F0F', position: 'relative',
          }}>
            <SampleSlideRenderer slide={slide} slideIndex={previewIdx} totalSlides={deck.slides.length} deckName={deck.name} color={config.color} />
          </div>
        </div>

        {/* Slide info */}
        <div style={{ padding: '12px 0 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '11px',
                color: config.color, letterSpacing: '0.5px',
              }}>{slide.title}</span>
              <span style={{
                padding: '1px 6px', borderRadius: '8px', fontSize: '8px',
                fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
                backgroundColor: `${config.color}15`, color: config.color,
                letterSpacing: '0.5px', textTransform: 'uppercase',
              }}>{slide.layout}</span>
            </div>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: '11px', color: colors.textMuted,
            }}>
              {previewIdx + 1} / {deck.slides.length}
            </span>
          </div>
          {slide.notes && (
            <p style={{
              fontFamily: "'Quicksand', sans-serif", fontSize: '11px',
              color: colors.textMuted, margin: '4px 0 0', lineHeight: 1.5,
              fontStyle: 'italic',
            }}>{slide.notes}</p>
          )}
        </div>

        {/* Thumbnail strip */}
        <div style={{
          flexShrink: 0, display: 'flex', gap: '6px',
          overflowX: 'auto', paddingBottom: '4px',
        }}>
          {deck.slides.map((s, i) => (
            <button key={s.id} onClick={() => setPreviewIdx(i)}
              style={{
                flexShrink: 0, width: '72px', border: i === previewIdx ? `2px solid ${config.color}` : `1px solid ${isDark ? '#333' : '#ccc'}`,
                borderRadius: '4px', overflow: 'hidden', cursor: 'pointer',
                boxShadow: i === previewIdx ? `0 0 8px ${config.color}30` : 'none',
                padding: 0, backgroundColor: 'transparent',
              }}>
              <MiniPreviewCard slide={s} color={config.color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sample Slide Renderer (for gallery preview)                        */
/* ------------------------------------------------------------------ */

function SampleSlideRenderer({ slide, slideIndex, totalSlides, deckName, color }: {
  slide: SampleSlide; slideIndex: number; totalSlides: number; deckName: string; color: string;
}) {
  const t = {
    bg: '#0F0F0F', accent: color, titleColor: color,
    bodyColor: '#E0E0E0', mutedColor: '#666', footerBg: '#1A1A1A', footerText: '#666',
  };

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
        {slideIndex + 1}
      </span>
    </div>
  );

  // Title slide (first)
  if (slideIndex === 0 && slide.layout === 'title-only') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ height: '4px', backgroundColor: t.accent, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(18px, 2.4vw, 26px)', color: '#FFFFFF',
            letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 8px',
          }}>{deckName}</h2>
          <div style={{ width: '60px', height: '3px', backgroundColor: t.accent, borderRadius: '2px', marginBottom: '8px' }} />
          <p style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(9px, 1vw, 11px)', color: t.mutedColor, margin: 0 }}>
            Sample Content Preview
          </p>
        </div>
        {footer}
      </div>
    );
  }

  // Full image
  if (slide.layout === 'full-image') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.accent}06`, position: 'relative' }}>
          <div style={{ textAlign: 'center', color: t.mutedColor }}>
            <ImageIcon size={36} style={{ opacity: 0.15 }} />
            <div style={{ fontSize: '9px', fontFamily: "'Quicksand', sans-serif", marginTop: '6px', opacity: 0.4 }}>Full-bleed image</div>
          </div>
          <div style={{ position: 'absolute', bottom: '36px', left: '20px', right: '20px' }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#FFFFFF',
              letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px',
            }}>{slide.title}</h2>
            {slide.mediaCaption && (
              <p style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '9px', color: '#aaa', margin: 0 }}>{slide.mediaCaption}</p>
            )}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // Video embed
  if (slide.layout === 'video-embed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 24px' }}>
          <div style={{
            width: '75%', aspectRatio: '16/9', backgroundColor: `${t.accent}08`,
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px dashed ${t.accent}20`, position: 'relative',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: `${t.accent}30`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: `12px solid ${t.accent}`, borderTop: '7px solid transparent',
                borderBottom: '7px solid transparent', marginLeft: '2px',
              }} />
            </div>
          </div>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(11px, 1.4vw, 14px)', color: t.titleColor,
            letterSpacing: '1.5px', textTransform: 'uppercase', margin: '10px 0 2px', textAlign: 'center',
          }}>{slide.title}</h2>
          {slide.mediaCaption && (
            <p style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '9px', color: t.mutedColor, textAlign: 'center', margin: 0 }}>{slide.mediaCaption}</p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // Animated intro
  if (slide.layout === 'animated-intro') {
    const animLabel = (slide.animationType || 'fade-in').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
          <div style={{
            position: 'absolute', top: '8px', right: '10px',
            padding: '2px 6px', borderRadius: '8px',
            backgroundColor: `${t.accent}15`, border: `1px solid ${t.accent}30`,
          }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '6px', fontWeight: 700, color: t.accent, letterSpacing: '0.5px' }}>{animLabel}</span>
          </div>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(16px, 2vw, 22px)', color: t.titleColor,
            letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 8px',
          }}>{slide.title}</h2>
          {slide.bullets[0]?.trim() && (
            <p style={{
              fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(10px, 1.1vw, 12px)',
              color: t.bodyColor, textAlign: 'center', lineHeight: 1.6, maxWidth: '80%',
            }}>{slide.bullets[0]}</p>
          )}
          <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: t.accent, opacity: 0.15 + (i * 0.3) }} />
            ))}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // Image left
  if (slide.layout === 'image-left') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: '40%', backgroundColor: `${t.accent}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${t.accent}15` }}>
            <ImageIcon size={24} style={{ opacity: 0.15, color: t.accent }} />
          </div>
          <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: 'clamp(11px, 1.4vw, 14px)', color: t.titleColor,
              letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px',
            }}>{slide.title}</h2>
            {slide.bullets.map((b, i) => (
              b.trim() ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: t.accent, flexShrink: 0, marginTop: '5px' }} />
                  <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '9px', color: t.bodyColor, lineHeight: 1.4 }}>{b}</span>
                </div>
              ) : null
            ))}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // Image grid
  if (slide.layout === 'image-grid') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ padding: '8px 12px 4px' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(10px, 1.2vw, 12px)', color: t.titleColor,
            letterSpacing: '1px', textTransform: 'uppercase', margin: 0,
          }}>{slide.title}</h2>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '3px', padding: '3px 12px 6px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              backgroundColor: `${t.accent}06`, borderRadius: '3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${t.accent}15`,
            }}>
              <ImageIcon size={10} style={{ opacity: 0.12, color: t.accent }} />
            </div>
          ))}
        </div>
        {footer}
      </div>
    );
  }

  // Quote
  if (slide.layout === 'quote') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 32px' }}>
          <span style={{ fontSize: '36px', color: t.accent, fontFamily: 'Georgia, serif', lineHeight: 1, opacity: 0.5 }}>{'\u201C'}</span>
          <p style={{
            fontFamily: "'Quicksand', sans-serif", fontSize: 'clamp(11px, 1.4vw, 14px)',
            color: t.bodyColor, textAlign: 'center', lineHeight: 1.7, fontStyle: 'italic', maxWidth: '85%', margin: '0 0 6px',
          }}>{slide.bullets[0] || slide.title}</p>
          {slide.bullets[1]?.trim() && (
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', fontWeight: 600, color: t.accent, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
              {'\u2014 '}{slide.bullets[1]}
            </p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // Two columns
  if (slide.layout === 'two-columns') {
    const mid = Math.ceil(slide.bullets.length / 2);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: t.accent }} />
        <div style={{ flex: 1, padding: '14px 20px 14px 16px', overflow: 'hidden' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(11px, 1.4vw, 14px)', color: t.titleColor,
            letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px', paddingLeft: '8px',
          }}>{slide.title}</h2>
          <div style={{ height: '1px', backgroundColor: `${t.accent}25`, margin: '0 0 8px 8px' }} />
          <div style={{ display: 'flex', gap: '12px', paddingLeft: '8px' }}>
            <div style={{ flex: 1 }}>
              {slide.bullets.slice(0, mid).map((b, i) => b.trim() ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: t.accent, flexShrink: 0, marginTop: '5px' }} />
                  <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '9px', color: t.bodyColor, lineHeight: 1.4 }}>{b}</span>
                </div>
              ) : null)}
            </div>
            <div style={{ flex: 1 }}>
              {slide.bullets.slice(mid).map((b, i) => b.trim() ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: t.accent, flexShrink: 0, marginTop: '5px' }} />
                  <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '9px', color: t.bodyColor, lineHeight: 1.4 }}>{b}</span>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // Section divider
  if (slide.layout === 'section-divider') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: `linear-gradient(135deg, ${t.accent}15, ${t.bg})`, backgroundColor: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 36px' }}>
          <div style={{ width: '40px', height: '3px', backgroundColor: t.accent, borderRadius: '2px', marginBottom: '12px' }} />
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(16px, 2vw, 22px)', color: t.titleColor,
            letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', margin: 0,
          }}>{slide.title}</h2>
          {slide.bullets[0]?.trim() && (
            <p style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '10px', color: t.mutedColor, marginTop: '8px', textAlign: 'center' }}>{slide.bullets[0]}</p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // Comparison
  if (slide.layout === 'comparison') {
    const mid = Math.ceil(slide.bullets.length / 2);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
        <div style={{ padding: '10px 12px 4px' }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: 'clamp(11px, 1.4vw, 14px)', color: t.titleColor,
            letterSpacing: '1px', textTransform: 'uppercase', margin: 0, textAlign: 'center',
          }}>{slide.title}</h2>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '2px', padding: '4px 12px' }}>
          <div style={{ flex: 1, backgroundColor: `${t.accent}08`, borderRadius: '4px 0 0 4px', padding: '8px' }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '7px', fontWeight: 700, color: t.accent, letterSpacing: '0.5px', marginBottom: '4px' }}>OPTION A</div>
            {slide.bullets.slice(0, mid).map((b, i) => b.trim() ? (
              <div key={i} style={{ fontSize: '7px', color: t.bodyColor, marginBottom: '2px', fontFamily: "'Quicksand', sans-serif" }}>{b}</div>
            ) : null)}
          </div>
          <div style={{ width: '1px', backgroundColor: `${t.accent}25` }} />
          <div style={{ flex: 1, backgroundColor: '#00DED108', borderRadius: '0 4px 4px 0', padding: '8px' }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '7px', fontWeight: 700, color: '#00DED1', letterSpacing: '0.5px', marginBottom: '4px' }}>OPTION B</div>
            {slide.bullets.slice(mid).map((b, i) => b.trim() ? (
              <div key={i} style={{ fontSize: '7px', color: t.bodyColor, marginBottom: '2px', fontFamily: "'Quicksand', sans-serif" }}>{b}</div>
            ) : null)}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // Default: title + bullets
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: t.bg }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: t.accent }} />
      <div style={{ flex: 1, padding: '14px 20px 14px 16px', overflow: 'hidden' }}>
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: 'clamp(12px, 1.6vw, 16px)', color: t.titleColor,
          letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px', paddingLeft: '8px',
        }}>{slide.title}</h2>
        <div style={{ height: '1px', backgroundColor: `${t.accent}25`, margin: '0 0 8px 8px' }} />
        <div style={{ paddingLeft: '8px' }}>
          {slide.bullets.map((b, i) => b.trim() ? (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '5px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: t.accent, flexShrink: 0, marginTop: '5px' }} />
              <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '10px', color: t.bodyColor, lineHeight: 1.5 }}>{b}</span>
            </div>
          ) : null)}
        </div>
      </div>
      {footer}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main SlideSampler Component                                        */
/* ------------------------------------------------------------------ */

interface SlideSamplerProps {
  colors: Record<string, string>;
  isDark: boolean;
  onUseSample?: (markdown: string, title: string) => void;
}

export function SlideSampler({ colors, isDark, onUseSample }: SlideSamplerProps) {
  const [activeType, setActiveType] = useState<SlideContentType | 'all'>('all');
  const [selectedDeck, setSelectedDeck] = useState<SampleDeck | null>(null);

  const filteredDecks = useMemo(() => {
    if (activeType === 'all') return SAMPLE_DECKS;
    return SAMPLE_DECKS.filter(d => d.contentType === activeType);
  }, [activeType]);

  const handleUseSample = useCallback((deck: SampleDeck) => {
    // Convert sample deck to markdown
    const md = deck.slides.map(s => {
      const bullets = s.bullets.filter(b => b.trim()).map(b => `- ${b}`).join('\n');
      let content = `## ${s.title}\n\n${bullets}`;
      if (s.layout !== 'title-bullets') content += `\n\n<!-- layout: ${s.layout} -->`;
      if (s.contentType !== 'text') content += `\n\n<!-- contentType: ${s.contentType} -->`;
      if (s.mediaUrl) content += `\n\n<!-- mediaUrl: ${s.mediaUrl} -->`;
      if (s.mediaCaption) content += `\n\n<!-- mediaCaption: ${s.mediaCaption} -->`;
      if (s.animationType) content += `\n\n<!-- animationType: ${s.animationType} -->`;
      if (s.notes) content += `\n\n<!-- notes: ${s.notes} -->`;
      return content;
    }).join('\n\n');

    onUseSample?.(md, deck.name);
  }, [onUseSample]);

  // Deck Detail view
  if (selectedDeck) {
    return (
      <DeckDetail
        deck={selectedDeck}
        colors={colors}
        isDark={isDark}
        onClose={() => setSelectedDeck(null)}
        onUseSample={handleUseSample}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: colors.background }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px', borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Sparkles size={15} color={colors.primaryYellow} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '13px', color: colors.primaryYellow,
            letterSpacing: '1px', textTransform: 'uppercase',
          }}>SAMPLE CONTENT GALLERY</span>
        </div>
        <p style={{
          fontFamily: "'Quicksand', sans-serif", fontSize: '11px',
          color: colors.textMuted, margin: '0 0 10px', lineHeight: 1.5,
        }}>
          Explore sample slides for every content type. Preview layouts, then use them as starting points for your own decks.
        </p>

        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveType('all')}
            style={{
              padding: '5px 12px', fontSize: '10px', fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
              borderRadius: '14px', cursor: 'pointer',
              backgroundColor: activeType === 'all' ? `${colors.primaryYellow}20` : 'transparent',
              border: activeType === 'all' ? `1px solid ${colors.primaryYellow}50` : `1px solid ${colors.border}`,
              color: activeType === 'all' ? colors.primaryYellow : colors.textMuted,
            }}>ALL</button>
          {(Object.entries(TYPE_CONFIG) as [SlideContentType, typeof TYPE_CONFIG.text][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setActiveType(key)}
              style={{
                padding: '5px 12px', fontSize: '10px', fontWeight: 700,
                fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
                borderRadius: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                backgroundColor: activeType === key ? `${cfg.color}20` : 'transparent',
                border: activeType === key ? `1px solid ${cfg.color}50` : `1px solid ${colors.border}`,
                color: activeType === key ? cfg.color : colors.textMuted,
              }}>
              {cfg.icon} {cfg.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Deck cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredDecks.map(deck => {
            const cfg = TYPE_CONFIG[deck.contentType];
            return (
              <button key={deck.id} onClick={() => setSelectedDeck(deck)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  backgroundColor: isDark ? '#111' : '#fafafa',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px', padding: '14px', position: 'relative',
                  overflow: 'hidden', transition: 'all 0.15s ease',
                }}>
                {/* Accent bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: cfg.color, borderRadius: '10px 0 0 10px' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '6px' }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</span>
                      <span style={{
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                        fontSize: '13px', color: colors.text, letterSpacing: '0.5px',
                      }}>{deck.name}</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: '8px', fontSize: '8px',
                        fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
                        backgroundColor: `${cfg.color}15`, color: cfg.color,
                        letterSpacing: '0.5px',
                      }}>{deck.slides.length} slides</span>
                    </div>
                    <p style={{
                      fontFamily: "'Quicksand', sans-serif", fontSize: '11px',
                      color: colors.textMuted, margin: '0 0 8px', lineHeight: 1.4,
                    }}>{deck.description}</p>

                    {/* Slide thumbnails strip */}
                    <div style={{ display: 'flex', gap: '4px', overflow: 'hidden' }}>
                      {deck.slides.slice(0, 5).map(slide => (
                        <div key={slide.id} style={{
                          width: '56px', flexShrink: 0,
                          borderRadius: '3px', overflow: 'hidden',
                          border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                        }}>
                          <MiniPreviewCard slide={slide} color={cfg.color} />
                        </div>
                      ))}
                      {deck.slides.length > 5 && (
                        <div style={{
                          width: '56px', aspectRatio: '16/9', flexShrink: 0,
                          borderRadius: '3px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
                          border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                        }}>
                          <span style={{
                            fontFamily: "'Rajdhani', sans-serif", fontSize: '8px',
                            fontWeight: 700, color: colors.textMuted,
                          }}>+{deck.slides.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    color: colors.textMuted, flexShrink: 0, paddingTop: '8px',
                  }}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { SAMPLE_DECKS, TYPE_CONFIG };
export type { SampleDeck as SampleDeckType };
