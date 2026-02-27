'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, Presentation, BookOpen, File, BarChart3,
  Clock, ArrowRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { ContentItem } from './ContentSplitPane';

interface GlobalSearchProps {
  colors: Record<string, string>;
  isDark: boolean;
  onNavigate: (tab: string, itemId: string) => void;
}

interface SearchResultGroup {
  type: string;
  label: string;
  icon: React.ElementType;
  items: ContentItem[];
}

export function GlobalSearch({ colors, isDark, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [allContent, setAllContent] = useState<Record<string, ContentItem[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all content on mount for cross-tab search
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [articles, documents, slides, dashboards] = await Promise.all([
          apiClient.getArticles().catch(() => []),
          apiClient.getDocumentsContent().catch(() => []),
          apiClient.getSlides().catch(() => []),
          apiClient.getDashboards().catch(() => []),
        ]);
        setAllContent({
          articles: articles || [],
          documents: documents || [],
          slides: slides || [],
          dashboards: dashboards || [],
        });
      } catch {
        // Silently fail
      }
    };
    fetchAll();
  }, []);

  // Filter content based on query
  const performSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const lower = q.toLowerCase();
    const groups: SearchResultGroup[] = [];

    const typeConfig: { key: string; label: string; icon: React.ElementType; tab: string }[] = [
      { key: 'articles', label: 'Articles', icon: BookOpen, tab: 'articles' },
      { key: 'documents', label: 'Documents', icon: File, tab: 'documents' },
      { key: 'slides', label: 'Slide Decks', icon: Presentation, tab: 'slides' },
      { key: 'dashboards', label: 'Dashboards', icon: BarChart3, tab: 'dashboards' },
    ];

    for (const config of typeConfig) {
      const items = (allContent[config.key] || []).filter(
        (item) =>
          item.title?.toLowerCase().includes(lower) ||
          item.content?.toLowerCase().includes(lower) ||
          (item.tags || []).some((t) => t.toLowerCase().includes(lower))
      );
      if (items.length > 0) {
        groups.push({
          type: config.tab,
          label: config.label,
          icon: config.icon,
          items: items.slice(0, 5),
        });
      }
    }

    setResults(groups);
  }, [allContent]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalResults = results.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Search trigger */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          backgroundColor: colors.inputBg,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          color: colors.textSecondary,
          cursor: 'pointer',
          fontFamily: "'Quicksand', sans-serif",
          fontSize: '13px',
          transition: 'all 0.2s ease',
          minWidth: '200px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.primaryYellow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.borderSubtle;
        }}
      >
        <Search size={14} />
        <span>Search all content...</span>
        <kbd
          style={{
            marginLeft: 'auto',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            backgroundColor: isDark ? '#333' : '#e0e0e0',
            color: colors.textSecondary,
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '\u2318' : 'Ctrl+'}K
        </kbd>
      </button>

      {/* Search overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Search panel */}
          <div
            style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '600px',
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              boxShadow: isDark
                ? '0 20px 60px rgba(0,0,0,0.6)'
                : '0 20px 60px rgba(0,0,0,0.15)',
              zIndex: 999,
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {/* Search input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <Search size={18} color={colors.primaryYellow} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across all content types..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: colors.text,
                  fontSize: '15px',
                  fontFamily: "'Quicksand', sans-serif",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Results */}
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {query && results.length === 0 && (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                >
                  <Search
                    size={32}
                    color={colors.textSecondary}
                    style={{ opacity: 0.2, marginBottom: '12px' }}
                  />
                  <p
                    style={{
                      fontSize: '14px',
                      color: colors.textMuted,
                      fontFamily: "'Quicksand', sans-serif",
                      margin: 0,
                    }}
                  >
                    No results found for &quot;{query}&quot;
                  </p>
                </div>
              )}

              {results.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.type}>
                    {/* Group header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px 6px',
                        fontSize: '11px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 700,
                        color: colors.primaryYellow,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      <GroupIcon size={13} />
                      {group.label}
                      <span
                        style={{
                          fontSize: '10px',
                          color: colors.textSecondary,
                          fontWeight: 600,
                        }}
                      >
                        ({group.items.length})
                      </span>
                    </div>

                    {/* Group items */}
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(group.type, item.id);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 20px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? '#2A2A2A' : '#e8e8e8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <GroupIcon size={14} color={colors.textMuted} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: colors.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '2px',
                              fontSize: '11px',
                              color: colors.textSecondary,
                            }}
                          >
                            {item.status && (
                              <span
                                style={{
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  backgroundColor:
                                    item.status === 'complete'
                                      ? 'rgba(0,222,209,0.12)'
                                      : `${colors.primaryYellow}15`,
                                  color:
                                    item.status === 'complete'
                                      ? colors.turquoise || '#00DED1'
                                      : colors.primaryYellow,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {item.status}
                              </span>
                            )}
                            <Clock size={9} />
                            <span>
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString()
                                : ''}
                            </span>
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          color={colors.textSecondary}
                          style={{ flexShrink: 0, opacity: 0.5 }}
                        />
                      </button>
                    ))}
                  </div>
                );
              })}

              {!query && (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      color: colors.textSecondary,
                      fontFamily: "'Quicksand', sans-serif",
                      margin: 0,
                    }}
                  >
                    Type to search across articles, documents, slides, and dashboards
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {query && totalResults > 0 && (
              <div
                style={{
                  padding: '10px 20px',
                  borderTop: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: colors.textSecondary,
                  fontFamily: "'Quicksand', sans-serif",
                }}
              >
                <span>{totalResults} result{totalResults !== 1 ? 's' : ''} found</span>
                <span>Press Esc to close</span>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
