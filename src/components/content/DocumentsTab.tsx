'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { File, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ContentSplitPane, ContentItem } from './ContentSplitPane';

interface DocumentsTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

export function DocumentsTab({ colors, isDark }: DocumentsTabProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getDocumentsContent();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /**
   * Generate DOCX using Claude Skills API (non-streaming, blocking).
   * Calls POST /api/backend/skills/create-word-document/execute
   * Returns the actual file for download.
   */
  const handleGenerate = async (prompt: string, title: string) => {
    try {
      const { getProxyUrl } = await import('@/lib/env');
      const { toast } = await import('sonner');
      const toastId = toast.loading(`Generating "${title}"...`, { duration: 300000 });

      const token = localStorage.getItem('auth_token') || '';
      const resp = await fetch(getProxyUrl('/skills/create-word-document/execute'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt, title }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
        throw new Error(errData.detail || `Skill execution failed (${resp.status})`);
      }

      const data = await resp.json();
      const result = data.result || data;
      toast.success(`"${title}" generated successfully!`, { id: toastId, duration: 5000 });
      fetchItems();
      return result;
    } catch (err) {
      console.error('Document generation failed:', err);
      const { toast } = await import('sonner');
      toast.error(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    await apiClient.deleteContentDocument(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = async (id: string, data: Partial<ContentItem>) => {
    await apiClient.updateDocument(id, data);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  };

  const handleDuplicate = async (item: ContentItem) => {
    const created = await apiClient.createDocument({
      title: `${item.title} (Copy)`,
      content: item.content,
      tags: item.tags,
      metadata: item.metadata as any,
    });
    setItems(prev => [...prev, created]);
  };

  const docType = (item: ContentItem): string => {
    const meta = item.metadata as Record<string, unknown> | undefined;
    return String(meta?.type || '') || item.tags?.[0] || 'Document';
  };

  return (
    <ContentSplitPane
      colors={colors}
      isDark={isDark}
      contentType="document"
      icon={File}
      label="Document"
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
          }}>{docType(item)}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <Clock size={9} />
          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
        </>
      )}
    />
  );
}
