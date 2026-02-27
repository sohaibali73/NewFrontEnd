'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  MessageCircle,
  Presentation,
  File,
  BarChart3,
  Sliders,
  BookOpen,
  Sparkles,
  BrainCircuit,
  LayoutTemplate,
  Activity,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useResponsive } from '@/hooks/useResponsive';

// Only ContentChat is loaded eagerly (default tab).
// All other tabs are lazy-loaded to reduce initial bundle size.
import { ContentChat } from '@/components/content/ContentChat';

const TabLoader = () => <div className="w-full h-64 animate-pulse bg-muted rounded-lg" />;
const SlideDecksTab = dynamic(() => import('@/components/content/SlideDecksTab').then(m => ({ default: m.SlideDecksTab })), { loading: TabLoader });
const ArticlesTab = dynamic(() => import('@/components/content/ArticlesTab').then(m => ({ default: m.ArticlesTab })), { loading: TabLoader });
const DocumentsTab = dynamic(() => import('@/components/content/DocumentsTab').then(m => ({ default: m.DocumentsTab })), { loading: TabLoader });
const DashboardsTab = dynamic(() => import('@/components/content/DashboardsTab').then(m => ({ default: m.DashboardsTab })), { loading: TabLoader });
const WritingStyleSettings = dynamic(() => import('@/components/content/WritingStyleSettings').then(m => ({ default: m.WritingStyleSettings })), { loading: TabLoader });
const SkillsTab = dynamic(() => import('@/components/content/SkillsTab'), { loading: TabLoader });
const GlobalSearch = dynamic(() => import('@/components/content/GlobalSearch').then(m => ({ default: m.GlobalSearch })), { loading: TabLoader });
const ContentAnalytics = dynamic(() => import('@/components/content/ContentAnalytics').then(m => ({ default: m.ContentAnalytics })), { loading: TabLoader });

// TemplatesPanel is used as a sheet/modal - lazy load it too
import { type Template } from '@/components/content/TemplatesPanel';
const TemplatesPanel = dynamic(() => import('@/components/content/TemplatesPanel').then(m => ({ default: m.TemplatesPanel })), { loading: TabLoader });

export function ContentPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { isMobile, isTablet } = useResponsive();
  const isCompact = isMobile || isTablet;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [navigateToItemId, setNavigateToItemId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateForTab, setTemplateForTab] = useState<Template | null>(null);

  const handleSelectTemplate = (template: Template) => {
    // Navigate to the correct tab and pass template data
    const tabMap: Record<string, string> = {
      slide: 'slides',
      article: 'articles',
      document: 'documents',
      dashboard: 'dashboards',
    };
    setActiveTab(tabMap[template.contentType] || 'articles');
    setTemplateForTab(template);
    // Clear after components pick it up
    setTimeout(() => setTemplateForTab(null), 500);
  };

  const handleGlobalNavigate = (tab: string, itemId: string) => {
    setActiveTab(tab);
    setNavigateToItemId(itemId);
    // Clear after a tick so the tab can pick it up
    setTimeout(() => setNavigateToItemId(null), 500);
  };

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
          padding: isMobile ? '0 12px' : '0 24px',
          height: '56px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.cardBg,
          flexShrink: 0,
          gap: '8px',
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
          {!isMobile && (
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
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GlobalSearch
            colors={colors}
            isDark={isDark}
            onNavigate={handleGlobalNavigate}
          />
          <button
            onClick={() => setShowTemplates(true)}
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
            <LayoutTemplate size={16} />
            {!isMobile && 'TEMPLATES'}
          </button>
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
            {!isMobile && 'WRITING STYLES'}
          </button>
        </div>
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
              padding: isMobile ? '0 8px' : '0 16px',
              flexShrink: 0,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
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
                { value: 'skills', label: 'AI SKILLS', icon: BrainCircuit },
                { value: 'analytics', label: 'ANALYTICS', icon: Activity },
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
                      gap: isMobile ? '0px' : '8px',
                      padding: isMobile ? '12px 12px' : '12px 20px',
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
                      whiteSpace: 'nowrap',
                      minHeight: '44px',
                    }}
                  >
                    <Icon size={16} />
                    {!isMobile && tab.label}
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

            <TabsContent
              value="skills"
              className="m-0 h-full"
              style={{ height: '100%', overflowY: 'auto', padding: '20px' }}
            >
              <SkillsTab />
            </TabsContent>

            <TabsContent
              value="analytics"
              className="m-0 h-full"
              style={{ height: '100%' }}
            >
              <ContentAnalytics colors={colors} isDark={isDark} />
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

      {/* Templates Panel */}
      {showTemplates && (
        <TemplatesPanel
          colors={colors}
          isDark={isDark}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      )}
    </div>
  );
}

export default ContentPage;
