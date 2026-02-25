'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ContentSplitPane, ContentItem } from './ContentSplitPane';

interface DashboardsTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

export function DashboardsTab({ colors, isDark }: DashboardsTabProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getDashboards();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load dashboards:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleGenerate = async (prompt: string, title: string) => {
    try {
      const res = await apiClient.generateContent(prompt, 'dashboard', title);
      return res;
    } catch (err) {
      console.error('Dashboard generation failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    await apiClient.deleteDashboard(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = async (id: string, data: Partial<ContentItem>) => {
    await apiClient.updateDashboard(id, data);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  };

  const handleDuplicate = async (item: ContentItem) => {
    const created = await apiClient.createDashboard({
      title: `${item.title} (Copy)`,
      content: item.content,
      tags: item.tags,
      metadata: item.metadata as any,
    });
    setItems(prev => [...prev, created]);
  };

  return (
    <ContentSplitPane
      colors={colors}
      isDark={isDark}
      contentType="dashboard"
      icon={BarChart3}
      label="Dashboard"
      items={items}
      loading={loading}
      onRefresh={fetchItems}
      onGenerate={handleGenerate}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
      onDuplicate={handleDuplicate}
      metaLine={(item) => (
        <>
          {item.status === 'complete' ? (
            <span style={{
              padding: '1px 6px', borderRadius: '4px', fontSize: '9px',
              backgroundColor: 'rgba(0,222,209,0.12)', color: colors.turquoise || '#00DED1',
              fontWeight: 600,
            }}>COMPLETE</span>
          ) : item.status ? (
            <span style={{
              padding: '1px 6px', borderRadius: '4px', fontSize: '9px',
              backgroundColor: `${colors.primaryYellow}15`, color: colors.primaryYellow,
              fontWeight: 600, textTransform: 'uppercase',
            }}>{item.status}</span>
          ) : null}
          <span style={{ opacity: 0.4 }}>|</span>
          <Clock size={9} />
          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
        </>
      )}
    />
  );
}
