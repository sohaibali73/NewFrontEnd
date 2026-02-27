'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Trash2,
  Eye,
  Clock,
  ArrowUpDown,
  LayoutGrid,
  List,
  Bookmark,
  BookmarkCheck,
  HardDrive,
  FolderOpen,
} from 'lucide-react';
import { Document } from '@/types/api';

type SortField = 'filename' | 'created_at' | 'size' | 'category';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface KBDocumentGridProps {
  documents: Document[];
  activeCategory: string;
  onViewDocument: (doc: Document) => void;
  onDeleteDocument: (id: string) => void;
  onBookmark?: (id: string) => void;
  bookmarkedIds?: Set<string>;
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
  isTablet: boolean;
}

const catColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function CategoryBadge({ category }: { category: string }) {
  const c = catColors[category] || catColors.general;
  return (
    <span
      style={{
        fontSize: '11px',
        padding: '2px 10px',
        borderRadius: '6px',
        backgroundColor: c.bg,
        color: c.text,
        fontWeight: 600,
        fontFamily: "'Rajdhani', sans-serif",
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      {category}
    </span>
  );
}

export default function KBDocumentGrid({
  documents,
  activeCategory,
  onViewDocument,
  onDeleteDocument,
  onBookmark,
  bookmarkedIds = new Set(),
  isDark,
  colors,
  isMobile,
  isTablet,
}: KBDocumentGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    const filtered =
      activeCategory === 'all'
        ? documents
        : documents.filter((doc) => doc.category === activeCategory);

    return [...filtered].sort((a, b) => {
      let compare = 0;
      switch (sortField) {
        case 'filename':
          compare = a.filename.localeCompare(b.filename);
          break;
        case 'created_at':
          compare =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          compare = a.size - b.size;
          break;
        case 'category':
          compare = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === 'asc' ? compare : -compare;
    });
  }, [documents, activeCategory, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteDocument(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
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
      {/* Header */}
      <div
        style={{
          padding: isMobile ? '16px' : '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <div>
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
            DOCUMENTS
          </h3>
          <p
            style={{
              color: colors.textMuted,
              fontSize: '13px',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
            {activeCategory !== 'all' ? ` in ${activeCategory}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sort Buttons */}
          {[
            { field: 'created_at' as SortField, label: 'Date' },
            { field: 'filename' as SortField, label: 'Name' },
            { field: 'size' as SortField, label: 'Size' },
          ].map((s) => (
            <button
              key={s.field}
              onClick={() => toggleSort(s.field)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${
                  sortField === s.field ? colors.accent : colors.border
                }`,
                backgroundColor:
                  sortField === s.field ? `${colors.accent}14` : 'transparent',
                color: sortField === s.field ? colors.accent : colors.textMuted,
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
              }}
            >
              {s.label}
              {sortField === s.field && (
                <ArrowUpDown size={10} />
              )}
            </button>
          ))}

          {/* View Toggle */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                marginLeft: '4px',
              }}
            >
              {[
                { mode: 'list' as ViewMode, Icon: List },
                { mode: 'grid' as ViewMode, Icon: LayoutGrid },
              ].map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    backgroundColor:
                      viewMode === mode
                        ? `${colors.accent}14`
                        : 'transparent',
                    color: viewMode === mode ? colors.accent : colors.textMuted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Content */}
      {filteredDocs.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <FolderOpen
            size={48}
            color={colors.textMuted}
            style={{ marginBottom: '16px', opacity: 0.3 }}
          />
          <p
            style={{
              color: colors.textMuted,
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            {activeCategory !== 'all'
              ? `No documents in "${activeCategory}"`
              : 'No documents yet. Upload one to get started!'}
          </p>
        </div>
      ) : viewMode === 'grid' && !isMobile ? (
        /* Grid View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isTablet
              ? 'repeat(2, 1fr)'
              : 'repeat(3, 1fr)',
            gap: '16px',
            padding: '20px 24px',
          }}
        >
          {filteredDocs.map((doc) => {
            const isBookmarked = bookmarkedIds.has(doc.id);
            return (
              <div
                key={doc.id}
                style={{
                  backgroundColor: isDark ? '#161616' : '#FAFAFA',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '14px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => onViewDocument(doc)}
              >
                {/* Bookmark */}
                {onBookmark && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmark(doc.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isBookmarked ? colors.accent : colors.textMuted,
                      padding: '4px',
                    }}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark document'}
                  >
                    {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                )}

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: `${colors.accent}14`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <FileText size={22} color={colors.accent} />
                </div>
                <p
                  style={{
                    color: colors.text,
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.filename}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <CategoryBadge category={doc.category} />
                  <span
                    style={{
                      color: colors.textMuted,
                      fontSize: '11px',
                    }}
                  >
                    {formatFileSize(doc.size)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '10px',
                    color: colors.textMuted,
                    fontSize: '11px',
                  }}
                >
                  <Clock size={11} />
                  {new Date(doc.created_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '14px',
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: '12px',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(doc);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: 'transparent',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >
                    <Eye size={14} />
                    VIEW
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: `1px solid ${
                        confirmDeleteId === doc.id
                          ? '#DC2626'
                          : colors.border
                      }`,
                      backgroundColor:
                        confirmDeleteId === doc.id
                          ? 'rgba(220, 38, 38, 0.08)'
                          : 'transparent',
                      color:
                        confirmDeleteId === doc.id
                          ? '#DC2626'
                          : colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div>
          {filteredDocs.map((doc, idx) => {
            const isBookmarked = bookmarkedIds.has(doc.id);
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '14px 16px' : '14px 24px',
                  borderBottom:
                    idx < filteredDocs.length - 1
                      ? `1px solid ${colors.border}`
                      : 'none',
                  transition: 'background-color 0.15s',
                  gap: '12px',
                }}
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
                    gap: '14px',
                    flex: 1,
                    minWidth: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => onViewDocument(doc)}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} color={colors.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: colors.text,
                        fontSize: '14px',
                        fontWeight: 600,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.filename}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <CategoryBadge category={doc.category} />
                      <span
                        style={{
                          color: colors.textMuted,
                          fontSize: '12px',
                        }}
                      >
                        {formatFileSize(doc.size)}
                      </span>
                      <span
                        style={{
                          color: colors.textMuted,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={11} />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    flexShrink: 0,
                  }}
                >
                  {onBookmark && (
                    <button
                      onClick={() => onBookmark(doc.id)}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${
                          isBookmarked ? colors.accent : colors.border
                        }`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isBookmarked ? colors.accent : colors.textMuted,
                        transition: 'all 0.2s',
                      }}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck size={16} />
                      ) : (
                        <Bookmark size={16} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onViewDocument(doc)}
                    title="View document"
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.textMuted,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.accent;
                      e.currentTarget.style.color = colors.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    title={
                      confirmDeleteId === doc.id
                        ? 'Click again to confirm'
                        : 'Delete document'
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor:
                        confirmDeleteId === doc.id
                          ? 'rgba(220, 38, 38, 0.08)'
                          : 'transparent',
                      border: `1px solid ${
                        confirmDeleteId === doc.id
                          ? '#DC2626'
                          : colors.border
                      }`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color:
                        confirmDeleteId === doc.id
                          ? '#DC2626'
                          : colors.textMuted,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (confirmDeleteId !== doc.id) {
                        e.currentTarget.style.borderColor = '#DC2626';
                        e.currentTarget.style.color = '#DC2626';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (confirmDeleteId !== doc.id) {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.color = colors.textMuted;
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
