'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Presentation, Clock, Download, Pencil, Trash2, Copy, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CreationChatModal } from './CreationChatModal';

interface SlideDecksTabProps { colors: Record<string, string>; isDark: boolean; }

interface SlideDeck { id: string; title: string; content: string; status?: string; tags?: string[]; metadata?: any; created_at?: string; updated_at?: string; }

export function SlideDecksTab({ colors, isDark }: SlideDecksTabProps) {
  const [decks, setDecks] = useState<SlideDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSlides();
      setDecks(data || []);
    } catch (err) {
      console.error('Failed to load slides:', err);
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const handleDelete = async (id: string) => {
    try { await apiClient.deleteSlide(id); setDecks(prev => prev.filter(d => d.id !== id)); } catch (e) { console.error(e); }
  };
  const handleDuplicate = async (deck: SlideDeck) => {
    try {
      const copy = await apiClient.createSlide({ title: `${deck.title} (Copy)`, content: deck.content, tags: deck.tags, metadata: deck.metadata });
      setDecks(prev => [...prev, copy]);
    } catch (e) { console.error(e); }
  };
  const handleRename = async (id: string) => {
    try {
      await apiClient.updateSlide(id, { title: editTitle });
      setDecks(prev => prev.map(d => d.id === id ? { ...d, title: editTitle } : d));
      setEditingId(null);
    } catch (e) { console.error(e); }
  };
  const handleDownload = (deck: SlideDeck) => {
    const blob = new Blob([`POTOMAC ASSET MANAGEMENT\n${'='.repeat(50)}\n${deck.title}\n\n${deck.content}`], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${deck.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`; a.click();
  };
  const handleCreated = async (item: any) => {
    try {
      const created = await apiClient.createSlide({ title: item.title || 'Untitled Deck', content: item.content || '', tags: ['ai-generated'], metadata: { slideCount: item.slideCount } });
      setDecks(prev => [...prev, created]);
    } catch (e) { console.error(e); }
    setShowCreate(false);
  };

  const border = `1px solid ${colors.border}`;
  const slideCount = (d: SlideDeck) => d.metadata?.slideCount || (d.content?.match(/^##/gm) || []).length || 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.background }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>Slide Decks ({decks.length})</h2>
          <button onClick={fetchDecks} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '4px' }}><RefreshCw size={14} /></button>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: colors.primaryYellow, color: colors.darkGray, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px' }}><Plus size={16} /> NEW DECK</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Loader2 size={24} color={colors.primaryYellow} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : decks.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
            <Presentation size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px', color: colors.textMuted, textTransform: 'uppercase' }}>No slide decks yet</p>
            <p style={{ fontSize: '13px', color: colors.textSecondary }}>Click "New Deck" to create one using AI</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {decks.map(deck => {
              const isExpanded = expandedId === deck.id;
              return (
                <div key={deck.id} style={{ border, borderRadius: '12px', backgroundColor: colors.cardBg, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isDark ? '#333' : '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Presentation size={18} color={colors.primaryYellow} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === deck.id ? (
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => handleRename(deck.id)} onKeyDown={e => e.key === 'Enter' && handleRename(deck.id)} autoFocus style={{ background: 'transparent', border: `1px solid ${colors.primaryYellow}`, borderRadius: '6px', padding: '4px 8px', color: colors.text, fontSize: '14px', fontWeight: 600, width: '100%', outline: 'none' }} />
                      ) : (
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.title}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11px', color: colors.textMuted }}>
                        <span>{slideCount(deck)} slides</span><span style={{ opacity: 0.4 }}>·</span>
                        <Clock size={10} /><span>{deck.created_at ? new Date(deck.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { icon: isExpanded ? ChevronUp : ChevronDown, action: () => setExpandedId(isExpanded ? null : deck.id) },
                        { icon: Download, action: () => handleDownload(deck) },
                        { icon: Pencil, action: () => { setEditingId(deck.id); setEditTitle(deck.title); } },
                        { icon: Copy, action: () => handleDuplicate(deck) },
                        { icon: Trash2, action: () => handleDelete(deck.id) },
                      ].map(({ icon: Icon, action }, i) => (
                        <button key={i} onClick={action} style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', color: colors.textMuted, cursor: 'pointer' }}><Icon size={14} /></button>
                      ))}
                    </div>
                  </div>
                  {isExpanded && deck.content && (
                    <div style={{ padding: '0 16px 14px', borderTop: border }}>
                      <pre style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '12px 0 0', fontFamily: "'Quicksand', sans-serif" }}>{deck.content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showCreate && <CreationChatModal colors={colors} isDark={isDark} contentType="slides" onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
