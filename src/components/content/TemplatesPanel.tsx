'use client';

import React, { useState } from 'react';
import {
  X, Presentation, BookOpen, File, BarChart3,
  Sparkles, Layout, TrendingUp, Users, FileText,
  PieChart, Shield, Briefcase, MessageSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  contentType: 'slide' | 'article' | 'document' | 'dashboard';
  prefillTitle: string;
  prefillPrompt: string;
}

interface TemplatesPanelProps {
  colors: Record<string, string>;
  isDark: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  filterType?: 'slide' | 'article' | 'document' | 'dashboard';
}

const TEMPLATES: Template[] = [
  // Slide Templates
  {
    id: 'slide-market-update',
    name: 'Market Update',
    description: 'Weekly or monthly market performance overview with key indices, sector rotation, and outlook.',
    icon: TrendingUp,
    category: 'Slides',
    contentType: 'slide',
    prefillTitle: 'Market Update',
    prefillPrompt: 'Create a market update slide deck covering major indices performance, sector rotation, key economic data releases, and near-term market outlook with 8-10 slides.',
  },
  {
    id: 'slide-investment-thesis',
    name: 'Investment Thesis',
    description: 'Structured pitch for a specific stock or asset with thesis, catalysts, risks, and valuation.',
    icon: Sparkles,
    category: 'Slides',
    contentType: 'slide',
    prefillTitle: 'Investment Thesis',
    prefillPrompt: 'Create an investment thesis slide deck with sections for executive summary, company overview, thesis statement, key catalysts, financial analysis, valuation, risks and mitigants, and recommendation with 10-12 slides.',
  },
  {
    id: 'slide-quarterly-review',
    name: 'Quarterly Review',
    description: 'Portfolio performance review with attribution analysis and strategy adjustments.',
    icon: PieChart,
    category: 'Slides',
    contentType: 'slide',
    prefillTitle: 'Quarterly Review',
    prefillPrompt: 'Create a quarterly portfolio review slide deck covering portfolio performance vs benchmarks, attribution analysis, top/bottom contributors, strategy adjustments, and forward outlook with 10-12 slides.',
  },
  {
    id: 'slide-client-onboarding',
    name: 'Client Onboarding',
    description: 'Welcome presentation for new clients covering investment approach and expectations.',
    icon: Users,
    category: 'Slides',
    contentType: 'slide',
    prefillTitle: 'Client Onboarding',
    prefillPrompt: 'Create a client onboarding slide deck covering firm overview, investment philosophy, portfolio construction approach, risk management framework, reporting cadence, and next steps with 8-10 slides.',
  },

  // Article Templates
  {
    id: 'article-research-note',
    name: 'Research Note',
    description: 'Deep-dive analysis on a specific stock, sector, or investment theme.',
    icon: FileText,
    category: 'Articles',
    contentType: 'article',
    prefillTitle: 'Research Note',
    prefillPrompt: 'Write a detailed research note covering company overview, industry dynamics, competitive positioning, financial analysis, valuation, key risks, and investment conclusion. Include relevant data points and analysis.',
  },
  {
    id: 'article-market-commentary',
    name: 'Market Commentary',
    description: 'Regular market insights covering recent developments and forward positioning.',
    icon: MessageSquare,
    category: 'Articles',
    contentType: 'article',
    prefillTitle: 'Market Commentary',
    prefillPrompt: 'Write a market commentary article covering this week\'s key market events, economic data analysis, sector performance review, and positioning thoughts for the coming weeks.',
  },
  {
    id: 'article-strategy-deep-dive',
    name: 'Strategy Deep-Dive',
    description: 'Comprehensive analysis of an investment strategy with backtesting context.',
    icon: TrendingUp,
    category: 'Articles',
    contentType: 'article',
    prefillTitle: 'Strategy Deep-Dive',
    prefillPrompt: 'Write a comprehensive strategy deep-dive article covering strategy overview, market conditions it targets, entry/exit rules, risk management, historical performance analysis, strengths and weaknesses, and implementation considerations.',
  },

  // Document Templates
  {
    id: 'doc-client-letter',
    name: 'Client Letter',
    description: 'Professional letter to clients covering portfolio updates and market context.',
    icon: File,
    category: 'Documents',
    contentType: 'document',
    prefillTitle: 'Client Letter',
    prefillPrompt: 'Write a professional client letter covering a summary of recent portfolio activity, market environment context, portfolio positioning rationale, and forward-looking commentary. Use a formal but approachable tone.',
  },
  {
    id: 'doc-due-diligence',
    name: 'Due Diligence Report',
    description: 'Structured due diligence framework for evaluating an investment opportunity.',
    icon: Shield,
    category: 'Documents',
    contentType: 'document',
    prefillTitle: 'Due Diligence Report',
    prefillPrompt: 'Write a due diligence report template covering executive summary, business model analysis, management assessment, financial review, competitive landscape, regulatory considerations, risk factors, and investment recommendation.',
  },
  {
    id: 'doc-meeting-minutes',
    name: 'Meeting Minutes',
    description: 'Structured meeting notes template with action items and decisions.',
    icon: Briefcase,
    category: 'Documents',
    contentType: 'document',
    prefillTitle: 'Meeting Minutes',
    prefillPrompt: 'Write structured meeting minutes covering attendees, agenda items, key discussion points, decisions made, action items with owners and deadlines, and next meeting date. Use clear, concise bullet points.',
  },

  // Dashboard Templates
  {
    id: 'dash-portfolio-overview',
    name: 'Portfolio Overview',
    description: 'Interactive dashboard showing portfolio holdings, allocation, and performance.',
    icon: Layout,
    category: 'Dashboards',
    contentType: 'dashboard',
    prefillTitle: 'Portfolio Overview Dashboard',
    prefillPrompt: 'Create an interactive HTML dashboard showing portfolio overview with sections for: asset allocation pie chart, top 10 holdings table, performance metrics (MTD, QTD, YTD), sector exposure, and risk metrics. Use clean, professional styling.',
  },
  {
    id: 'dash-risk-dashboard',
    name: 'Risk Dashboard',
    description: 'Risk monitoring dashboard with VaR, drawdown, and concentration metrics.',
    icon: Shield,
    category: 'Dashboards',
    contentType: 'dashboard',
    prefillTitle: 'Risk Dashboard',
    prefillPrompt: 'Create an interactive HTML risk dashboard showing Value at Risk (VaR), maximum drawdown chart, position concentration analysis, sector exposure heatmap, and correlation matrix. Use a clean dark-themed professional design.',
  },
];

const TYPE_CONFIG: { type: string; label: string; icon: LucideIcon }[] = [
  { type: 'all', label: 'All Templates', icon: Sparkles },
  { type: 'slide', label: 'Slides', icon: Presentation },
  { type: 'article', label: 'Articles', icon: BookOpen },
  { type: 'document', label: 'Documents', icon: File },
  { type: 'dashboard', label: 'Dashboards', icon: BarChart3 },
];

export function TemplatesPanel({
  colors,
  isDark,
  onClose,
  onSelectTemplate,
  filterType,
}: TemplatesPanelProps) {
  const [selectedType, setSelectedType] = useState<string>(filterType || 'all');

  const filtered = selectedType === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.contentType === selectedType);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '720px',
          maxHeight: '85vh',
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.6)'
            : '0 24px 80px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${colors.primaryYellow}, ${colors.accentYellow || '#FFD700'})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color={colors.darkGray} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px',
                  color: colors.text,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                Templates
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textSecondary,
                  fontFamily: "'Quicksand', sans-serif",
                  margin: 0,
                }}
              >
                Start from a pre-built template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'none',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Type tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '12px 24px',
            borderBottom: `1px solid ${colors.border}`,
            overflowX: 'auto',
          }}
        >
          {TYPE_CONFIG.map(({ type, label, icon: TypeIcon }) => {
            const isActive = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: isActive
                    ? `${colors.primaryYellow}18`
                    : 'transparent',
                  border: `1px solid ${isActive ? colors.primaryYellow + '40' : colors.borderSubtle}`,
                  color: isActive ? colors.primaryYellow : colors.textMuted,
                  transition: 'all 0.15s ease',
                }}
              >
                <TypeIcon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Template grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            alignContent: 'start',
          }}
        >
          {filtered.map((template) => {
            const TemplateIcon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px',
                  textAlign: 'left',
                  backgroundColor: isDark ? '#1A1A1A' : '#f8f8f8',
                  border: `1px solid ${colors.borderSubtle}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primaryYellow + '60';
                  e.currentTarget.style.backgroundColor = isDark
                    ? '#222222'
                    : '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.borderSubtle;
                  e.currentTarget.style.backgroundColor = isDark
                    ? '#1A1A1A'
                    : '#f8f8f8';
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: `${colors.primaryYellow}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TemplateIcon size={18} color={colors.primaryYellow} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: colors.text,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.3px',
                      marginBottom: '4px',
                    }}
                  >
                    {template.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.textSecondary,
                      fontFamily: "'Quicksand', sans-serif",
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {template.description}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 700,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                      backgroundColor: `${colors.primaryYellow}12`,
                      color: colors.primaryYellow,
                    }}
                  >
                    {template.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

export type { Template };
