'use client';

import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, Download, Pencil, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface ArticlesTabProps { colors: Record<string, string>; isDark: boolean; }

interface Article { id: string; title: string; content: string; tags: string[]; createdAt: string; }

const STORAGE_KEY = 'content_articles';
function load(): Article[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(items: Article[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {} }

export function ArticlesTab({ colors, isDark }: ArticlesTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { setArticles(load()); }, []);

  const handleDelete = (id: string) => { const u = articles.filter(a => a.id !== id); setArticles(u); save(u); };
  const handleDuplicate = (a: Article) => {
    const copy = { ...a, id: `art-${Date.now()}`, title: `${a.title} (Copy)`, createdAt: new Date().toISOString() };
    const u = [...articles, copy]; setArticles(u); save(u);
  };
  const handleRename = (id: string) => {
    const u = articles.map(a => a.id === id ? { ...a, title: editTitle } : a); setArticles(u); save(u); setEditingId(null);
  };
  const handleDownload = (a: Article) => {
    const blob = new Blob([`${a.title}\n${'='.repeat(50)}\nTags: ${a.tags.join(', ')}\nCreated: ${new Date(a.createdAt).toLocaleString()}\n\n${a.content}`], { type: 'text/plain' });
    const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = `${a.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`; el.click();
  };
  const handleCreated = (item: any) => {
    const newArt: Article = { id: `art-${Date.now()}`, title: item.title || 'Untitled Article', content: item.content || '', tags: item.tags || [], createdAt: new Date().toISOString() };
    const u = [...articles, newArt]; setArticles(u); save(u); setShowCreate(false);
  };

  const border = `1px solid ${colors.border}`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.background }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: border, flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>Articles ({articles.length})</h2>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: colors.primaryYellow, color: colors.darkGray, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px' }}><Plus size={16} /> NEW ARTICLE</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {articles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
            <BookOpen size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>No articles yet</p>
            <p style={{ fontSize: '13px', color: colors.textSecondary }}>Click "New Article" to create one using AI</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {articles.map(article => {
              const isExpanded = expandedId === article.id;
              return (
                <div key={article.id} style={{ border, borderRadius: '12px', backgroundColor: colors.cardBg, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isDark ? '#333' : '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BookOpen size={18} color={colors.primaryYellow} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === article.id ? (
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => handleRename(article.id)} onKeyDown={e => e.key === 'Enter' && handleRename(article.id)} autoFocus style={{ background: 'transparent', border: `1px solid ${colors.primaryYellow}`, borderRadius: '6px', padding: '4px 8px', color: colors.text, fontSize: '14px', fontWeight: 600, width: '100%', outline: 'none' }} />
                      ) : (
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11px', color: colors.textMuted }}>
                        {article.tags.map(t => <span key={t} style={{ padding: '1px 6px', backgroundColor: isDark ? '#333' : '#e5e5e5', borderRadius: '4px', fontSize: '10px' }}>{t}</span>)}
                        <span style={{ opacity: 0.4 }}>·</span><Clock size={10} /><span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { icon: isExpanded ? ChevronUp : ChevronDown, action: () => setExpandedId(isExpanded ? null : article.id) },
                        { icon: Download, action: () => handleDownload(article) },
                        { icon: Pencil, action: () => { setEditingId(article.id); setEditTitle(article.title); } },
                        { icon: Copy, action: () => handleDuplicate(article) },
                        { icon: Trash2, action: () => handleDelete(article.id) },
                      ].map(({ icon: Icon, action }, i) => (
                        <button key={i} onClick={action} style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', color: colors.textMuted, cursor: 'pointer' }}><Icon size={14} /></button>
                      ))}
                    </div>
                  </div>
                  {isExpanded && article.content && (
                    <div style={{ padding: '0 16px 14px', borderTop: border }}>
                      <pre style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '12px 0 0', fontFamily: "'Quicksand', sans-serif" }}>{article.content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showCreate && <CreationChatModal colors={colors} isDark={isDark} contentType="articles" onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}
