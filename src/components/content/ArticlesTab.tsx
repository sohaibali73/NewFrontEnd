'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Clock, Download, Pencil, Trash2, Copy, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CreationChatModal } from './CreationChatModal';

interface ArticlesTabProps { colors: Record<string, string>; isDark: boolean; }
interface Article { id: string; title: string; content: string; tags?: string[]; status?: string; created_at?: string; }

export function ArticlesTab({ colors, isDark }: ArticlesTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try { const data = await apiClient.getArticles(); setArticles(data || []); } catch { setArticles([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleDelete = async (id: string) => { try { await apiClient.deleteArticle(id); setArticles(p => p.filter(a => a.id !== id)); } catch (e) { console.error(e); } };
  const handleDuplicate = async (a: Article) => { try { const c = await apiClient.createArticle({ title: `${a.title} (Copy)`, content: a.content, tags: a.tags }); setArticles(p => [...p, c]); } catch (e) { console.error(e); } };
  const handleRename = async (id: string) => { try { await apiClient.updateArticle(id, { title: editTitle }); setArticles(p => p.map(a => a.id === id ? { ...a, title: editTitle } : a)); setEditingId(null); } catch (e) { console.error(e); } };
  const handleDownload = (a: Article) => { const blob = new Blob([`${a.title}\n${'='.repeat(50)}\nTags: ${(a.tags || []).join(', ')}\n\n${a.content}`], { type: 'text/plain' }); const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = `${a.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`; el.click(); };
  const handleCreated = async (item: any) => { try { const c = await apiClient.createArticle({ title: item.title || 'Untitled Article', content: item.content || '', tags: item.tags || ['ai-generated'] }); setArticles(p => [...p, c]); } catch (e) { console.error(e); } setShowCreate(false); };

  const border = `1px solid ${colors.border}`;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.background }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>Articles ({articles.length})</h2>
          <button onClick={fetchArticles} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '4px' }}><RefreshCw size={14} /></button>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: colors.primaryYellow, color: colors.darkGray, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px' }}><Plus size={16} /> NEW ARTICLE</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Loader2 size={24} color={colors.primaryYellow} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : articles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
            <BookOpen size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px', color: colors.textMuted, textTransform: 'uppercase' }}>No articles yet</p>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11px', color: colors.textMuted, flexWrap: 'wrap' }}>
                        {(article.tags || []).map(t => <span key={t} style={{ padding: '1px 6px', backgroundColor: isDark ? '#333' : '#e5e5e5', borderRadius: '4px', fontSize: '10px' }}>{t}</span>)}
                        <span style={{ opacity: 0.4 }}>·</span><Clock size={10} /><span>{article.created_at ? new Date(article.created_at).toLocaleDateString() : 'N/A'}</span>
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
