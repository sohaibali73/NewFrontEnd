'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Presentation, Clock, Trash2, Download, RefreshCw, Loader2 } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface SlideDecksTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface SlideDeck {
  id: string;
  title: string;
  slideCount?: number;
  updatedAt?: string;
  updated_at?: string;
  status: 'draft' | 'complete' | 'pending' | 'running' | 'error';
  downloadUrl?: string;
  download_url?: string;
  presentationId?: string;
  presentation_id?: string;
  filename?: string;
  jobId?: string;
  progress?: number;
  message?: string;
}

const API = () => (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const authHeader = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function SlideDecksTab({ colors, isDark }: SlideDecksTabProps) {
  const [decks, setDecks] = useState<SlideDeck[]>([]);
  const [showCreationChat, setShowCreationChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load decks from backend
  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API()}/content/slides`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped: SlideDeck[] = (data || []).map((d: any) => ({
        id: d.id,
        title: d.title || 'Untitled Deck',
        slideCount: d.metadata?.slide_count || 10,
        updatedAt: d.updated_at ? new Date(d.updated_at).toLocaleDateString() : 'recently',
        status: d.status || 'draft',
        downloadUrl: d.metadata?.download_url,
        presentationId: d.metadata?.presentation_id,
        filename: d.metadata?.filename || `${d.title}.pptx`,
      }));
      setDecks(mapped);
    } catch (err) {
      console.error('Failed to load slide decks:', err);
      setError('Could not load decks from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  // Poll in-progress jobs
  useEffect(() => {
    const inProgress = decks.filter(d => d.jobId && (d.status === 'pending' || d.status === 'running'));
    if (!inProgress.length) return;

    const interval = setInterval(async () => {
      for (const deck of inProgress) {
        try {
          const res = await fetch(`${API()}/content/jobs/${deck.jobId}`, { headers: { ...authHeader() } });
          if (!res.ok) continue;
          const job = await res.json();
          setDecks(prev => prev.map(d => {
            if (d.jobId !== deck.jobId) return d;
            if (job.status === 'complete' && job.result) {
              return {
                ...d,
                status: 'complete',
                progress: 100,
                message: undefined,
                downloadUrl: job.result.download_url,
                presentationId: job.result.presentation_id,
                id: job.result.id || d.id,
              };
            }
            return { ...d, status: job.status, progress: job.progress, message: job.message };
          }));
        } catch {}
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [decks]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API()}/content/slides/${id}`, {
        method: 'DELETE',
        headers: { ...authHeader() },
      });
      setDecks(prev => prev.filter(d => d.id !== id));
    } catch {
      setDecks(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleDownload = async (deck: SlideDeck) => {
    const url = deck.downloadUrl || deck.download_url;
    if (!url) return;
    try {
      const res = await fetch(`${API()}${url}`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = deck.filename || `${deck.title}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCreated = (item: any) => {
    const newDeck: SlideDeck = {
      id: item.id || `deck-${Date.now()}`,
      title: item.title || 'New Deck',
      slideCount: item.slideCount || item.slide_count || 10,
      updatedAt: 'just now',
      status: item.jobId ? 'pending' : (item.status || 'complete'),
      downloadUrl: item.downloadUrl || item.download_url,
      presentationId: item.presentationId || item.presentation_id,
      filename: item.filename,
      jobId: item.jobId,
      progress: item.jobId ? 10 : undefined,
    };
    setDecks(prev => [newDeck, ...prev]);
    setShowCreationChat(false);
  };

  const cardBorder = `1px solid ${colors.border}`;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '18px', color: colors.text, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
            Slide Decks
          </h2>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0' }}>
            {decks.length} deck{decks.length !== 1 ? 's' : ''} · Potomac PPTX skill
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchDecks}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: 'transparent', border: cardBorder, borderRadius: '8px', color: colors.textMuted, cursor: 'pointer', fontSize: '12px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowCreationChat(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '8px', color: colors.darkGray, cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px' }}
          >
            <Plus size={15} /> NEW DECK
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '10px', color: colors.textMuted }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px' }}>Loading decks…</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: '13px' }}>
          {error} <button onClick={fetchDecks} style={{ color: colors.primaryYellow, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Retry</button>
        </div>
      ) : decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Presentation size={40} color={colors.border} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>No slide decks yet</p>
          <p style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 16px' }}>Create one using the Potomac PPTX skill</p>
          <button onClick={() => setShowCreationChat(true)} style={{ padding: '8px 20px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '8px', color: colors.darkGray, cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px' }}>
            CREATE FIRST DECK
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {decks.map(deck => (
            <div
              key={deck.id}
              style={{ backgroundColor: colors.cardBg, border: cardBorder, borderRadius: '12px', padding: '16px', position: 'relative', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = colors.primaryYellow + '60')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border)}
            >
              {/* Status badge */}
              {(deck.status === 'pending' || deck.status === 'running') && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: colors.primaryYellow, backgroundColor: `${colors.primaryYellow}15`, padding: '3px 8px', borderRadius: '12px' }}>
                  <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                  {deck.progress ? `${deck.progress}%` : 'Generating…'}
                </div>
              )}
              {deck.status === 'complete' && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', color: '#22c55e', backgroundColor: '#22c55e15', padding: '3px 8px', borderRadius: '12px' }}>
                  ✓ Ready
                </div>
              )}

              <Presentation size={28} color={colors.primaryYellow} style={{ marginBottom: '10px' }} />
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '14px', color: colors.text, margin: '0 0 4px', letterSpacing: '0.5px', lineHeight: 1.3 }}>
                {deck.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.textMuted, marginBottom: '14px' }}>
                <Clock size={11} />
                {deck.updatedAt || 'recently'}
                {deck.slideCount ? ` · ${deck.slideCount} slides` : ''}
              </div>

              {/* Progress bar for running jobs */}
              {(deck.status === 'pending' || deck.status === 'running') && deck.progress !== undefined && (
                <div style={{ height: '3px', backgroundColor: colors.border, borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${deck.progress}%`, backgroundColor: colors.primaryYellow, transition: 'width 0.5s ease' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {(deck.downloadUrl || deck.download_url) && (
                  <button
                    onClick={() => handleDownload(deck)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '7px', color: colors.darkGray, cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '11px' }}
                  >
                    <Download size={12} /> DOWNLOAD
                  </button>
                )}
                <button
                  onClick={() => handleDelete(deck.id)}
                  style={{ padding: '7px', backgroundColor: 'transparent', border: cardBorder, borderRadius: '7px', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreationChat && (
        <CreationChatModal
          colors={colors}
          isDark={isDark}
          contentType="slides"
          onClose={() => setShowCreationChat(false)}
          onCreated={handleCreated}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
