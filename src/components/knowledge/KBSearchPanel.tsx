'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  Clock,
  Loader2,
  ChevronDown,
  FileText,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { SearchResult } from '@/types/api';

interface KBSearchPanelProps {
  onSearch: (query: string, category?: string) => Promise<SearchResult[]>;
  categories: string[];
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
}

export default function KBSearchPanel({
  onSearch,
  categories,
  isDark,
  colors,
  isMobile,
}: KBSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  // Close recent searches dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      setShowRecent(false);
      try {
        const category = selectedCategory !== 'all' ? selectedCategory : undefined;
        const res = await onSearch(query, category);
        setResults(res);
        // Store recent search
        setRecentSearches((prev) => {
          const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 5);
          return updated;
        });
      } catch {
        // handled upstream
      } finally {
        setSearching(false);
      }
    },
    [query, selectedCategory, onSearch]
  );

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Search Header */}
      <div
        style={{
          padding: isMobile ? '20px 16px' : '24px',
          borderBottom: results.length > 0 ? `1px solid ${colors.border}` : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color={colors.accent} />
            <h3
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                margin: 0,
              }}
            >
              ADVANCED SEARCH
            </h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${showFilters ? colors.accent : colors.border}`,
              backgroundColor: showFilters ? `${colors.accent}14` : 'transparent',
              color: showFilters ? colors.accent : colors.textMuted,
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <SlidersHorizontal size={14} />
            FILTERS
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch}>
          <div style={{ position: 'relative' }} ref={recentRef}>
            <Search
              size={18}
              color={colors.textMuted}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => recentSearches.length > 0 && setShowRecent(true)}
              placeholder="Search documents, topics, keywords..."
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '44px',
                paddingRight: query ? '80px' : '16px',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: "'Quicksand', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowRecent(false);
                  inputRef.current?.blur();
                }
              }}
            />
            {query && (
              <div
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textMuted,
                  }}
                >
                  <X size={16} />
                </button>
                <button
                  type="submit"
                  disabled={searching}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: colors.accent,
                    color: '#212121',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: "'Rajdhani', sans-serif",
                    cursor: searching ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {searching ? (
                    <Loader2
                      size={14}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  ) : (
                    'SEARCH'
                  )}
                </button>
              </div>
            )}

            {/* Recent Searches Dropdown */}
            {showRecent && recentSearches.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.textMuted,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                    }}
                  >
                    RECENT SEARCHES
                  </span>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      setShowRecent(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.textMuted,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(term);
                      setShowRecent(false);
                      setTimeout(() => handleSearch(), 0);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.text,
                      fontSize: '13px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.hoverBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <Clock size={14} color={colors.textMuted} />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: isDark ? '#161616' : '#FAFAFA',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
            }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: '10px',
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: '0.5px',
              }}
            >
              FILTER BY CATEGORY
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${
                      selectedCategory === cat ? colors.accent : colors.border
                    }`,
                    backgroundColor:
                      selectedCategory === cat ? `${colors.accent}14` : 'transparent',
                    color: selectedCategory === cat ? colors.accent : colors.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                  }}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div style={{ maxHeight: '420px', overflow: 'auto' }}>
          <div
            style={{
              padding: '12px 24px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: colors.textMuted, fontSize: '12px', fontWeight: 600 }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </span>
            {selectedCategory !== 'all' && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  backgroundColor: `${colors.accent}14`,
                  color: colors.accent,
                  fontWeight: 600,
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                {selectedCategory}
              </span>
            )}
          </div>
          {results.map((result, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px 24px',
                borderBottom:
                  idx < results.length - 1
                    ? `1px solid ${colors.border}`
                    : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onClick={() =>
                setExpandedResult(expandedResult === idx ? null : idx)
              }
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = colors.hoverBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <FileText size={16} color={colors.accent} />
                  <span
                    style={{
                      color: colors.text,
                      fontSize: '14px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {result.filename}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor:
                        result.relevance_score > 0.7
                          ? 'rgba(34, 197, 94, 0.1)'
                          : result.relevance_score > 0.4
                          ? 'rgba(254, 192, 15, 0.1)'
                          : 'rgba(156, 163, 175, 0.1)',
                      color:
                        result.relevance_score > 0.7
                          ? '#22c55e'
                          : result.relevance_score > 0.4
                          ? '#FEC00F'
                          : '#9ca3af',
                      fontWeight: 600,
                    }}
                  >
                    {(result.relevance_score * 100).toFixed(0)}%
                  </span>
                  <ChevronDown
                    size={14}
                    color={colors.textMuted}
                    style={{
                      transition: 'transform 0.2s',
                      transform:
                        expandedResult === idx
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                    }}
                  />
                </div>
              </div>
              <p
                style={{
                  color: isDark ? '#C8C8C8' : '#555',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  margin: 0,
                  display: expandedResult === idx ? 'block' : '-webkit-box',
                  WebkitLineClamp: expandedResult === idx ? undefined : 2,
                  WebkitBoxOrient:
                    expandedResult === idx ? undefined : ('vertical' as const),
                  overflow: expandedResult === idx ? 'visible' : 'hidden',
                }}
              >
                {result.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
