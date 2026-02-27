'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Presentation, Clock, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ContentSplitPane, ContentItem } from './ContentSplitPane';
import { SlideSampler } from './SlideSampler';

interface SlideDecksTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

export function SlideDecksTab({ colors, isDark }: SlideDecksTabProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSampler, setShowSampler] = useState(false);

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
