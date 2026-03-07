'use client';

import React, { useState } from 'react';
import { FileText, Presentation, Download, CheckCircle, Loader2, FileIcon, ExternalLink, File as FileIconGeneric } from 'lucide-react';
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
}

interface DocumentDownloadCardProps {
  output: FileDownloadData;
}

/**
 * Build the best download URL from available data.
 * Priority: 1) unified /files/{id}/download  2) explicit download_url  3) legacy endpoints
 */
function resolveDownloadUrl(data: FileDownloadData): string | null {
  const API_BASE = getApiUrl();
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

export default function DocumentDownloadCard({ output }: DocumentDownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

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
  let accentClass = 'border-zinc-500/30 bg-gradient-to-br from-zinc-500/10 to-zinc-600/5';
  let iconBgClass = 'bg-zinc-500/20';
  let iconColorClass = 'text-zinc-400';
  let btnClass = 'bg-zinc-500 hover:bg-zinc-600 text-white shadow-lg shadow-zinc-500/25';

  if (isPptx) {
    Icon = Presentation;
    fileTypeLabel = 'PowerPoint Presentation';
    extension = '.pptx';
    accentClass = 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5';
    iconBgClass = 'bg-amber-500/20';
    iconColorClass = 'text-amber-400';
    btnClass = 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/25';
  } else if (isDocx) {
    Icon = FileText;
    fileTypeLabel = 'Word Document';
    extension = '.docx';
    accentClass = 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5';
    iconBgClass = 'bg-blue-500/20';
    iconColorClass = 'text-blue-400';
    btnClass = 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25';
  } else if (isCsv) {
    fileTypeLabel = 'CSV Spreadsheet';
    extension = '.csv';
    accentClass = 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5';
    iconBgClass = 'bg-green-500/20';
    iconColorClass = 'text-green-400';
    btnClass = 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25';
  } else if (isPdf) {
    fileTypeLabel = 'PDF Document';
    extension = '.pdf';
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
        // Already a full URL — use directly
        fetchUrl = downloadPath;
      } else {
        // Relative path — use the Next.js proxy to avoid CORS
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
              {sizeKb ? ` • ${sizeKb} KB` : ''}
              {output.slide_count ? ` • ${output.slide_count} slides` : ''}
              {output.doc_type ? ` • ${output.doc_type}` : ''}
            </p>
          </div>
        </div>
        
        {/* Download Button — only show if a download URL is available */}
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

      {/* Subtitle */}
      {output.subtitle && (
        <p className="text-xs text-zinc-500 mt-2 ml-14">{output.subtitle}</p>
      )}

      {/* Content Preview (for documents) */}
      {output.content_preview && (
        <div className="mt-3 ml-14">
          <details className="group">
            <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
              Preview content...
            </summary>
            <div className="mt-2 p-3 rounded-lg bg-black/30 border border-zinc-700/50 max-h-32 overflow-y-auto">
              <p className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                {output.content_preview}
              </p>
            </div>
          </details>
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
  );
}
