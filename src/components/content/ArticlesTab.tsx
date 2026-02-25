'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ContentSplitPane, ContentItem } from './ContentSplitPane';

interface ArticlesTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

export function ArticlesTab({ colors, isDark }: ArticlesTabProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getArticles();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load articles:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleGenerate = async (prompt: string, title: string) => {
    try {
      const res = await apiClient.generateContent(prompt, 'article', title);
      return res;
    } catch (err) {
      console.error('Article generation failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    await apiClient.deleteArticle(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = async (id: string, data: Partial<ContentItem>) => {
    await apiClient.updateArticle(id, data);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  };

  const handleDuplicate = async (item: ContentItem) => {
    const created = await apiClient.createArticle({
      title: `${item.title} (Copy)`,
      content: item.content,
      tags: item.tags,
    });
    setItems(prev => [...prev, created]);
  };

  const wordCount = (s: string) => s ? s.split(/\s+/).filter(Boolean).length : 0;
  const readTime = (s: string) => {
    const w = wordCount(s);
    return w < 200 ? '< 1 min' : `${Math.ceil(w / 200)} min`;
  };

  return (
    <ContentSplitPane
      colors={colors}
      isDark={isDark}
      contentType="article"
      icon={BookOpen}
      label="Article"
      items={items}
      loading={loading}
      onRefresh={fetchItems}
      onGenerate={handleGenerate}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
      onDuplicate={handleDuplicate}
      metaLine={(item) => (
        <>
          {(item.tags || []).slice(0, 2).map(t => (
            <span key={t} style={{
              padding: '1px 6px', borderRadius: '4px', fontSize: '9px',
              backgroundColor: isDark ? '#2A2A2A' : '#e8e8e8',
              color: colors.textSecondary,
            }}>{t}</span>
          ))}
          <span style={{ opacity: 0.4 }}>|</span>
          <span>{wordCount(item.content || '')} words</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>{readTime(item.content || '')} read</span>
        </>
      )}
    />
  );
}
