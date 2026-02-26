'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Download, Grid, Layers,
} from 'lucide-react';
import { parseMarkdownToSlides, downloadSlidesAsPptx, type ParsedSlide } from '@/lib/pptxExport';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SlidePreviewProps {
  title: string;
  content: string;
  colors: Record<string, string>;
  isDark: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SlidePreview({ title, content, colors, isDark }: SlidePreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const slides = useMemo(() => parseMarkdownToSlides(content), [content]);

  const totalSlides = slides.length;

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < totalSlides) setCurrentSlide(idx);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSlidesAsPptx(title, content);
    } catch (err) {
      console.error('PPTX download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (totalSlides === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: colors.textMuted, fontSize: '14px',
        fontFamily: "'Quicksand', sans-serif",
      }}>
        No slide content to preview
      </div>
    );
  }

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
        backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
        display: 'flex', flexDirection: 'column',
      }
    : {
        display: 'flex', flexDirection: 'column', height: '100%',
      };

  return (
    <div style={containerStyle}>
      {/* ========== Toolbar ========== */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderBottom: `1px solid ${colors.border}`,
        backgroundColor: isDark ? '#111' : '#fafafa',
        flexShrink: 0,
      }}>
        {/* Left: slide counter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '13px', color: colors.primaryYellow,
            letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            SLIDE {currentSlide + 1} OF {totalSlides}
          </span>
        </div>

        {/* Center: navigation */}
        {viewMode === 'single' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <NavButton
              onClick={() => goTo(currentSlide - 1)}
              disabled={currentSlide === 0}
              colors={colors} isDark={isDark}
            >
              <ChevronLeft size={16} />
            </NavButton>

            {/* Slide dots / thumbnails */}
            <div style={{
              display: 'flex', gap: '4px', alignItems: 'center',
              padding: '0 8px',
            }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === currentSlide ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: i === currentSlide
                      ? colors.primaryYellow
                      : (isDark ? '#333' : '#ccc'),
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>

            <NavButton
              onClick={() => goTo(currentSlide + 1)}
              disabled={currentSlide === totalSlides - 1}
              colors={colors} isDark={isDark}
            >
              <ChevronRight size={16} />
            </NavButton>
          </div>
        )}

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ToolbarButton
            onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
            active={viewMode === 'grid'}
            colors={colors} isDark={isDark}
            title={viewMode === 'single' ? 'Grid view' : 'Single view'}
          >
            {viewMode === 'single' ? <Grid size={14} /> : <Layers size={14} />}
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            colors={colors} isDark={isDark}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </ToolbarButton>

          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px',
              background: `linear-gradient(135deg, ${colors.primaryYellow}, #FFD700)`,
              color: '#1a1a1a', border: 'none', borderRadius: '8px',
              cursor: downloading ? 'wait' : 'pointer',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.5px',
              opacity: downloading ? 0.7 : 1,
            }}
          >
            <Download size={13} />
            {downloading ? 'EXPORTING...' : 'DOWNLOAD .PPTX'}
          </button>
        </div>
      </div>

      {/* ========== Slide Area ========== */}
      <div style={{
        flex: 1, overflow: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: viewMode === 'grid' ? '20px' : '24px',
        backgroundColor: isDark ? '#0a0a0a' : '#e8e8e8',
      }}>
        {viewMode === 'single' ? (
          <SingleSlideView
            slide={slides[currentSlide]}
            slideIndex={currentSlide}
            totalSlides={totalSlides}
            title={title}
            colors={colors}
            isDark={isDark}
            isFullscreen={isFullscreen}
          />
        ) : (
          <GridView
            slides={slides}
            currentSlide={currentSlide}
            title={title}
            colors={colors}
            isDark={isDark}
            onSelect={(i) => { setCurrentSlide(i); setViewMode('single'); }}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Single Slide View                                                  */
/* ================================================================== */

function SingleSlideView({
  slide, slideIndex, totalSlides, title, colors, isDark, isFullscreen,
}: {
  slide: ParsedSlide; slideIndex: number; totalSlides: number;
  title: string; colors: Record<string, string>;
  isDark: boolean; isFullscreen: boolean;
}) {
  const isTitle = slideIndex === 0 && totalSlides > 1;

  return (
    <div style={{
      width: '100%',
      maxWidth: isFullscreen ? '1100px' : '820px',
      aspectRatio: '16 / 9',
      backgroundColor: '#0F0F0F',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Yellow top accent */}
      <div style={{
        height: isTitle ? '4px' : '0',
        backgroundColor: '#FEC00F',
        flexShrink: 0,
      }} />

      {/* Left yellow accent bar for content slides */}
      {!isTitle && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: '4px', backgroundColor: '#FEC00F',
        }} />
      )}

      {/* Slide content */}
      <div style={{
        flex: 1,
        padding: isTitle ? '40px 48px' : '28px 48px 28px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isTitle ? 'center' : 'flex-start',
        overflow: 'hidden',
      }}>
        {isTitle ? (
          // Title slide layout
          <>
            <h1 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: '#FFFFFF',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              margin: '0 0 12px',
              lineHeight: 1.2,
            }}>
              {title}
            </h1>
            <p style={{
              fontFamily: "'Quicksand', sans-serif",
              fontSize: 'clamp(11px, 1.4vw, 14px)',
              color: '#888',
              margin: '0 0 16px',
            }}>
              Generated by Potomac Analyst Workbench
            </p>
            <div style={{
              width: '60px', height: '3px', backgroundColor: '#FEC00F',
              margin: '0 0 12px', borderRadius: '2px',
            }} />
            <p style={{
              fontFamily: "'Quicksand', sans-serif",
              fontSize: 'clamp(10px, 1.2vw, 12px)',
              color: '#666',
              margin: 0,
            }}>
              {new Date().toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </>
        ) : (
          // Content slide layout
          <>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(16px, 2.2vw, 22px)',
              color: '#FEC00F',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              margin: '0 0 8px',
              paddingLeft: '12px',
            }}>
              {slide.title}
            </h2>

            <div style={{
              height: '1px', backgroundColor: '#2A2A2A',
              margin: '0 0 16px 12px',
            }} />

            <div style={{
              flex: 1, overflow: 'auto', paddingLeft: '12px',
            }}>
              {slide.bullets.map((bullet, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: '#FEC00F', flexShrink: 0,
                    marginTop: '7px',
                  }} />
                  <span style={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontSize: 'clamp(11px, 1.4vw, 14px)',
                    color: '#E0E0E0',
                    lineHeight: 1.6,
                  }}>
                    {bullet}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer bar */}
      <div style={{
        height: '32px', flexShrink: 0,
        borderTop: '2px solid #FEC00F',
        backgroundColor: '#1A1A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '9px', fontWeight: 700,
          color: '#666', letterSpacing: '2px',
        }}>
          POTOMAC ASSET MANAGEMENT
        </span>
        <span style={{
          fontFamily: "'Quicksand', sans-serif",
          fontSize: '9px', color: '#666',
        }}>
          {slideIndex + 1}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Grid View                                                          */
/* ================================================================== */

function GridView({
  slides, currentSlide, title, colors, isDark, onSelect,
}: {
  slides: ParsedSlide[]; currentSlide: number;
  title: string; colors: Record<string, string>;
  isDark: boolean; onSelect: (i: number) => void;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '16px',
      width: '100%',
      maxWidth: '1200px',
    }}>
      {slides.map((slide, i) => {
        const isActive = i === currentSlide;
        const isTitle = i === 0 && slides.length > 1;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              aspectRatio: '16 / 9',
              backgroundColor: '#0F0F0F',
              borderRadius: '6px',
              border: isActive ? '2px solid #FEC00F' : '2px solid transparent',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: isActive
                ? '0 4px 16px rgba(254,192,15,0.2)'
                : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {/* Left accent */}
            {!isTitle && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '3px', backgroundColor: '#FEC00F',
              }} />
            )}

            {/* Top accent for title */}
            {isTitle && (
              <div style={{
                height: '3px', backgroundColor: '#FEC00F', flexShrink: 0,
              }} />
            )}

            <div style={{
              flex: 1, padding: '12px 14px',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <h3 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '11px',
                color: isTitle ? '#FFFFFF' : '#FEC00F',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                margin: '0 0 6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {isTitle ? title : slide.title}
              </h3>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {slide.bullets.slice(0, 4).map((b, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '5px',
                    marginBottom: '3px',
                  }}>
                    <span style={{
                      width: '3px', height: '3px', borderRadius: '50%',
                      backgroundColor: '#FEC00F', flexShrink: 0,
                      marginTop: '5px',
                    }} />
                    <span style={{
                      fontFamily: "'Quicksand', sans-serif",
                      fontSize: '8px', color: '#999',
                      lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {b}
                    </span>
                  </div>
                ))}
                {slide.bullets.length > 4 && (
                  <span style={{
                    fontSize: '7px', color: '#555',
                    fontFamily: "'Quicksand', sans-serif",
                  }}>
                    +{slide.bullets.length - 4} more...
                  </span>
                )}
              </div>
            </div>

            {/* Slide number badge */}
            <div style={{
              position: 'absolute', bottom: '6px', right: '8px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '9px', fontWeight: 700,
              color: isActive ? '#FEC00F' : '#555',
            }}>
              {i + 1}
            </div>

            {/* Footer */}
            <div style={{
              height: '16px', flexShrink: 0,
              borderTop: '1px solid #FEC00F',
              backgroundColor: '#1A1A1A',
            }} />
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Shared small components                                            */
/* ================================================================== */

function NavButton({ onClick, disabled, children, colors, isDark }: {
  onClick: () => void; disabled: boolean;
  children: React.ReactNode; colors: Record<string, string>; isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        backgroundColor: 'transparent',
        color: disabled ? (isDark ? '#333' : '#ccc') : colors.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

function ToolbarButton({ onClick, active, children, colors, isDark, title }: {
  onClick: () => void; active?: boolean;
  children: React.ReactNode; colors: Record<string, string>;
  isDark: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${active ? colors.primaryYellow : colors.border}`,
        borderRadius: '8px',
        backgroundColor: active
          ? `${colors.primaryYellow}15`
          : 'transparent',
        color: active ? colors.primaryYellow : colors.textMuted,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

export default SlidePreview;
