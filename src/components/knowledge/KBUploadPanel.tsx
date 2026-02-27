'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Document } from '@/types/api';

interface KBUploadPanelProps {
  onUpload: (file: File) => Promise<Document>;
  onUploadComplete: () => void;
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
}

interface UploadItem {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function KBUploadPanel({
  onUpload,
  onUploadComplete,
  isDark,
  colors,
  isMobile,
}: KBUploadPanelProps) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const items: UploadItem[] = files.map((file) => ({
        file,
        status: 'pending' as const,
      }));
      setUploadItems(items);
      setUploading(true);

      for (let i = 0; i < items.length; i++) {
        setUploadItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'uploading' } : item
          )
        );
        try {
          await onUpload(items[i].file);
          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'success' } : item
            )
          );
        } catch (err) {
          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: 'error',
                    error:
                      err instanceof Error ? err.message : 'Upload failed',
                  }
                : item
            )
          );
        }
      }

      setUploading(false);
      onUploadComplete();

      // Clear upload items after delay
      setTimeout(() => {
        setUploadItems([]);
      }, 3000);
    },
    [onUpload, onUploadComplete]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const completedCount = uploadItems.filter(
    (i) => i.status === 'success' || i.status === 'error'
  ).length;
  const successCount = uploadItems.filter(
    (i) => i.status === 'success'
  ).length;
  const failedCount = uploadItems.filter((i) => i.status === 'error').length;

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}
      >
        <Upload size={16} color={colors.accent} />
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
          UPLOAD DOCUMENTS
        </h3>
      </div>
      <p
        style={{
          color: colors.textMuted,
          fontSize: '13px',
          marginBottom: '20px',
        }}
      >
        Add files to expand your knowledge base
      </p>

      {/* Drop Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? colors.accent : colors.border}`,
          borderRadius: '12px',
          padding: '32px 20px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          backgroundColor: dragOver
            ? isDark
              ? '#1A1A10'
              : '#FFFEF5'
            : isDark
            ? '#161616'
            : '#FAFAFA',
        }}
      >
        {uploading ? (
          <Loader2
            size={28}
            color={colors.accent}
            style={{ animation: 'spin 1s linear infinite' }}
          />
        ) : (
          <Upload size={28} color={colors.textMuted} />
        )}
        <p
          style={{
            color: colors.text,
            fontSize: '14px',
            fontWeight: 600,
            marginTop: '12px',
            marginBottom: '4px',
          }}
        >
          {uploading
            ? `Uploading ${completedCount}/${uploadItems.length}...`
            : dragOver
            ? 'Drop files here'
            : 'Click or drag files to upload'}
        </p>
        <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>
          {uploading ? '' : 'PDF, TXT, DOC, DOCX'}
        </p>
      </div>

      {/* Upload Progress */}
      {uploadItems.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span
              style={{ color: colors.textMuted, fontSize: '12px' }}
            >
              {completedCount} of {uploadItems.length} files
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {successCount > 0 && (
                <span
                  style={{
                    color: '#22c55e',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle size={12} />
                  {successCount}
                </span>
              )}
              {failedCount > 0 && (
                <span
                  style={{
                    color: '#DC2626',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <XCircle size={12} />
                  {failedCount}
                </span>
              )}
            </div>
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
                width: `${
                  uploadItems.length > 0
                    ? (completedCount / uploadItems.length) * 100
                    : 0
                }%`,
                height: '100%',
                backgroundColor: colors.accent,
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Individual file status */}
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '120px',
              overflow: 'auto',
            }}
          >
            {uploadItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                {item.status === 'uploading' && (
                  <Loader2
                    size={12}
                    color={colors.accent}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                )}
                {item.status === 'success' && (
                  <CheckCircle size={12} color="#22c55e" />
                )}
                {item.status === 'error' && (
                  <XCircle size={12} color="#DC2626" />
                )}
                {item.status === 'pending' && (
                  <FileText size={12} color={colors.textMuted} />
                )}
                <span
                  style={{
                    color:
                      item.status === 'error'
                        ? '#DC2626'
                        : item.status === 'success'
                        ? '#22c55e'
                        : colors.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {item.file.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.txt,.doc,.docx"
        multiple
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
