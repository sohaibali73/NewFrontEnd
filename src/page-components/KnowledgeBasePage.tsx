'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Search,
  Trash2,
  FileText,
  Database,
  Loader2,
  X,
  Eye,
  Filter,
  ArrowRight,
  Clock,
  HardDrive,
  FolderOpen,
  ChevronDown,
  FileSearch,
  AlertCircle,
} from 'lucide-react';
import apiClient from '@/lib/api';
import { Document, SearchResult, BrainStats } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

// ─── Document Viewer Modal ─────────────────────────────────────────────────────
function DocumentViewer({
  doc,
  content,
  loading,
  onClose,
  colors,
  isDark,
}: {
  doc: Document;
  content: string | null;
  loading: boolean;
  onClose: () => void;
  colors: Record<string, string>;
  isDark: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(254, 192, 15, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={22} color="#FEC00F" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                }}
              >
                {doc.filename}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    padding: '2px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(254, 192, 15, 0.12)',
                    color: '#FEC00F',
                    fontWeight: 600,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {doc.category}
                </span>
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                  {formatFileSize(doc.size)}
                </span>
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: isDark ? '#2A2A2A' : '#EEEEEE',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#424242' : '#E0E0E0';
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#2A2A2A' : '#EEEEEE';
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                gap: '16px',
              }}
            >
              <Loader2 size={32} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: colors.textMuted, fontSize: '14px' }}>Loading document...</p>
            </div>
          ) : content ? (
            <pre
              style={{
                fontFamily: "'Quicksand', 'Consolas', 'Monaco', monospace",
                fontSize: '14px',
                lineHeight: 1.7,
                color: colors.text,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                backgroundColor: isDark ? '#161616' : '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
                border: `1px solid ${colors.border}`,
              }}
            >
              {content}
            </pre>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                gap: '12px',
              }}
            >
              <AlertCircle size={36} color={colors.textMuted} style={{ opacity: 0.5 }} />
              <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center' }}>
                Unable to load document content. The document may be in a binary format
                (PDF, DOC) that cannot be displayed as text.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── Category Badge ─────────────────────────────────────────────────────────────
function CategoryBadge({ category, isDark }: { category: string; isDark: boolean }) {
  const catColors: Record<string, { bg: string; text: string }> = {
    afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
    strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
    indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
    documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
    general: { bg: isDark ? 'rgba(156, 163, 175, 0.12)' : 'rgba(100, 116, 139, 0.1)', text: isDark ? '#9ca3af' : '#64748b' },
  };
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

// ─── Main Page ──────────────────────────────────────────────────────────────────
export function KnowledgeBasePage() {
  const { resolvedTheme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; completed: number; failed: number }>({
    total: 0,
    completed: 0,
    failed: 0,
  });
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [viewerContent, setViewerContent] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#F5F5F5',
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
    inputBg: isDark ? '#2A2A2A' : '#F8F8F8',
    border: isDark ? '#2E2E2E' : '#E5E5E5',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    hoverBg: isDark ? '#262626' : '#F5F5F5',
    accent: '#FEC00F',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsData, statsData] = await Promise.all([apiClient.getDocuments(), apiClient.getBrainStats()]);
      setDocuments(docsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);
    setError('');
    setUploadProgress({ total: fileArray.length, completed: 0, failed: 0 });

    const uploadedDocs: Document[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const doc = await apiClient.uploadDocument(file);
        uploadedDocs.push(doc);
        setUploadProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
      } catch {
        failedFiles.push(file.name);
        setUploadProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
      }
    }

    if (uploadedDocs.length > 0) {
      setDocuments((prev) => [...uploadedDocs, ...prev]);
      try {
        const statsData = await apiClient.getBrainStats();
        setStats(statsData);
      } catch {
        // silently fail stats refresh
      }
    }

    if (failedFiles.length > 0) {
      setError(`Failed to upload ${failedFiles.length} file(s): ${failedFiles.join(', ')}`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const category = activeCategory !== 'all' ? activeCategory : undefined;
      const results = await apiClient.searchKnowledge(searchQuery, category);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiClient.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      if (stats) {
        setStats({ ...stats, total_documents: stats.total_documents - 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleViewDocument = useCallback(
    async (doc: Document) => {
      setViewerDoc(doc);
      setViewerLoading(true);
      setViewerContent(null);
      try {
        // Try to search for the doc content via knowledge search
        const results = await apiClient.searchKnowledge(doc.filename, undefined, 1);
        if (results && results.length > 0) {
          setViewerContent(results[0].content);
        } else {
          // Fallback: show metadata info
          setViewerContent(
            `Document: ${doc.filename}\nCategory: ${doc.category}\nSize: ${formatFileSize(doc.size)}\nUploaded: ${new Date(doc.created_at).toLocaleString()}\n\n---\n\nContent preview is not available for this document type. You can search the knowledge base to find relevant excerpts from this document.`
          );
        }
      } catch {
        setViewerContent(
          `Document: ${doc.filename}\nCategory: ${doc.category}\nSize: ${formatFileSize(doc.size)}\nUploaded: ${new Date(doc.created_at).toLocaleString()}\n\n---\n\nUnable to retrieve document content at this time.`
        );
      } finally {
        setViewerLoading(false);
      }
    },
    []
  );

  // Compute categories from stats
  const categories = stats ? ['all', ...Object.keys(stats.categories)] : ['all'];

  // Filter documents by category
  const filteredDocuments =
    activeCategory === 'all' ? documents : documents.filter((doc) => doc.category === activeCategory);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        fontFamily: "'Quicksand', sans-serif",
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderBottom: `1px solid ${colors.border}`,
          padding: isMobile ? '28px 20px' : '48px 32px',
          transition: 'background 0.3s ease',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: 'rgba(254, 192, 15, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={28} color="#FEC00F" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: isMobile ? '28px' : '40px',
                  fontWeight: 700,
                  color: colors.text,
                  letterSpacing: '1.5px',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                KNOWLEDGE BASE
              </h1>
            </div>
          </div>
          <p
            style={{
              color: colors.textMuted,
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: 1.7,
              maxWidth: '600px',
              margin: 0,
            }}
          >
            Upload, manage, and search your trading documents and knowledge resources
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          padding: isMobile ? '24px 20px' : '32px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '12px',
              padding: '14px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color="#DC2626" />
              <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#DC2626',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            {[
              { label: 'Total Documents', value: stats.total_documents, icon: FileText, iconColor: '#FEC00F' },
              { label: 'Total Size', value: formatFileSize(stats.total_size), icon: HardDrive, iconColor: '#3b82f6' },
              {
                label: 'Categories',
                value: Object.keys(stats.categories).length,
                icon: FolderOpen,
                iconColor: '#22c55e',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '14px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: `${stat.iconColor}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={24} color={stat.iconColor} />
                  </div>
                  <div>
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 4px 0' }}>{stat.label}</p>
                    <p
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '32px',
                        fontWeight: 700,
                        color: colors.text,
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload + Search Row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '380px 1fr', gap: '20px', marginBottom: '28px' }}>
          {/* Upload Card */}
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                marginBottom: '6px',
              }}
            >
              UPLOAD DOCUMENTS
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '20px' }}>
              Add files to expand your knowledge
            </p>

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${colors.border}`,
                borderRadius: '12px',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s ease',
                backgroundColor: isDark ? '#161616' : '#FAFAFA',
              }}
              onMouseEnter={(e) => {
                if (!uploading) {
                  e.currentTarget.style.borderColor = '#FEC00F';
                  e.currentTarget.style.backgroundColor = isDark ? '#1A1A10' : '#FFFEF5';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.backgroundColor = isDark ? '#161616' : '#FAFAFA';
              }}
            >
              {uploading ? (
                <Loader2 size={28} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Upload size={28} color={colors.textMuted} />
              )}
              <p style={{ color: colors.text, fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>
                {uploading
                  ? `Uploading ${uploadProgress.completed + uploadProgress.failed}/${uploadProgress.total}...`
                  : 'Click to upload files'}
              </p>
              <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>
                {uploading ? '' : 'PDF, TXT, DOC, DOCX'}
              </p>
            </div>

            {/* Upload Progress */}
            {uploading && uploadProgress.total > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                    {uploadProgress.completed} of {uploadProgress.total} files
                  </span>
                  {uploadProgress.failed > 0 && (
                    <span style={{ color: '#DC2626', fontSize: '12px' }}>{uploadProgress.failed} failed</span>
                  )}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: isDark ? '#2A2A2A' : '#E5E5E5',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${((uploadProgress.completed + uploadProgress.failed) / uploadProgress.total) * 100}%`,
                      height: '100%',
                      backgroundColor: '#FEC00F',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" onChange={handleUpload} accept=".pdf,.txt,.doc,.docx" multiple style={{ display: 'none' }} />
          </div>

          {/* Search Card */}
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h2
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                marginBottom: '6px',
              }}
            >
              SEARCH KNOWLEDGE
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '20px' }}>
              Find relevant information across all documents
            </p>

            <form onSubmit={handleSearch} style={{ marginBottom: searchResults.length > 0 ? '16px' : '0' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search
                    size={18}
                    color={colors.textMuted}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    style={{
                      width: '100%',
                      height: '44px',
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      backgroundColor: colors.inputBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      color: colors.text,
                      fontSize: '14px',
                      fontFamily: "'Quicksand', sans-serif",
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#FEC00F')}
                    onBlur={(e) => (e.target.style.borderColor = colors.border)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  style={{
                    height: '44px',
                    padding: '0 20px',
                    backgroundColor: searching || !searchQuery.trim() ? (isDark ? '#333' : '#E0E0E0') : '#FEC00F',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: searching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: '14px',
                    letterSpacing: '0.5px',
                    color: searching || !searchQuery.trim() ? colors.textMuted : '#212121',
                    transition: 'all 0.2s',
                  }}
                >
                  {searching ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <FileSearch size={18} />
                      {!isMobile && 'SEARCH'}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ flex: 1, overflow: 'auto', maxHeight: '320px' }}>
                <p style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: isDark ? '#161616' : '#F8F8F8',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FEC00F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} color="#FEC00F" />
                        <span style={{ color: colors.text, fontSize: '13px', fontWeight: 600 }}>{result.filename}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            fontWeight: 600,
                          }}
                        >
                          {(result.relevance_score * 100).toFixed(0)}% match
                        </span>
                        <ChevronDown
                          size={14}
                          color={colors.textMuted}
                          style={{
                            transition: 'transform 0.2s',
                            transform: expandedResult === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </div>
                    </div>
                    <p
                      style={{
                        color: isDark ? '#C8C8C8' : '#555',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        margin: 0,
                        display: expandedResult === idx ? 'block' : '-webkit-box',
                        WebkitLineClamp: expandedResult === idx ? undefined : 2,
                        WebkitBoxOrient: expandedResult === idx ? undefined : 'vertical',
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
        </div>

        {/* Documents List */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {/* Documents Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            <div>
              <h2
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
              </h2>
              <p style={{ color: colors.textMuted, fontSize: '13px', marginTop: '4px', marginBottom: 0 }}>
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                {activeCategory !== 'all' ? ` in ${activeCategory}` : ' in your knowledge base'}
              </p>
            </div>

            {/* Category Filters */}
            {categories.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${activeCategory === cat ? '#FEC00F' : colors.border}`,
                      backgroundColor: activeCategory === cat ? 'rgba(254, 192, 15, 0.12)' : 'transparent',
                      color: activeCategory === cat ? '#FEC00F' : colors.textMuted,
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                    }}
                    onMouseEnter={(e) => {
                      if (activeCategory !== cat) {
                        e.currentTarget.style.borderColor = colors.text;
                        e.currentTarget.style.color = colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeCategory !== cat) {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.color = colors.textMuted;
                      }
                    }}
                  >
                    {cat === 'all' ? 'All' : cat}
                    {cat !== 'all' && stats?.categories[cat] !== undefined && (
                      <span style={{ marginLeft: '6px', opacity: 0.7 }}>({stats.categories[cat]})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Document Rows */}
          {loading ? (
            <div
              style={{
                padding: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <Loader2 size={32} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: colors.textMuted, fontSize: '14px' }}>Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div
              style={{
                padding: '60px',
                textAlign: 'center',
              }}
            >
              <Database size={48} color={colors.textMuted} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ color: colors.textMuted, fontSize: '15px', fontWeight: 500 }}>
                {activeCategory !== 'all'
                  ? `No documents in the "${activeCategory}" category`
                  : 'No documents yet. Upload one to get started!'}
              </p>
            </div>
          ) : (
            <div>
              {filteredDocuments.map((doc, idx) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '14px 16px' : '14px 24px',
                    borderBottom: idx < filteredDocuments.length - 1 ? `1px solid ${colors.border}` : 'none',
                    transition: 'background-color 0.15s',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                    onClick={() => handleViewDocument(doc)}
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
                      <FileText size={20} color="#FEC00F" />
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
                        <CategoryBadge category={doc.category} isDark={isDark} />
                        <span style={{ color: colors.textMuted, fontSize: '12px' }}>{formatFileSize(doc.size)}</span>
                        <span style={{ color: colors.textMuted, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleViewDocument(doc)}
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
                        e.currentTarget.style.borderColor = '#FEC00F';
                        e.currentTarget.style.color = '#FEC00F';
                        e.currentTarget.style.backgroundColor = 'rgba(254, 192, 15, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.color = colors.textMuted;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      title="Delete document"
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
                        e.currentTarget.style.borderColor = '#DC2626';
                        e.currentTarget.style.color = '#DC2626';
                        e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.color = colors.textMuted;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewer
          doc={viewerDoc}
          content={viewerContent}
          loading={viewerLoading}
          onClose={() => {
            setViewerDoc(null);
            setViewerContent(null);
          }}
          colors={colors}
          isDark={isDark}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default KnowledgeBasePage;
