'use client';

import React, { useState } from 'react';
import { FileText, Presentation, Download, CheckCircle, Loader2, FileIcon, ExternalLink } from 'lucide-react';
import { getApiUrl, getProxyUrl } from '@/lib/env';

interface DocumentDownloadCardProps {
  output: {
    success?: boolean;
    tool?: string;
    title?: string;
    subtitle?: string;
    filename?: string;
    doc_type?: string;
    document_id?: string;
    presentation_id?: string;
    download_url?: string;
    file_size_kb?: number;
    slide_count?: number;
    skill_used?: string;
    execution_time?: number;
    method?: string;
    content_preview?: string;
    error?: string;
  };
}

export default function DocumentDownloadCard({ output }: DocumentDownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Handle various success indicators from different tool implementations
  const isSuccess = output?.success === true || output?.download_url || output?.document_id || output?.presentation_id || output?.filename;

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

  // Detect file type from tool name or filename
  const toolName = output.tool || '';
  const fileName = output.filename || '';
  const isDocx = toolName.includes('word') || toolName.includes('docx') || toolName.includes('document') || fileName.endsWith('.docx') || fileName.endsWith('.doc');
  const isPptx = toolName.includes('pptx') || toolName.includes('presentation') || toolName.includes('powerpoint') || fileName.endsWith('.pptx') || fileName.endsWith('.ppt') || !!output.slide_count || !!output.presentation_id;
  const Icon = isPptx ? Presentation : FileText;
  const fileType = isPptx ? 'PowerPoint Presentation' : 'Word Document';
  const extension = isPptx ? '.pptx' : '.docx';
  const accentColor = isPptx ? 'amber' : 'blue';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const downloadUrl = output.download_url;
      
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      // Fetch the file - use Next.js proxy to avoid CORS issues
      // Backend returns relative paths like /chat/document/<id> or /chat/presentation/<id>
      // Route through /api/backend/* proxy (configured in next.config.js)
      let fetchUrl: string;
      if (downloadUrl.startsWith('http')) {
        // Already a full URL — use directly
        fetchUrl = downloadUrl;
      } else {
        // Relative path — use the Next.js proxy to avoid CORS
        fetchUrl = getProxyUrl(downloadUrl);
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
      a.download = output.filename || `document${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (error) {
      console.error('[DocumentDownload] Error:', error);
      // Also try direct backend URL as fallback
      try {
        const API_BASE = getApiUrl();
        const downloadUrl = output.download_url;
        if (downloadUrl && !downloadUrl.startsWith('http')) {
          const directUrl = `${API_BASE}${downloadUrl}`;
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
            a.download = output.filename || `document${extension}`;
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
    <div className={`rounded-xl border ${
      isDocx 
        ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5' 
        : 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
    } p-4 my-3 backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${
            isDocx ? 'bg-blue-500/20' : 'bg-amber-500/20'
          }`}>
            <Icon className={`h-6 w-6 ${isDocx ? 'text-blue-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{output.title || 'Untitled'}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {fileType} • {output.file_size_kb ? `${output.file_size_kb} KB` : ''}
              {output.slide_count ? ` • ${output.slide_count} slides` : ''}
              {output.doc_type ? ` • ${output.doc_type}` : ''}
            </p>
          </div>
        </div>
        
        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            downloaded
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : downloading
              ? 'bg-zinc-700 text-zinc-400 cursor-wait'
              : isDocx
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/25'
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
              Download {extension}
            </>
          )}
        </button>
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
