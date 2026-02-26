'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Presentation, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ContentSplitPane, ContentItem } from './ContentSplitPane';

interface SlideDecksTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

export function SlideDecksTab({ colors, isDark }: SlideDecksTabProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleGenerate = async (prompt: string, title: string) => {
    try {
      const res = await apiClient.generateContent(prompt, 'slide', title);
      return res;
    } catch (err) {
      console.error('Slide generation failed:', err);
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
    />
  );
}
