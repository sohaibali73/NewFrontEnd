'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Download, Copy,
  Type, Save, X, Layers, GripVertical,
} from 'lucide-react';
import { generatePptx, type ParsedSlide } from '@/lib/pptxExport';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EditorSlide {
  id: string;
  title: string;
  bullets: string[];
}

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
  if (!content) return [{ id: genId(), title: 'New Slide', bullets: [''] }];
  const sections = content.split(/^##\s+/gm).filter(Boolean);
  if (sections.length === 0) {
    return [{ id: genId(), title: 'Slide 1', bullets: content.split('\n').filter(l => l.trim()) }];
  }
  return sections.map(section => {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || 'Untitled';
    const bullets = lines.slice(1)
      .map(l => l.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim())
      .filter(Boolean);
    return { id: genId(), title, bullets: bullets.length > 0 ? bullets : [''] };
  });
}

function slidesToMarkdown(slides: EditorSlide[]): string {
  return slides.map(s => {
    const bullets = s.bullets.filter(b => b.trim()).map(b => `- ${b}`).join('\n');
    return `## ${s.title}\n\n${bullets}`;
  }).join('\n\n');
}

let _counter = 0;
function genId() { return `slide_${Date.now()}_${++_counter}`; }

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SlideEditor({ title, initialContent, colors, isDark, onSave, onClose }: SlideEditorProps) {
  const [slides, setSlides] = useState<EditorSlide[]>(() => parseContentToSlides(initialContent));
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const selected = slides[selectedIdx] || null;

  const updateSlide = useCallback((idx: number, updates: Partial<EditorSlide>) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  }, []);

  const addSlide = useCallback(() => {
    const newSlide: EditorSlide = { id: genId(), title: 'New Slide', bullets: [''] };
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

  const handleSave = useCallback(() => {
    const md = slidesToMarkdown(slides);
    onSave(md);
  }, [slides, onSave]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const parsed: ParsedSlide[] = slides.map(s => ({ title: s.title, bullets: s.bullets.filter(b => b.trim()) }));
      const blob = await generatePptx(title, parsed);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PPTX download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [slides, title]);

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

  const border = `1px solid ${colors.border}`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: colors.background,
    }}>
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
          <span style={{
            fontSize: '11px', color: colors.textMuted,
            fontFamily: "'Quicksand', sans-serif",
          }}>
            {slides.length} slides
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleDownload} disabled={downloading} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px',
            background: `linear-gradient(135deg, ${colors.primaryYellow}, #FFD700)`,
            color: '#1a1a1a', border: 'none', borderRadius: '6px',
            cursor: downloading ? 'wait' : 'pointer',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.5px',
          }}>
            <Download size={12} />
            {downloading ? 'EXPORTING...' : 'DOWNLOAD .PPTX'}
          </button>
          <button onClick={handleSave} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', backgroundColor: isDark ? '#00DED1' : '#00b8ab',
            color: '#1a1a1a', border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.5px',
          }}>
            <Save size={12} /> SAVE
          </button>
          <button onClick={onClose} style={{
            padding: '6px 10px', backgroundColor: 'transparent',
            border, borderRadius: '6px', color: colors.textMuted,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ========== Three-Panel Layout ========== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* --- Left: Slide List --- */}
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
            }}>
              <Plus size={10} /> Add
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  padding: '6px 8px', marginBottom: '3px',
                  backgroundColor: selectedIdx === idx
                    ? (isDark ? '#222' : '#e0e0e0')
                    : 'transparent',
                  border: selectedIdx === idx
                    ? `1px solid ${colors.primaryYellow}40`
                    : '1px solid transparent',
                  borderRadius: '6px', cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                {/* Mini slide preview */}
                <div style={{
                  aspectRatio: '16/9', backgroundColor: '#0F0F0F',
                  borderRadius: '4px', marginBottom: '4px',
                  position: 'relative', overflow: 'hidden',
                  border: selectedIdx === idx ? `1px solid ${colors.primaryYellow}` : '1px solid #333',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '2px', backgroundColor: '#FEC00F',
                  }} />
                  <div style={{ padding: '4px 6px' }}>
                    <div style={{
                      fontSize: '5px', fontWeight: 700, color: '#FEC00F',
                      fontFamily: "'Rajdhani', sans-serif",
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {slide.title}
                    </div>
                    {slide.bullets.slice(0, 3).map((b, i) => (
                      <div key={i} style={{
                        fontSize: '3.5px', color: '#999',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', marginTop: '1px',
                      }}>
                        {b ? `• ${b}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 600,
                    color: selectedIdx === idx ? colors.text : colors.textMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '100px',
                  }}>
                    {idx + 1}. {slide.title}
                  </span>
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
            ))}
          </div>
        </div>

        {/* --- Center: Slide Canvas --- */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: isDark ? '#0a0a0a' : '#e0e0e0',
          padding: '20px', overflow: 'auto',
        }}>
          {selected && (
            <div style={{
              width: '100%', maxWidth: '780px', aspectRatio: '16/9',
              backgroundColor: '#0F0F0F', borderRadius: '6px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              overflow: 'hidden', position: 'relative',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '4px', backgroundColor: '#FEC00F',
              }} />

              {/* Slide content */}
              <div style={{ flex: 1, padding: '24px 36px 24px 24px', overflow: 'auto' }}>
                {/* Editable title */}
                <input
                  value={selected.title}
                  onChange={e => updateSlide(selectedIdx, { title: e.target.value })}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    outline: 'none', fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700, fontSize: 'clamp(16px, 2.2vw, 22px)',
                    color: '#FEC00F', letterSpacing: '1.5px',
                    textTransform: 'uppercase', paddingLeft: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #2a2a2a',
                    marginBottom: '16px',
                  }}
                  placeholder="Slide title..."
                />

                {/* Editable bullets */}
                <div style={{ paddingLeft: '12px' }}>
                  {selected.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                      marginBottom: '8px',
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: '#FEC00F', flexShrink: 0,
                        marginTop: '10px',
                      }} />
                      <input
                        value={bullet}
                        onChange={e => updateBullet(selectedIdx, bIdx, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addBullet(selectedIdx);
                          }
                          if (e.key === 'Backspace' && !bullet && selected.bullets.length > 1) {
                            e.preventDefault();
                            removeBullet(selectedIdx, bIdx);
                          }
                        }}
                        style={{
                          flex: 1, background: 'transparent', border: 'none',
                          outline: 'none', fontFamily: "'Quicksand', sans-serif",
                          fontSize: 'clamp(11px, 1.4vw, 14px)', color: '#E0E0E0',
                          lineHeight: 1.6, padding: '2px 0',
                          borderBottom: '1px solid transparent',
                        }}
                        onFocus={e => { e.currentTarget.style.borderBottom = '1px solid #333'; }}
                        onBlur={e => { e.currentTarget.style.borderBottom = '1px solid transparent'; }}
                        placeholder="Type bullet text... (Enter to add, Backspace to remove)"
                      />
                      {selected.bullets.length > 1 && (
                        <button onClick={() => removeBullet(selectedIdx, bIdx)} style={{
                          background: 'none', border: 'none', color: '#444',
                          cursor: 'pointer', padding: '2px', marginTop: '6px',
                          opacity: 0.5,
                        }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addBullet(selectedIdx)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 8px', marginTop: '4px',
                    background: 'none', border: '1px dashed #333',
                    borderRadius: '4px', color: '#555', cursor: 'pointer',
                    fontSize: '11px', fontFamily: "'Quicksand', sans-serif",
                  }}>
                    <Plus size={10} /> Add bullet
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                height: '28px', flexShrink: 0,
                borderTop: '2px solid #FEC00F',
                backgroundColor: '#1A1A1A',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px',
              }}>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '8px', fontWeight: 700,
                  color: '#666', letterSpacing: '2px',
                }}>POTOMAC ASSET MANAGEMENT</span>
                <span style={{
                  fontFamily: "'Quicksand', sans-serif",
                  fontSize: '8px', color: '#666',
                }}>{selectedIdx + 1}</span>
              </div>
            </div>
          )}
        </div>

        {/* --- Right: Properties Panel --- */}
        <div style={{
          width: '240px', flexShrink: 0, borderLeft: border,
          display: 'flex', flexDirection: 'column',
          backgroundColor: isDark ? '#111' : '#f5f5f5',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '12px', borderBottom: border,
          }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: '11px', color: colors.primaryYellow,
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>PROPERTIES</span>
          </div>

          {selected && (
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Slide info */}
              <div>
                <label style={{
                  fontSize: '9px', fontWeight: 700, color: colors.textMuted,
                  fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
                  textTransform: 'uppercase', display: 'block', marginBottom: '4px',
                }}>SLIDE {selectedIdx + 1} OF {slides.length}</label>
              </div>

              {/* Title field */}
              <div>
                <label style={{
                  fontSize: '9px', fontWeight: 700, color: colors.textMuted,
                  fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
                  textTransform: 'uppercase', display: 'block', marginBottom: '4px',
                }}>TITLE</label>
                <input
                  value={selected.title}
                  onChange={e => updateSlide(selectedIdx, { title: e.target.value })}
                  style={{
                    width: '100%', padding: '6px 8px',
                    backgroundColor: colors.inputBg || (isDark ? '#222' : '#fff'),
                    border: `1px solid ${colors.border}`, borderRadius: '4px',
                    color: colors.text, fontSize: '12px', outline: 'none',
                    fontFamily: "'Quicksand', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Bullets count */}
              <div>
                <label style={{
                  fontSize: '9px', fontWeight: 700, color: colors.textMuted,
                  fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
                  textTransform: 'uppercase', display: 'block', marginBottom: '4px',
                }}>BULLET POINTS</label>
                <span style={{ fontSize: '12px', color: colors.text }}>
                  {selected.bullets.filter(b => b.trim()).length} items
                </span>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <button onClick={() => addSlide()} style={{
                  width: '100%', padding: '6px', display: 'flex', alignItems: 'center',
                  gap: '6px', backgroundColor: 'transparent', border,
                  borderRadius: '4px', color: colors.textMuted, cursor: 'pointer',
                  fontSize: '10px', fontFamily: "'Quicksand', sans-serif",
                }}>
                  <Plus size={12} /> Add Slide After
                </button>
                <button onClick={() => duplicateSlide(selectedIdx)} style={{
                  width: '100%', padding: '6px', display: 'flex', alignItems: 'center',
                  gap: '6px', backgroundColor: 'transparent', border,
                  borderRadius: '4px', color: colors.textMuted, cursor: 'pointer',
                  fontSize: '10px', fontFamily: "'Quicksand', sans-serif",
                }}>
                  <Copy size={12} /> Duplicate Slide
                </button>
                {slides.length > 1 && (
                  <button onClick={() => deleteSlide(selectedIdx)} style={{
                    width: '100%', padding: '6px', display: 'flex', alignItems: 'center',
                    gap: '6px', backgroundColor: 'transparent',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '4px', color: '#ef4444', cursor: 'pointer',
                    fontSize: '10px', fontFamily: "'Quicksand', sans-serif",
                  }}>
                    <Trash2 size={12} /> Delete Slide
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlideEditor;
