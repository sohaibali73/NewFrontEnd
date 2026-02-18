'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Clock, Trash2, Pencil, RefreshCw, Loader2, X, Save } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface ArticlesTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface Article {
  id: string;
  title: string;
  content?: string;
  status: 'draft' | 'complete' | 'published';
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

const API = () => (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const authHeader = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export function ArticlesTab({ colors, isDark }: ArticlesTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [showCreationChat, setShowCreationChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API()}/content/articles`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setArticles(data || []);
    } catch (err) {
      console.error('Failed to load articles:', err);
      setError('Could not load articles from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API()}/content/articles/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
    } catch {}
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`${API()}/content/articles/${id}`, {
        method: 'PUT',
        headers: { ...authHeader() },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles(prev => prev.map(a => a.id === id ? { ...a, title: updated.title || editTitle.trim() } : a));
      }
    } catch {}
    setArticles(prev => prev.map(a => a.id === id ? { ...a, title: editTitle.trim() } : a));
    setEditingId(null);
  };

  const handleCreated = (item: any) => {
    const newArticle: Article = {
      id: item.id || `art-${Date.now()}`,
      title: item.title || 'New Article',
      content: item.content || '',
      status: 'complete',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setArticles(prev => [newArticle, ...prev]);
    setShowCreationChat(false);
  };

  const cardBorder = `1px solid ${colors.border}`;
  const statusColor: Record<string, string> = {
    draft: colors.textMuted,
    complete: '#22c55e',
    published: colors.primaryYellow,
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '18px', color: colors.text, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
            Articles
          </h2>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0' }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''} · AI-generated &amp; persisted
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchArticles}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: 'transparent', border: cardBorder, borderRadius: '8px', color: colors.textMuted, cursor: 'pointer', fontSize: '12px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowCreationChat(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '8px', color: colors.darkGray, cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px' }}
          >
            <Plus size={15} /> NEW ARTICLE
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '10px', color: colors.textMuted }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px' }}>Loading articles…</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: '13px' }}>
          {error} <button onClick={fetchArticles} style={{ color: colors.primaryYellow, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Retry</button>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BookOpen size={40} color={colors.border} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>No articles yet</p>
          <p style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 16px' }}>Generate your first article with AI</p>
          <button onClick={() => setShowCreationChat(true)} style={{ padding: '8px 20px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '8px', color: colors.darkGray, cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px' }}>
            WRITE FIRST ARTICLE
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {articles.map(article => (
            <div
              key={article.id}
              style={{ backgroundColor: colors.cardBg, border: cardBorder, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = colors.primaryYellow + '50')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border)}
            >
              <BookOpen size={20} color={colors.primaryYellow} style={{ flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === article.id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(article.id); if (e.key === 'Escape') setEditingId(null); }}
                      autoFocus
                      style={{ flex: 1, background: 'transparent', border: `1px solid ${colors.primaryYellow}`, borderRadius: '6px', padding: '4px 8px', color: colors.text, fontSize: '13px', outline: 'none' }}
                    />
                    <button onClick={() => handleRename(article.id)} style={{ background: 'none', border: 'none', color: colors.primaryYellow, cursor: 'pointer', padding: '4px' }}><Save size={14} /></button>
                    <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '4px' }}><X size={14} /></button>
                  </div>
                ) : (
                  <p style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: '13px', color: colors.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {article.title}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <Clock size={10} color={colors.textMuted} />
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>
                    {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : 'recently'}
                  </span>
                  <span style={{ fontSize: '10px', color: statusColor[article.status] || colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    · {article.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => { setEditingId(article.id); setEditTitle(article.title); }}
                  style={{ padding: '6px', backgroundColor: 'transparent', border: cardBorder, borderRadius: '6px', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = colors.primaryYellow; e.currentTarget.style.color = colors.primaryYellow; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  style={{ padding: '6px', backgroundColor: 'transparent', border: cardBorder, borderRadius: '6px', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
                >
                  <Trash2 size={12} />
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
          contentType="articles"
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
