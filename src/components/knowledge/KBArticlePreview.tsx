'use client';

import React from 'react';
import {
  FileText,
  X,
  Clock,
  HardDrive,
  Loader2,
  AlertCircle,
  Tag,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { Document } from '@/types/api';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const catColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
};

interface KBArticlePreviewProps {
  doc: Document;
  content: string | null;
  loading: boolean;
  onClose: () => void;
  isDark: boolean;
  colors: Record<string, string>;
}

export default function KBArticlePreview({
  doc,
  content,
  loading,
  onClose,
  isDark,
  colors,
}: KBArticlePreviewProps) {
  const [copied, setCopied] = React.useState(false);
  const c = catColors[doc.category] || catColors.general;

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: `${colors.accent}14`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={26} color={colors.accent} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '20px',
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 12px',
                    borderRadius: '6px',
                    backgroundColor: c.bg,
                    color: c.text,
                    fontWeight: 600,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {doc.category}
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
                  <HardDrive size={12} />
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
                  <Clock size={12} />
                  {new Date(doc.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {content && (
              <button
                onClick={handleCopy}
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
                  color: copied ? '#22c55e' : colors.textMuted,
                  transition: 'all 0.2s',
                }}
                title={copied ? 'Copied!' : 'Copy content'}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            )}
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
              }}
            >
              <X size={18} />
            </button>
          </div>
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
              <Loader2
                size={32}
                color={colors.accent}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: '14px',
                }}
              >
                Loading document content...
              </p>
            </div>
          ) : content ? (
            <div>
              {/* Summary / Preview */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: `${colors.accent}08`,
                  borderRadius: '12px',
                  border: `1px solid ${colors.accent}20`,
                  marginBottom: '20px',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: colors.accent,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                  }}
                >
                  DOCUMENT PREVIEW
                </p>
                <p
                  style={{
                    color: isDark ? '#C8C8C8' : '#555',
                    fontSize: '13px',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {content.substring(0, 300)}
                  {content.length > 300 ? '...' : ''}
                </p>
              </div>

              {/* Full Content */}
              <pre
                style={{
                  fontFamily:
                    "'Quicksand', 'Consolas', 'Monaco', monospace",
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: colors.text,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  backgroundColor: isDark ? '#161616' : '#FAFAFA',
                  borderRadius: '12px',
                  padding: '24px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                {content}
              </pre>
            </div>
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
              <AlertCircle
                size={36}
                color={colors.textMuted}
                style={{ opacity: 0.5 }}
              />
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: '14px',
                  textAlign: 'center',
                  maxWidth: '400px',
                  lineHeight: 1.6,
                }}
              >
                Unable to load document content. The document may be in a
                binary format (PDF, DOC) that cannot be displayed as text.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
