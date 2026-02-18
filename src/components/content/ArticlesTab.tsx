'use client';

import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, Eye, Trash2, Copy } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface ArticlesTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  wordCount: number;
  updatedAt: string;
  status: 'draft' | 'published' | 'review';
  tags: string[];
}

const STORAGE_KEY = 'potomac_articles';

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  draft: { text: '#FEC00F', bg: 'rgba(254, 192, 15, 0.12)' },
  published: { text: '#00DED1', bg: 'rgba(0, 222, 209, 0.12)' },
  review: { text: '#EB2F5C', bg: 'rgba(235, 47, 92, 0.12)' },
};

function loadArticles(): Article[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveArticles(articles: Article[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch {}
}

export function ArticlesTab({ colors, isDark }: ArticlesTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [showCreationChat, setShowCreationChat] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    setArticles(loadArticles());
  }, []);

  useEffect(() => {
    saveArticles(articles);
  }, [articles]);

  useEffect(() => {
    if (selectedArticle) {
      const article = articles.find(a => a.id === selectedArticle);
      setEditContent(article?.content || article?.excerpt || '');
    }
  }, [selectedArticle]);

  const handleDelete = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
    if (selectedArticle === id) setSelectedArticle(null);
  };

  const handleDuplicate = (article: Article) => {
    const copy: Article = {
      ...article,
      id: `article-${Date.now()}`,
      title: `${article.title} (Copy)`,
      updatedAt: 'just now',
      status: 'draft',
    };
    setArticles(prev => [copy, ...prev]);
  };

  const handleContentChange = (value: string) => {
    setEditContent(value);
    if (selectedArticle) {
      setArticles(prev => prev.map(a =>
        a.id === selectedArticle
          ? { ...a, content: value, wordCount: value.split(/\s+/).filter(Boolean).length, updatedAt: 'just now' }
          : a
      ));
    }
  };

  const handleCreated = (newArticle: Article) => {
    setArticles(prev => [newArticle, ...prev]);
    setSelectedArticle(newArticle.id);
    setShowCreationChat(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Article List Sidebar */}
      <div style={{
        width: '360px',
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.surface,
        flexShrink: 0,
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
          <button
            onClick={() => setShowCreationChat(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              backgroundColor: colors.primaryYellow,
              color: colors.darkGray,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '0.5px',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus size={18} />
            NEW ARTICLE
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {articles.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: '8px' }} color={colors.textMuted} />
              <p style={{ margin: 0 }}>No articles yet.<br />Click "New Article" to create one.</p>
            </div>
          ) : (
            articles.map((article) => {
              const statusStyle = STATUS_COLORS[article.status];
              return (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '14px',
                    backgroundColor: selectedArticle === article.id ? (isDark ? '#2A2A2A' : '#eeeeee') : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ color: colors.text, fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {article.title}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px', textTransform: 'uppercase',
                      backgroundColor: statusStyle.bg, color: statusStyle.text, flexShrink: 0, marginLeft: '8px',
                    }}>
                      {article.status}
                    </span>
                  </div>
                  <p style={{ color: colors.textMuted, fontSize: '12px', lineHeight: 1.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {article.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: colors.textSecondary }}>
                    <span>{(article.wordCount || 0).toLocaleString()} words</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} />
                      {article.updatedAt}
                    </span>
                  </div>
                  {article.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {article.tags.map((tag) => (
                        <span key={tag} style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500,
                          backgroundColor: isDark ? '#333333' : '#e8e8e8', color: colors.textMuted,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Article Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.background, overflow: 'hidden' }}>
        {selectedArticle ? (() => {
          const article = articles.find(a => a.id === selectedArticle);
          if (!article) return null;
          return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
                <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '18px', color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>
                  {article.title}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { icon: Copy, label: 'Duplicate', onClick: () => handleDuplicate(article) },
                    { icon: Trash2, label: 'Delete', onClick: () => handleDelete(article.id) },
                  ].map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      style={{
                        padding: '8px', backgroundColor: 'transparent',
                        border: `1px solid ${colors.border}`, borderRadius: '8px',
                        color: colors.textMuted, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      title={label}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primaryYellow; e.currentTarget.style.color = colors.primaryYellow; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: isDark ? '#1E1E1E' : '#ffffff', overflow: 'auto' }}>
                <textarea
                  value={editContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start writing your article..."
                  style={{
                    width: '100%', height: '100%', padding: '24px',
                    background: 'none', border: 'none', outline: 'none',
                    color: colors.text, fontSize: '15px', lineHeight: 1.8,
                    fontFamily: "'Quicksand', sans-serif", resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          );
        })() : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <BookOpen size={48} color={colors.textSecondary} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px', color: colors.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Select an article or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {showCreationChat && (
        <CreationChatModal
          colors={colors}
          isDark={isDark}
          contentType="articles"
          onClose={() => setShowCreationChat(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
