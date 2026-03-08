'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Presentation, Clock, Sparkles, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getProxyUrl } from '@/lib/env';
import { ContentSplitPane, ContentItem } from './ContentSplitPane';
import { SlideSampler } from './SlideSampler';
import { toast } from 'sonner';

interface SlideDecksTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

/** Generated file from Skills API */
interface GeneratedFile {
  file_id?: string;
  filename?: string;
  download_url?: string;
  file_type?: string;
  title?: string;
  execution_time?: number;
}

export function SlideDecksTab({ colors, isDark }: SlideDecksTabProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSampler, setShowSampler] = useState(false);
  // Skills API generation state
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [generatedFile, setGeneratedFile] = useState<GeneratedFile | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSlides();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load slides:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /**
   * Generate PPTX using Claude Skills API (non-streaming, blocking).
   * Calls POST /api/backend/skills/create-pptx-with-skill/execute
   * Returns the actual file for download.
   */
  const handleGenerate = async (prompt: string, title: string) => {
    setGenerating(true);
    setGenProgress('Submitting to Claude Skills API...');
    setGeneratedFile(null);
    setGenError(null);

    const toastId = toast.loading(`Generating "${title}"...`, { duration: 300000 });

    try {
      const token = localStorage.getItem('auth_token') || '';
      const resp = await fetch(getProxyUrl('/skills/create-pptx-with-skill/execute'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          title: title,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
        throw new Error(errData.detail || `Skill execution failed (${resp.status})`);
      }

      const data = await resp.json();

      // Extract file info from skill result
      const result = data.result || data;
      const files = result.files || [];
      const fileInfo = files[0] || {};

      const genFile: GeneratedFile = {
        file_id: fileInfo.file_id || result.file_id || result.presentation_id,
        filename: fileInfo.filename || result.filename || `${title}.pptx`,
        download_url: fileInfo.download_url || result.download_url || (fileInfo.file_id ? `/files/${fileInfo.file_id}/download` : undefined),
        file_type: 'pptx',
        title: title,
        execution_time: result.execution_time || data.execution_time,
      };

      setGeneratedFile(genFile);
      setGenProgress('');
      toast.success(`"${title}" generated successfully!`, { id: toastId, duration: 5000 });

      // Also refresh the items list
      fetchItems();

      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Generation failed';
      setGenError(errMsg);
      setGenProgress('');
      toast.error(`Generation failed: ${errMsg}`, { id: toastId, duration: 8000 });
      console.error('Slide generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  /** Download the generated file */
  const handleDownloadGenerated = async () => {
    if (!generatedFile?.download_url && !generatedFile?.file_id) return;
    try {
      const path = generatedFile.download_url || `/files/${generatedFile.file_id}/download`;
      const fetchUrl = getProxyUrl(path);
      const token = localStorage.getItem('auth_token') || '';
      const resp = await fetch(fetchUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedFile.filename || 'presentation.pptx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch (err) {
      toast.error(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    await apiClient.deleteSlide(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = async (id: string, data: Partial<ContentItem>) => {
    await apiClient.updateSlide(id, data);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  };

  const handleDuplicate = async (item: ContentItem) => {
    const created = await apiClient.createSlide({
      title: `${item.title} (Copy)`,
      content: item.content,
      tags: item.tags,
      metadata: item.metadata as any,
    });
    setItems(prev => [...prev, created]);
  };

  const slideCount = (item: ContentItem): number => {
    const meta = item.metadata as Record<string, unknown> | undefined;
    return Number(meta?.slideCount) || (item.content?.match(/^##/gm) || []).length || 0;
  };

  const handleUseSample = async (markdown: string, title: string) => {
    try {
      const created = await apiClient.createSlide({
        title,
        content: markdown,
        tags: ['sample'],
        metadata: { slideCount: (markdown.match(/^##/gm) || []).length } as any,
      });
      setItems(prev => [...prev, created]);
      setShowSampler(false);
    } catch (err) {
      console.error('Failed to create sample slide deck:', err);
    }
  };

  if (showSampler) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SlideSampler
          colors={colors}
          isDark={isDark}
          onUseSample={handleUseSample}
        />
        <div style={{
          padding: '8px 16px', borderTop: `1px solid ${colors.border}`,
          backgroundColor: isDark ? '#111' : '#fafafa', flexShrink: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <button onClick={() => setShowSampler(false)} style={{
            padding: '6px 16px', backgroundColor: 'transparent',
            border: `1px solid ${colors.border}`, borderRadius: '6px',
            color: colors.textMuted, cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.5px',
          }}>BACK TO SLIDE DECKS</button>
        </div>
      </div>
    );
  }

  return (
    <ContentSplitPane
      colors={colors}
      isDark={isDark}
      contentType="slide"
      icon={Presentation}
      label="Slide Deck"
      items={items}
      loading={loading}
      onRefresh={fetchItems}
      onGenerate={handleGenerate}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
      onDuplicate={handleDuplicate}
      metaLine={(item) => (
        <>
          <span style={{
            padding: '1px 6px', borderRadius: '4px', fontSize: '9px',
            backgroundColor: `${colors.primaryYellow}15`, color: colors.primaryYellow,
            fontWeight: 600,
          }}>{slideCount(item)} slides</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <Clock size={9} />
          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
        </>
      )}
      extraToolbar={
        <button onClick={() => setShowSampler(true)} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', backgroundColor: 'transparent',
          border: `1px solid ${colors.border}`, borderRadius: '6px',
          color: colors.textMuted, cursor: 'pointer',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.5px',
          transition: 'all 0.15s ease',
        }}>
          <Sparkles size={11} /> SAMPLES
        </button>
      }
    />
  );
}
