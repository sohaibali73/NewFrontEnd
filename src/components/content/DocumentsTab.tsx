'use client';

import React, { useState } from 'react';
import { Plus, File, FileText, Clock, Download, Trash2, Copy } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface DocumentsTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface Document {
  id: string;
  title: string;
  type: 'report' | 'memo' | 'brief' | 'template';
  pageCount: number;
  updatedAt: string;
  status: 'draft' | 'final';
}

const DOC_TYPE_LABELS: Record<string, string> = {
  report: 'Report',
  memo: 'Memo',
  brief: 'Brief',
  template: 'Template',
};

const PLACEHOLDER_DOCS: Document[] = [
  { id: '1', title: 'Annual Portfolio Performance Report', type: 'report', pageCount: 24, updatedAt: '1 hour ago', status: 'final' },
  { id: '2', title: 'Client Onboarding Memo', type: 'memo', pageCount: 4, updatedAt: '5 hours ago', status: 'draft' },
  { id: '3', title: 'Investment Committee Brief - Feb 2026', type: 'brief', pageCount: 8, updatedAt: '2 days ago', status: 'final' },
  { id: '4', title: 'Due Diligence Template', type: 'template', pageCount: 12, updatedAt: '1 week ago', status: 'final' },
];

export function DocumentsTab({ colors, isDark }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>(PLACEHOLDER_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showCreationChat, setShowCreationChat] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Document List */}
      <div
        style={{
          width: '340px',
          borderRight: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.surface,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
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
            NEW DOCUMENT
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                backgroundColor: selectedDoc === doc.id
                  ? isDark ? '#2A2A2A' : '#eeeeee'
                  : 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s ease',
                marginBottom: '4px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '48px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#333333' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={20} color={colors.primaryYellow} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: colors.text,
                    fontSize: '14px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    fontSize: '12px',
                    color: colors.textMuted,
                  }}
                >
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                      backgroundColor: isDark ? '#333333' : '#e8e8e8',
                      color: colors.textMuted,
                    }}
                  >
                    {DOC_TYPE_LABELS[doc.type]}
                  </span>
                  <span>{doc.pageCount} pages</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    fontSize: '11px',
                    color: colors.textSecondary,
                  }}
                >
                  <Clock size={11} />
                  {doc.updatedAt}
                  <span
                    style={{
                      marginLeft: '8px',
                      color: doc.status === 'final' ? colors.turquoise : colors.primaryYellow,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '10px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {doc.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Document Editor */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.background,
          overflow: 'hidden',
        }}
      >
        {selectedDoc ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px',
                  color: colors.text,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                {documents.find((d) => d.id === selectedDoc)?.title}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { icon: Download, label: 'Export' },
                  { icon: Copy, label: 'Duplicate' },
                  { icon: Trash2, label: 'Delete' },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    title={label}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primaryYellow;
                      e.currentTarget.style.color = colors.primaryYellow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Document Body */}
            <div
              style={{
                flex: 1,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div style={{ maxWidth: '700px', width: '100%' }}>
                <textarea
                  placeholder="Start writing your document..."
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '32px 40px',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: colors.text,
                    fontSize: '15px',
                    lineHeight: 1.8,
                    fontFamily: "'Quicksand', sans-serif",
                    resize: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <File size={48} color={colors.textSecondary} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  color: colors.textMuted,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                Select a document or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {showCreationChat && (
        <CreationChatModal
          colors={colors}
          isDark={isDark}
          contentType="documents"
          onClose={() => setShowCreationChat(false)}
        />
      )}
    </div>
  );
}
