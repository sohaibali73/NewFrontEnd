'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Presentation,
  File,
  BarChart3,
  Sliders,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ContentChat } from '@/components/content/ContentChat';
import { SlideDecksTab } from '@/components/content/SlideDecksTab';
import { ArticlesTab } from '@/components/content/ArticlesTab';
import { DocumentsTab } from '@/components/content/DocumentsTab';
import { DashboardsTab } from '@/components/content/DashboardsTab';
import { WritingStyleSettings } from '@/components/content/WritingStyleSettings';

export function ContentPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const colors = {
    background: isDark ? '#0F0F0F' : '#ffffff',
    surface: isDark ? '#1A1A1A' : '#f8f8f8',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#262626' : '#f0f0f0',
    border: isDark ? '#333333' : '#e5e5e5',
    borderSubtle: isDark ? '#2A2A2A' : '#eeeeee',
    text: isDark ? '#E8E8E8' : '#1A1A1A',
    textMuted: isDark ? '#B0B0B0' : '#666666',
    textSecondary: isDark ? '#808080' : '#999999',
    primaryYellow: '#FEC00F',
    darkGray: '#212121',
    accentYellow: '#FFD700',
    turquoise: '#00DED1',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: colors.background,
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '56px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.cardBg,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${colors.primaryYellow} 0%, ${colors.accentYellow} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color={colors.darkGray} />
          </div>
          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '20px',
              color: colors.text,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Content Studio
          </h1>
        </div>

        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            color: colors.textMuted,
            cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.primaryYellow;
            e.currentTarget.style.color = colors.primaryYellow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          <Sliders size={16} />
          WRITING STYLES
        </button>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              padding: '0 16px',
              flexShrink: 0,
            }}
          >
            <TabsList
              className="bg-transparent h-auto p-0 gap-0"
              style={{ borderRadius: 0 }}
            >
              {[
                { value: 'chat', label: 'CHAT', icon: MessageCircle },
                { value: 'slides', label: 'SLIDE DECKS', icon: Presentation },
                { value: 'articles', label: 'ARTICLES', icon: BookOpen },
                { value: 'documents', label: 'DOCUMENTS', icon: File },
                { value: 'dashboards', label: 'DASHBOARDS', icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none shadow-none data-[state=active]:shadow-none"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      color: isActive ? colors.primaryYellow : colors.textMuted,
                      backgroundColor: 'transparent',
                      borderBottom: isActive
                        ? `2px solid ${colors.primaryYellow}`
                        : '2px solid transparent',
                      borderRadius: 0,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <TabsContent
              value="chat"
              className="m-0 h-full"
              style={{ height: '100%' }}
            >
              <ContentChat colors={colors} isDark={isDark} />
            </TabsContent>

            <TabsContent
              value="slides"
              className="m-0 h-full"
              style={{ height: '100%' }}
            >
              <SlideDecksTab colors={colors} isDark={isDark} />
            </TabsContent>

            <TabsContent
              value="articles"
              className="m-0 h-full"
              style={{ height: '100%' }}
            >
              <ArticlesTab colors={colors} isDark={isDark} />
            </TabsContent>

            <TabsContent
              value="documents"
              className="m-0 h-full"
              style={{ height: '100%' }}
            >
              <DocumentsTab colors={colors} isDark={isDark} />
            </TabsContent>

            <TabsContent
              value="dashboards"
              className="m-0 h-full"
              style={{ height: '100%' }}
            >
              <DashboardsTab colors={colors} isDark={isDark} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Writing Style Settings Dialog */}
      {settingsOpen && (
        <WritingStyleSettings
          colors={colors}
          isDark={isDark}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default ContentPage;
