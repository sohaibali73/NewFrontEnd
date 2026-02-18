'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, File, Clock, Download, Pencil, Trash2, Copy, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CreationChatModal } from './CreationChatModal';

interface DocumentsTabProps { colors: Record<string, string>; isDark: boolean; }
interface Doc { id: string; title: string; content: string; status?: string; tags?: string[]; metadata?: any; created_at?: string; }

export function DocumentsTab({ colors, isDark }: DocumentsTabProps) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try { const data = await apiClient.getDocumentsContent(); setDocs(data || []); } catch { setDocs([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id: string) => { try { await apiClient.deleteContentDocument(id); setDocs(p => p.filter(d => d.id !== id)); } catch (e) { console.error(e); } };
  const handleDuplicate = async (d: Doc) => { try { const c = await apiClient.createDocument({ title: `${d.title} (Copy)`, content: d.content, tags: d.tags, metadata: d.metadata }); setDocs(p => [...p, c]); } catch (e) { console.error(e); } };
  const handleRename = async (id: string) => { try { await apiClient.updateDocument(id, { title: editTitle }); setDocs(p => p.map(d => d.id === id ? { ...d, title: editTitle } : d)); setEditingId(null); } catch (e) { console.error(e); } };
  const handleDownload = (d: Doc) => { const blob = new Blob([`${d.title}\n${'='.repeat(50)}\n\n${d.content}`], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${d.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`; a.click(); };
  const handleCreated = async (item: any) => { try { const c = await apiClient.createDocument({ title: item.title || 'Untitled Document', content: item.content || '', tags: ['ai-generated'], metadata: { type: item.type || 'AI Generated' } }); setDocs(p => [...p, c]); } catch (e) { console.error(e); } setShowCreate(false); };

  const docType = (d: Doc) => d.metadata?.type || d.tags?.[0] || 'Document';
  const border = `1px solid ${colors.border}`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.background }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>Documents ({docs.length})</h2>
          <button onClick={fetchDocs} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '4px' }}><RefreshCw size={14} /></button>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: colors.primaryYellow, color: colors.darkGray, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px' }}><Plus size={16} /> NEW DOCUMENT</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Loader2 size={24} color={colors.primaryYellow} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : docs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
            <File size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px', color: colors.textMuted, textTransform: 'uppercase' }}>No documents yet</p>
            <p style={{ fontSize: '13px', color: colors.textSecondary }}>Click "New Document" to create one using AI</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {docs.map(doc => {
              const isExpanded = expandedId === doc.id;
              return (
                <div key={doc.id} style={{ border, borderRadius: '12px', backgroundColor: colors.cardBg, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isDark ? '#333' : '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><File size={18} color={colors.primaryYellow} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === doc.id ? (
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => handleRename(doc.id)} onKeyDown={e => e.key === 'Enter' && handleRename(doc.id)} autoFocus style={{ background: 'transparent', border: `1px solid ${colors.primaryYellow}`, borderRadius: '6px', padding: '4px 8px', color: colors.text, fontSize: '14px', fontWeight: 600, width: '100%', outline: 'none' }} />
                      ) : (
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11px', color: colors.textMuted }}>
                        <span style={{ padding: '1px 6px', backgroundColor: colors.primaryYellow + '20', color: colors.primaryYellow, borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>{docType(doc)}</span>
                        <span style={{ opacity: 0.4 }}>·</span><Clock size={10} /><span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { icon: isExpanded ? ChevronUp : ChevronDown, action: () => setExpandedId(isExpanded ? null : doc.id) },
                        { icon: Download, action: () => handleDownload(doc) },
                        { icon: Pencil, action: () => { setEditingId(doc.id); setEditTitle(doc.title); } },
                        { icon: Copy, action: () => handleDuplicate(doc) },
                        { icon: Trash2, action: () => handleDelete(doc.id) },
                      ].map(({ icon: Icon, action }, i) => (
                        <button key={i} onClick={action} style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', color: colors.textMuted, cursor: 'pointer' }}><Icon size={14} /></button>
                      ))}
                    </div>
                  </div>
                  {isExpanded && doc.content && (
                    <div style={{ padding: '0 16px 14px', borderTop: border }}>
                      <pre style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '12px 0 0', fontFamily: "'Quicksand', sans-serif" }}>{doc.content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showCreate && <CreationChatModal colors={colors} isDark={isDark} contentType="documents" onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
