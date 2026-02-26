'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Loader2, RefreshCw, Pencil, Trash2, Copy,
  Download, MoreVertical, X, Save, Clock,
  CheckCircle2, AlertCircle, ChevronRight, FileDown,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { SlidePreview } from './SlidePreview';
import { downloadSlidesAsPptx } from '@/lib/pptxExport';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  content_type?: string;
  status?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface GeneratingJob {
  jobId: string;
  title: string;
  progress: number;
  status: 'pending' | 'running' | 'complete' | 'failed';
}

export interface ContentSplitPaneProps {
  colors: Record<string, string>;
  isDark: boolean;
  contentType: 'slide' | 'article' | 'document' | 'dashboard';
  icon: LucideIcon;
  label: string;
  items: ContentItem[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onGenerate: (prompt: string, title: string) => Promise<{ job_id: string } | void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<void>;
  onDuplicate: (item: ContentItem) => Promise<void>;
  extraActions?: (item: ContentItem) => React.ReactNode;
  metaLine?: (item: ContentItem) => React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ContentSplitPane({
  colors, isDark, contentType, icon: Icon, label, items, loading,
  onRefresh, onGenerate, onDelete, onUpdate, onDuplicate,
  extraActions, metaLine,
}: ContentSplitPaneProps) {

  const isSlide = contentType === 'slide';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [jobs, setJobs] = useState<GeneratingJob[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const selected = items.find(i => i.id === selectedId) || null;
  const border = `1px solid ${colors.border}`;

  const filtered = items.filter(i =>
    !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-select first item
  useEffect(() => {
    if (items.length > 0 && !selectedId) setSelectedId(items[0].id);
  }, [items, selectedId]);

  // Poll running jobs
  useEffect(() => {
    if (jobs.length === 0 || jobs.every(j => j.status === 'complete' || j.status === 'failed')) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const updated = await Promise.all(
        jobs.map(async (j) => {
          if (j.status === 'complete' || j.status === 'failed') return j;
          try {
            const res = await apiClient.getContentJob(j.jobId);
            const s = res.status || 'pending';
            const p = s === 'complete' ? 100 : s === 'running' ? Math.min(j.progress + 15, 90) : j.progress + 5;
            if (s === 'complete' || s === 'failed') onRefresh();
            return { ...j, status: s, progress: p };
          } catch { return j; }
        })
      );
      setJobs(updated as GeneratingJob[]);
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobs, onRefresh]);

  const handleGenerate = async () => {
    if (!newPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await onGenerate(newPrompt.trim(), newTitle.trim() || `New ${label}`);
      if (res && 'job_id' in res) {
        setJobs(prev => [...prev, {
          jobId: res.job_id, title: newTitle.trim() || `Generating ${label}...`,
          progress: 10, status: 'pending',
        }]);
      } else {
        await onRefresh();
      }
      setNewPrompt(''); setNewTitle(''); setShowNewForm(false);
    } catch (err) { console.error('Generation failed:', err); }
    finally { setGenerating(false); }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    await onUpdate(selected.id, { title: editTitle, content: editContent });
    setIsEditing(false);
    await onRefresh();
  };

  const handleStartEdit = (item: ContentItem) => {
    setEditContent(item.content); setEditTitle(item.title); setIsEditing(true);
  };

  const handleDownload = async (item: ContentItem) => {
    if (isSlide) {
      // Download as PPTX for slide decks
      try {
        await downloadSlidesAsPptx(item.title, item.content);
      } catch (err) {
        console.error('PPTX download failed:', err);
      }
    } else {
      // Download as text for other content types
      const blob = new Blob([`${item.title}\n${'='.repeat(50)}\n\n${item.content}`], { type: 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${item.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`; a.click();
    }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const wordCount = (s: string) => s ? s.split(/\s+/).filter(Boolean).length : 0;
  const readTime = (s: string) => { const w = wordCount(s); return w < 200 ? '< 1 min' : `${Math.ceil(w / 200)} min`; };

  // ---------- RENDER ----------
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: colors.background }}>

      {/* ========== LEFT PANEL ========== */}
      <LeftPanel
        colors={colors} isDark={isDark} icon={Icon} label={label} isSlide={isSlide}
        items={filtered} jobs={jobs} loading={loading} selectedId={selectedId}
        searchQuery={searchQuery} showNewForm={showNewForm} newPrompt={newPrompt}
        newTitle={newTitle} generating={generating} menuOpenId={menuOpenId}
        confirmDeleteId={confirmDeleteId} metaLine={metaLine}
        onSelect={setSelectedId} onSearch={setSearchQuery}
        onToggleNew={() => setShowNewForm(p => !p)} onNewPrompt={setNewPrompt}
        onNewTitle={setNewTitle} onGenerate={handleGenerate}
        onRefresh={onRefresh} onMenuToggle={setMenuOpenId}
        onDelete={async (id) => { await onDelete(id); if (selectedId === id) setSelectedId(null); setConfirmDeleteId(null); }}
        onDuplicate={onDuplicate} onConfirmDelete={setConfirmDeleteId}
      />

      {/* ========== RIGHT PANEL ========== */}
      <RightPanel
        colors={colors} isDark={isDark} label={label} isSlide={isSlide}
        selected={selected} isEditing={isEditing} editContent={editContent}
        editTitle={editTitle} icon={Icon}
        onEditContent={setEditContent} onEditTitle={setEditTitle}
        onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setIsEditing(false)} onDownload={handleDownload}
        onDuplicate={onDuplicate} onDelete={onDelete}
        extraActions={extraActions} wordCount={wordCount} readTime={readTime}
        formatDate={formatDate} onRefresh={onRefresh} selectedId={selectedId}
        setSelectedId={setSelectedId}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes progressPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ================================================================== */
/*  LEFT PANEL                                                         */
/* ================================================================== */

interface LeftPanelProps {
  colors: Record<string, string>; isDark: boolean; icon: LucideIcon; label: string; isSlide: boolean;
  items: ContentItem[]; jobs: GeneratingJob[]; loading: boolean; selectedId: string | null;
  searchQuery: string; showNewForm: boolean; newPrompt: string; newTitle: string;
  generating: boolean; menuOpenId: string | null; confirmDeleteId: string | null;
  metaLine?: (item: ContentItem) => React.ReactNode;
  onSelect: (id: string) => void; onSearch: (q: string) => void;
  onToggleNew: () => void; onNewPrompt: (v: string) => void; onNewTitle: (v: string) => void;
  onGenerate: () => void; onRefresh: () => Promise<void>; onMenuToggle: (id: string | null) => void;
  onDelete: (id: string) => Promise<void>; onDuplicate: (item: ContentItem) => Promise<void>;
  onConfirmDelete: (id: string | null) => void;
}

function LeftPanel({
  colors, isDark, icon: Icon, label, isSlide, items, jobs, loading, selectedId,
  searchQuery, showNewForm, newPrompt, newTitle, generating, menuOpenId, confirmDeleteId,
  metaLine, onSelect, onSearch, onToggleNew, onNewPrompt, onNewTitle,
  onGenerate, onRefresh, onMenuToggle, onDelete, onDuplicate, onConfirmDelete,
}: LeftPanelProps) {
  const border = `1px solid ${colors.border}`;
  const activeJobs = jobs.filter(j => j.status !== 'complete' && j.status !== 'failed');

  return (
    <div style={{
      width: '40%', minWidth: '320px', maxWidth: '480px',
      borderRight: border, display: 'flex', flexDirection: 'column',
      backgroundColor: colors.surface, flexShrink: 0,
    }}>
      {/* -- Top bar: title + new button -- */}
      <div style={{
        padding: '16px 16px 12px', borderBottom: border,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: `linear-gradient(135deg, ${colors.primaryYellow}, ${colors.accentYellow || '#FFD700'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} color={colors.darkGray} />
          </div>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '14px',
            color: colors.text, letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            {label}s ({items.length})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onRefresh()} style={{
            padding: '7px', background: 'none', border, borderRadius: '8px',
            color: colors.textMuted, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}><RefreshCw size={13} /></button>
          <button onClick={onToggleNew} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
            backgroundColor: showNewForm ? 'transparent' : colors.primaryYellow,
            color: showNewForm ? colors.textMuted : colors.darkGray,
            border: showNewForm ? border : 'none', borderRadius: '8px',
            cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px',
          }}>
            {showNewForm ? <X size={13} /> : <Plus size={13} />}
            {showNewForm ? 'CANCEL' : 'NEW'}
          </button>
        </div>
      </div>

      {/* -- New creation form (inline) -- */}
      {showNewForm && (
        <div style={{
          padding: '14px 16px', borderBottom: border,
          backgroundColor: isDark ? 'rgba(254,192,15,0.04)' : 'rgba(254,192,15,0.06)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <input
            value={newTitle} onChange={e => onNewTitle(e.target.value)}
            placeholder={`${label} title (optional)`}
            style={{
              width: '100%', padding: '9px 12px', marginBottom: '8px',
              backgroundColor: colors.inputBg, border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '8px', color: colors.text, fontSize: '13px',
              fontFamily: "'Quicksand', sans-serif", outline: 'none',
            }}
          />
          <textarea
            value={newPrompt} onChange={e => onNewPrompt(e.target.value)}
            placeholder={`Describe the ${label.toLowerCase()} you want to generate...`}
            rows={3}
            style={{
              width: '100%', padding: '9px 12px', resize: 'vertical',
              backgroundColor: colors.inputBg, border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '8px', color: colors.text, fontSize: '13px',
              fontFamily: "'Quicksand', sans-serif", outline: 'none', lineHeight: 1.5,
            }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onGenerate(); }}
          />
          <button onClick={onGenerate} disabled={generating || !newPrompt.trim()} style={{
            width: '100%', marginTop: '8px', padding: '10px',
            background: generating || !newPrompt.trim()
              ? (isDark ? '#333' : '#ddd')
              : `linear-gradient(135deg, ${colors.primaryYellow}, ${colors.accentYellow || '#FFD700'})`,
            color: generating || !newPrompt.trim() ? colors.textMuted : colors.darkGray,
            border: 'none', borderRadius: '8px', cursor: generating ? 'wait' : 'pointer',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px',
            letterSpacing: '0.5px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
          }}>
            {generating && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {generating ? 'GENERATING...' : 'GENERATE'}
          </button>
          <div style={{ fontSize: '10px', color: colors.textSecondary, marginTop: '6px', textAlign: 'center' }}>
            Press Ctrl+Enter to generate
          </div>
        </div>
      )}

      {/* -- Search bar -- */}
      <div style={{ padding: '10px 16px', borderBottom: border }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
          backgroundColor: colors.inputBg, borderRadius: '8px',
          border: `1px solid ${colors.borderSubtle}`,
        }}>
          <Search size={14} color={colors.textSecondary} />
          <input
            value={searchQuery} onChange={e => onSearch(e.target.value)}
            placeholder="Search..." style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: colors.text, fontSize: '13px', fontFamily: "'Quicksand', sans-serif",
            }}
          />
          {searchQuery && (
            <button onClick={() => onSearch('')} style={{
              background: 'none', border: 'none', color: colors.textSecondary,
              cursor: 'pointer', padding: '2px', display: 'flex',
            }}><X size={12} /></button>
          )}
        </div>
      </div>

      {/* -- Active jobs -- */}
      {activeJobs.map(j => (
        <div key={j.jobId} style={{
          padding: '12px 16px', borderBottom: border,
          backgroundColor: isDark ? 'rgba(254,192,15,0.05)' : 'rgba(254,192,15,0.08)',
          animation: 'progressPulse 2s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Loader2 size={13} color={colors.primaryYellow} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{
              fontSize: '12px', fontWeight: 600, color: colors.primaryYellow,
              fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
            }}>GENERATING</span>
          </div>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '8px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{j.title}</div>
          <div style={{
            height: '4px', borderRadius: '2px', backgroundColor: isDark ? '#333' : '#e0e0e0',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '2px', width: `${j.progress}%`,
              background: `linear-gradient(90deg, ${colors.primaryYellow}, ${colors.accentYellow || '#FFD700'})`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ fontSize: '10px', color: colors.textSecondary, marginTop: '4px' }}>
            {j.progress}% complete
          </div>
        </div>
      ))}

      {/* -- Item list -- */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={22} color={colors.primaryYellow} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : items.length === 0 && !searchQuery ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: '12px', padding: '40px 20px',
          }}>
            <Icon size={40} color={colors.textSecondary} style={{ opacity: 0.2 }} />
            <p style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '14px',
              color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>No {label.toLowerCase()}s yet</p>
            <p style={{ fontSize: '12px', color: colors.textSecondary, textAlign: 'center' }}>
              Click NEW to create your first {label.toLowerCase()} using AI
            </p>
          </div>
        ) : items.length === 0 && searchQuery ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: '8px', padding: '40px 20px',
          }}>
            <Search size={28} color={colors.textSecondary} style={{ opacity: 0.2 }} />
            <p style={{ fontSize: '13px', color: colors.textMuted }}>No results for &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          items.map(item => {
            const isActive = selectedId === item.id;
            const isMenuOpen = menuOpenId === item.id;
            const isConfirmDel = confirmDeleteId === item.id;
            return (
              <div key={item.id} style={{ position: 'relative', marginBottom: '2px' }}>
                <button
                  onClick={() => onSelect(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 12px', textAlign: 'left', cursor: 'pointer',
                    backgroundColor: isActive ? (isDark ? '#252525' : '#eef0f2') : 'transparent',
                    border: isActive ? `1px solid ${colors.primaryYellow}30` : '1px solid transparent',
                    borderRadius: '10px', transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                    backgroundColor: isActive
                      ? (isDark ? `${colors.primaryYellow}20` : `${colors.primaryYellow}18`)
                      : (isDark ? '#2A2A2A' : '#e8e8e8'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}>
                    <Icon size={16} color={isActive ? colors.primaryYellow : colors.textMuted} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 600,
                      color: isActive ? colors.text : colors.textMuted,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{item.title}</div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      marginTop: '3px', fontSize: '10px', color: colors.textSecondary,
                    }}>
                      {item.status === 'generating' && (
                        <span style={{
                          padding: '1px 6px', borderRadius: '4px', fontSize: '9px',
                          backgroundColor: `${colors.primaryYellow}20`, color: colors.primaryYellow,
                          fontWeight: 700, letterSpacing: '0.3px',
                        }}>GENERATING</span>
                      )}
                      {item.status === 'complete' && (
                        <CheckCircle2 size={10} color={colors.turquoise || '#00DED1'} />
                      )}
                      {metaLine ? metaLine(item) : (
                        <>
                          <Clock size={9} />
                          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight size={14} color={colors.primaryYellow} style={{ flexShrink: 0 }} />
                  )}
                </button>

                {/* Context menu trigger */}
                <button
                  onClick={(e) => { e.stopPropagation(); onMenuToggle(isMenuOpen ? null : item.id); }}
                  style={{
                    position: 'absolute', top: '10px', right: '8px', padding: '4px',
                    background: 'none', border: 'none', color: colors.textSecondary,
                    cursor: 'pointer', opacity: isActive || isMenuOpen ? 1 : 0,
                    transition: 'opacity 0.15s ease', borderRadius: '4px',
                  }}
                ><MoreVertical size={14} /></button>

                {/* Context menu dropdown */}
                {isMenuOpen && (
                  <div style={{
                    position: 'absolute', top: '36px', right: '8px', zIndex: 50,
                    backgroundColor: colors.cardBg, border, borderRadius: '10px',
                    padding: '4px', minWidth: '150px',
                    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
                    animation: 'fadeIn 0.15s ease',
                  }}>
                    {[
                      { icon: Copy, text: 'Duplicate', action: () => { onDuplicate(item); onMenuToggle(null); } },
                      { icon: Download, text: isSlide ? 'Download .pptx' : 'Download', action: async () => {
                        if (isSlide) {
                          await downloadSlidesAsPptx(item.title, item.content);
                        } else {
                          const blob = new Blob([`${item.title}\n${'='.repeat(50)}\n\n${item.content}`], { type: 'text/plain' });
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                          a.download = `${item.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`; a.click();
                        }
                        onMenuToggle(null);
                      }},
                      { icon: Trash2, text: 'Delete', action: () => { onConfirmDelete(item.id); onMenuToggle(null); }, danger: true },
                    ].map(({ icon: MI, text, action, danger }) => (
                      <button key={text} onClick={action} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', background: 'none', border: 'none',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                        color: danger ? '#ef4444' : colors.text,
                        fontFamily: "'Quicksand', sans-serif",
                      }}><MI size={13} />{text}</button>
                    ))}
                  </div>
                )}

                {/* Delete confirmation */}
                {isConfirmDel && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
                    borderRadius: '10px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', zIndex: 50,
                    animation: 'fadeIn 0.15s ease',
                  }}>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>Delete?</span>
                    <button onClick={() => onDelete(item.id)} style={{
                      padding: '5px 12px', backgroundColor: '#ef4444', color: '#fff',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
                    }}>YES</button>
                    <button onClick={() => onConfirmDelete(null)} style={{
                      padding: '5px 12px', backgroundColor: isDark ? '#333' : '#ddd',
                      color: colors.text, border: 'none', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                      fontFamily: "'Rajdhani', sans-serif",
                    }}>NO</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  RIGHT PANEL                                                        */
/* ================================================================== */

interface RightPanelProps {
  colors: Record<string, string>; isDark: boolean; label: string;
  isSlide: boolean;
  selected: ContentItem | null; isEditing: boolean; editContent: string;
  editTitle: string; icon: LucideIcon;
  onEditContent: (v: string) => void; onEditTitle: (v: string) => void;
  onStartEdit: (item: ContentItem) => void; onSaveEdit: () => void;
  onCancelEdit: () => void; onDownload: (item: ContentItem) => void;
  onDuplicate: (item: ContentItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  extraActions?: (item: ContentItem) => React.ReactNode;
  wordCount: (s: string) => number; readTime: (s: string) => string;
  formatDate: (d?: string) => string;
  onRefresh: () => Promise<void>; selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

function RightPanel({
  colors, isDark, label, isSlide, selected, isEditing, editContent, editTitle, icon: Icon,
  onEditContent, onEditTitle, onStartEdit, onSaveEdit, onCancelEdit, onDownload,
  onDuplicate, extraActions, wordCount, readTime, formatDate,
}: RightPanelProps) {
  const border = `1px solid ${colors.border}`;

  // Empty state
  if (!selected) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.background,
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 20px',
            backgroundColor: isDark ? '#1A1A1A' : '#f0f0f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={32} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          </div>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px',
            color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1px',
            margin: '0 0 6px',
          }}>Select a {label.toLowerCase()}</p>
          <p style={{
            fontSize: '13px', color: colors.textSecondary, margin: 0,
            fontFamily: "'Quicksand', sans-serif",
          }}>
            Choose an item from the list or create a new one
          </p>
        </div>
      </div>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        backgroundColor: colors.background, overflow: 'hidden',
      }}>
        {/* Edit header */}
        <div style={{
          padding: '14px 20px', borderBottom: border,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: isDark ? 'rgba(254,192,15,0.03)' : 'rgba(254,192,15,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Pencil size={15} color={colors.primaryYellow} />
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px',
              color: colors.primaryYellow, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>EDITING</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancelEdit} style={{
              padding: '7px 16px', backgroundColor: 'transparent', border,
              borderRadius: '8px', color: colors.textMuted, cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '12px',
              letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px',
            }}><X size={13} /> CANCEL</button>
            <button onClick={onSaveEdit} style={{
              padding: '7px 16px',
              background: `linear-gradient(135deg, ${colors.primaryYellow}, ${colors.accentYellow || '#FFD700'})`,
              border: 'none', borderRadius: '8px', color: colors.darkGray, cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '12px',
              letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px',
            }}><Save size={13} /> SAVE</button>
          </div>
        </div>

        {/* Title input */}
        <div style={{ padding: '12px 20px 0' }}>
          <input
            value={editTitle} onChange={e => onEditTitle(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              backgroundColor: colors.inputBg, border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '8px', color: colors.text, fontSize: '16px', fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif", outline: 'none', letterSpacing: '0.5px',
            }}
          />
        </div>

        {/* Content editor */}
        <div style={{ flex: 1, padding: '12px 20px 20px', overflow: 'hidden' }}>
          <textarea
            value={editContent} onChange={e => onEditContent(e.target.value)}
            style={{
              width: '100%', height: '100%', padding: '14px',
              backgroundColor: colors.inputBg, border: `1px solid ${colors.borderSubtle}`,
              borderRadius: '10px', color: colors.text, fontSize: '13px',
              fontFamily: "'Quicksand', sans-serif", outline: 'none',
              lineHeight: 1.7, resize: 'none',
            }}
          />
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      backgroundColor: colors.background, overflow: 'hidden',
    }}>
      {/* View header */}
      <div style={{
        padding: '16px 24px', borderBottom: border,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '20px',
            color: colors.text, letterSpacing: '0.5px', margin: '0 0 6px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{selected.title}</h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          }}>
            {selected.status && (
              <span style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '10px',
                fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                fontFamily: "'Rajdhani', sans-serif",
                backgroundColor: selected.status === 'complete'
                  ? (isDark ? 'rgba(0,222,209,0.12)' : 'rgba(0,222,209,0.15)')
                  : (isDark ? 'rgba(254,192,15,0.12)' : 'rgba(254,192,15,0.15)'),
                color: selected.status === 'complete'
                  ? (colors.turquoise || '#00DED1') : colors.primaryYellow,
              }}>{selected.status}</span>
            )}
            {(selected.tags || []).map(t => (
              <span key={t} style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '10px',
                backgroundColor: isDark ? '#2A2A2A' : '#e8e8e8',
                color: colors.textSecondary, fontFamily: "'Quicksand', sans-serif",
              }}>{t}</span>
            ))}
            <span style={{
              fontSize: '11px', color: colors.textSecondary,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Clock size={10} />
              {formatDate(selected.created_at)}
            </span>
            {selected.content && (
              <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                {wordCount(selected.content).toLocaleString()} words
                {' / '}{readTime(selected.content)} read
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '16px' }}>
          {extraActions && extraActions(selected)}
          {[
            { icon: Pencil, tip: 'Edit', action: () => onStartEdit(selected) },
            { icon: Download, tip: 'Download', action: () => onDownload(selected) },
            { icon: Copy, tip: 'Duplicate', action: () => onDuplicate(selected) },
          ].map(({ icon: AI, tip, action }) => (
            <button key={tip} onClick={action} title={tip} style={{
              padding: '8px', backgroundColor: 'transparent', border,
              borderRadius: '8px', color: colors.textMuted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}><AI size={14} /></button>
          ))}
        </div>
      </div>

      {/* Content body */}
      {isSlide && selected.content ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SlidePreview
            title={selected.title}
            content={selected.content}
            colors={colors}
            isDark={isDark}
          />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {selected.content ? (
            <div style={{
              maxWidth: '780px', margin: '0 auto',
              fontFamily: "'Quicksand', sans-serif", lineHeight: 1.8,
            }}>
              <MarkdownRenderer content={selected.content} />
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: '12px',
            }}>
              <AlertCircle size={28} color={colors.textSecondary} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '13px', color: colors.textMuted }}>
                No content yet. Click Edit to add content.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
