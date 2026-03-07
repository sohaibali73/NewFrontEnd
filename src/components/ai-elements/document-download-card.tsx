'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Presentation, Download, CheckCircle, Loader2, FileIcon, ExternalLink, File as FileIconGeneric, Eye, EyeOff, X, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import { getApiUrl, getProxyUrl } from '@/lib/env';

/**
 * Shared interface for file download data — used by both tool outputs and
 * the new `file_download` stream events from the backend.
 */
export interface FileDownloadData {
  success?: boolean;
  tool?: string;
  tool_name?: string;
  title?: string;
  subtitle?: string;
  filename?: string;
  doc_type?: string;
  document_id?: string;
  presentation_id?: string;
  file_id?: string;
  download_url?: string;
  file_type?: string;
  file_size_kb?: number;
  size_kb?: number;
  slide_count?: number;
  skill_used?: string;
  execution_time?: number;
  method?: string;
  content_preview?: string;
  error?: string;
  // Additional fields for enhanced preview
  sections?: Array<{ title?: string; content?: string }>;
  slides?: Array<{ title?: string; content?: string; slide_number?: number }>;
  outline?: string[];
  page_count?: number;
}

interface DocumentDownloadCardProps {
  output: FileDownloadData;
}

/**
 * Build the best download URL from available data.
 * Priority: 1) unified /files/{id}/download  2) explicit download_url  3) legacy endpoints
 */
function resolveDownloadUrl(data: FileDownloadData): string | null {
  const fileId = data.file_id || data.document_id || data.presentation_id;

  // 1) Unified endpoint (new backend)
  if (fileId) {
    const base = `/files/${fileId}/download`;
    const filename = data.filename;
    const qs = filename ? `?filename=${encodeURIComponent(filename)}` : '';
    return base + qs;
  }

  // 2) Explicit download_url from tool output
  if (data.download_url) {
    return data.download_url;
  }

  return null;
}

/**
 * Preview Modal Component — Shows document content in a full-screen overlay
 */
function PreviewModal({
  output,
  fileTypeLabel,
  accentColor,
  onClose,
}: {
  output: FileDownloadData;
  fileTypeLabel: string;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '800px',
          maxHeight: '85vh',
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 40px ${accentColor}10`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {output.title || output.filename || 'Document Preview'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {fileTypeLabel}
              {output.slide_count ? ` • ${output.slide_count} slides` : ''}
              {output.page_count ? ` • ${output.page_count} pages` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          <PreviewContent output={output} accentColor={accentColor} expanded />
        </div>
      </div>
    </div>
  );
}

/**
 * Preview Content — Renders document preview based on available data
 */
function PreviewContent({
  output,
  accentColor,
  expanded = false,
}: {
  output: FileDownloadData;
  accentColor: string;
  expanded?: boolean;
}) {
  const isPptx = (output.tool || output.tool_name || '').includes('pptx') ||
    (output.tool || output.tool_name || '').includes('presentation') ||
    (output.tool || output.tool_name || '').includes('powerpoint') ||
    (output.filename || '').endsWith('.pptx') ||
    (output.filename || '').endsWith('.ppt') ||
    (output.file_type || '') === 'pptx' ||
    !!output.slide_count ||
    !!output.presentation_id;

  // Render slides preview for PPTX
  if (isPptx && output.slides && output.slides.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {output.slides.map((slide, idx) => (
          <div
            key={idx}
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                fontSize: '11px',
                fontWeight: 700,
              }}>
                {slide.slide_number || idx + 1}
              </span>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
              }}>
                {slide.title || `Slide ${idx + 1}`}
              </span>
            </div>
            {slide.content && (
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.6,
                paddingLeft: '32px',
                whiteSpace: 'pre-wrap',
              }}>
                {expanded ? slide.content : slide.content.slice(0, 150) + (slide.content.length > 150 ? '...' : '')}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render sections preview for DOCX
  if (output.sections && output.sections.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {output.sections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <h4 style={{
                margin: '0 0 8px',
                fontSize: '14px',
                fontWeight: 600,
                color: accentColor,
              }}>
                {section.title}
              </h4>
            )}
            {section.content && (
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {expanded ? section.content : section.content.slice(0, 300) + (section.content.length > 300 ? '...' : '')}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render outline preview
  if (output.outline && output.outline.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{
          margin: '0 0 8px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {isPptx ? 'Slide Outline' : 'Document Outline'}
        </h4>
        {output.outline.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: `${accentColor}15`,
              color: accentColor,
              fontSize: '10px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {idx + 1}
            </span>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
            }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Render content_preview text
  if (output.content_preview) {
    return (
      <div style={{
        padding: expanded ? '0' : '12px',
        borderRadius: '8px',
        backgroundColor: expanded ? 'transparent' : 'rgba(0,0,0,0.2)',
        border: expanded ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          lineHeight: 1.7,
          maxHeight: expanded ? 'none' : '200px',
          overflow: expanded ? 'visible' : 'hidden',
        }}>
          {output.content_preview}
        </p>
      </div>
    );
  }

  // Fallback: Generate a summary preview from available metadata
  const summaryItems: string[] = [];
  if (output.title) summaryItems.push(`Title: ${output.title}`);
  if (output.doc_type) summaryItems.push(`Type: ${output.doc_type}`);
  if (output.slide_count) summaryItems.push(`Slides: ${output.slide_count}`);
  if (output.page_count) summaryItems.push(`Pages: ${output.page_count}`);
  if (output.skill_used) summaryItems.push(`Generated by: ${output.skill_used}`);
  if (output.method) summaryItems.push(`Method: ${output.method.replace(/_/g, ' ')}`);

  if (summaryItems.length > 0) {
    return (
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h4 style={{
          margin: '0 0 8px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Document Info
        </h4>
        {summaryItems.map((item, idx) => (
          <p key={idx} style={{
            margin: '4px 0',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
          }}>
            {item}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.3)',
      fontSize: '12px',
    }}>
      Preview not available — download the file to view its contents.
    </div>
  );
}

export default function DocumentDownloadCard({ output }: DocumentDownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Handle various success indicators from different tool implementations
  const isSuccess = output?.success === true || output?.download_url || output?.document_id || output?.presentation_id || output?.file_id || output?.filename;

  if (!output || (!isSuccess && output?.error)) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 my-3">
        <div className="flex items-center gap-2 text-red-400">
          <FileIcon className="h-5 w-5" />
          <span className="font-medium">Document Generation Failed</span>
        </div>
        <p className="text-sm text-red-300 mt-2">{output?.error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  // Detect file type from tool name, file_type field, or filename
  const toolName = output.tool || output.tool_name || '';
  const fileName = output.filename || '';
  const fileType = output.file_type || '';
  const isDocx = toolName.includes('word') || toolName.includes('docx') || toolName.includes('document') || fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileType === 'docx' || fileType === 'doc';
  const isPptx = toolName.includes('pptx') || toolName.includes('presentation') || toolName.includes('powerpoint') || fileName.endsWith('.pptx') || fileName.endsWith('.ppt') || fileType === 'pptx' || fileType === 'ppt' || !!output.slide_count || !!output.presentation_id;
  const isCsv = fileName.endsWith('.csv') || fileType === 'csv';
  const isPdf = fileName.endsWith('.pdf') || fileType === 'pdf';

  // Choose icon and styling based on file type
  let Icon = FileIconGeneric;
  let fileTypeLabel = 'File';
  let extension = '';
  let accentColor = '#71717a';
  let accentClass = 'border-zinc-500/30 bg-gradient-to-br from-zinc-500/10 to-zinc-600/5';
  let iconBgClass = 'bg-zinc-500/20';
  let iconColorClass = 'text-zinc-400';
  let btnClass = 'bg-zinc-500 hover:bg-zinc-600 text-white shadow-lg shadow-zinc-500/25';

  if (isPptx) {
    Icon = Presentation;
    fileTypeLabel = 'PowerPoint Presentation';
    extension = '.pptx';
    accentColor = '#f59e0b';
    accentClass = 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5';
    iconBgClass = 'bg-amber-500/20';
    iconColorClass = 'text-amber-400';
    btnClass = 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/25';
  } else if (isDocx) {
    Icon = FileText;
    fileTypeLabel = 'Word Document';
    extension = '.docx';
    accentColor = '#3b82f6';
    accentClass = 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5';
    iconBgClass = 'bg-blue-500/20';
    iconColorClass = 'text-blue-400';
    btnClass = 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25';
  } else if (isCsv) {
    fileTypeLabel = 'CSV Spreadsheet';
    extension = '.csv';
    accentColor = '#22c55e';
    accentClass = 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5';
    iconBgClass = 'bg-green-500/20';
    iconColorClass = 'text-green-400';
    btnClass = 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25';
  } else if (isPdf) {
    fileTypeLabel = 'PDF Document';
    extension = '.pdf';
    accentColor = '#ef4444';
    accentClass = 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5';
    iconBgClass = 'bg-red-500/20';
    iconColorClass = 'text-red-400';
    btnClass = 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25';
  } else {
    // Infer extension from filename
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot > 0) extension = fileName.substring(lastDot);
  }

  const sizeKb = output.file_size_kb || output.size_kb;
  const hasDownload = !!(resolveDownloadUrl(output));
  const hasPreviewContent = !!(output.content_preview || output.sections?.length || output.slides?.length || output.outline?.length || output.slide_count || output.title);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const downloadPath = resolveDownloadUrl(output);
      
      if (!downloadPath) {
        throw new Error('No download URL available');
      }

      // Build fetch URL — use Next.js proxy to avoid CORS issues
      let fetchUrl: string;
      if (downloadPath.startsWith('http')) {
        fetchUrl = downloadPath;
      } else {
        fetchUrl = getProxyUrl(downloadPath);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('[DocumentDownload] Fetching:', fetchUrl);
      const response = await fetch(fetchUrl, { headers });
      if (!response.ok) {
        const errText = await response.text().catch(() => `HTTP ${response.status}`);
        throw new Error(`Download failed (${response.status}): ${errText.substring(0, 200)}`);
      }
      
      const blob = await response.blob();
      
      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = output.filename || `document${extension || ''}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (error) {
      console.error('[DocumentDownload] Error:', error);
      // Fallback: try direct backend URL
      try {
        const API_BASE = getApiUrl();
        const downloadPath = resolveDownloadUrl(output);
        if (downloadPath && !downloadPath.startsWith('http')) {
          const directUrl = `${API_BASE}${downloadPath}`;
          console.log('[DocumentDownload] Retrying with direct URL:', directUrl);
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          const headers: HeadersInit = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const response = await fetch(directUrl, { headers, mode: 'cors', credentials: 'omit' });
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = output.filename || `document${extension || ''}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);
            return;
          }
        }
      } catch { /* fallback also failed */ }
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className={`rounded-xl border ${accentClass} p-4 my-3 backdrop-blur-sm`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${iconBgClass}`}>
              <Icon className={`h-6 w-6 ${iconColorClass}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{output.title || output.filename || 'Untitled'}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {fileTypeLabel}
                {sizeKb ? ` • ${(sizeKb / 1024).toFixed(1) !== '0.0' ? `${(sizeKb).toFixed(1)} KB` : `${sizeKb} KB`}` : ''}
                {output.slide_count ? ` • ${output.slide_count} slides` : ''}
                {output.doc_type ? ` • ${output.doc_type}` : ''}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Preview Button */}
            {hasPreviewContent && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                style={{
                  backgroundColor: showPreview ? `${accentColor}15` : 'rgba(255,255,255,0.05)',
                  borderColor: showPreview ? `${accentColor}40` : 'rgba(255,255,255,0.1)',
                  color: showPreview ? accentColor : 'rgba(255,255,255,0.5)',
                }}
                onMouseOver={(e) => {
                  if (!showPreview) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!showPreview) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Hide' : 'Preview'}
              </button>
            )}

            {/* Download Button */}
            {hasDownload ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  downloaded
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : downloading
                    ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                    : btnClass
                }`}
              >
                {downloaded ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Downloaded
                  </>
                ) : downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download{extension ? ` ${extension}` : ''}
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-zinc-500 px-3 py-2">Text only</span>
            )}
          </div>
        </div>

        {/* Subtitle */}
        {output.subtitle && (
          <p className="text-xs text-zinc-500 mt-2 ml-14">{output.subtitle}</p>
        )}

        {/* Inline Preview Panel */}
        {showPreview && (
          <div style={{
            marginTop: '12px',
            marginLeft: '0',
            borderRadius: '10px',
            border: `1px solid ${accentColor}20`,
            backgroundColor: 'rgba(0,0,0,0.25)',
            overflow: 'hidden',
            animation: 'slideDown 0.2s ease-out',
          }}>
            {/* Preview header bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {isPptx ? 'Slide Preview' : 'Document Preview'}
              </span>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = accentColor; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                title="Expand preview"
              >
                <Maximize2 size={12} />
                <span>Expand</span>
              </button>
            </div>

            {/* Preview content */}
            <div style={{
              padding: '12px',
              maxHeight: '250px',
              overflowY: 'auto',
            }}>
              <PreviewContent output={output} accentColor={accentColor} />
            </div>
          </div>
        )}

        {/* Footer metadata */}
        <div className="flex items-center gap-4 mt-3 ml-14">
          {output.skill_used && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700/50">
              ⚡ {output.skill_used}
            </span>
          )}
          {output.execution_time && (
            <span className="text-[10px] text-zinc-500">
              Generated in {output.execution_time}s
            </span>
          )}
          {output.method && (
            <span className="text-[10px] text-zinc-500">
              via {output.method.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Full-screen preview modal */}
      {showModal && (
        <PreviewModal
          output={output}
          fileTypeLabel={fileTypeLabel}
          accentColor={accentColor}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-8px); }
          to { opacity: 1; max-height: 500px; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
