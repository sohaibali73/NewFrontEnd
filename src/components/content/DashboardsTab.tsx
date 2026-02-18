'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  BarChart3,
  Clock,
  Layout,
  Pencil,
  Trash2,
  Copy,
  TrendingUp,
  PieChart,
  Activity,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Globe,
} from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface DashboardsTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface Widget {
  id: string;
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: string;
}

interface Dashboard {
  id: string;
  title: string;
  widgets: Widget[];
  updatedAt: string;
  status: 'live' | 'draft';
  type: 'portfolio' | 'market' | 'risk' | 'custom';
}

const STORAGE_KEY = 'content_dashboards';

const DEFAULT_DASHBOARDS: Dashboard[] = [
  {
    id: 'dash-001',
    title: 'Portfolio Overview',
    type: 'portfolio',
    status: 'live',
    updatedAt: '2026-02-18T14:00:00Z',
    widgets: [
      { id: 'w1', title: 'Total AUM', value: '$247.3M', change: '+2.4%', positive: true, icon: 'dollar' },
      { id: 'w2', title: 'YTD Return', value: '+12.4%', change: '+3.3% vs benchmark', positive: true, icon: 'trending' },
      { id: 'w3', title: 'Sharpe Ratio', value: '1.42', change: '+0.24 YoY', positive: true, icon: 'chart' },
      { id: 'w4', title: 'Max Drawdown', value: '-4.2%', change: 'vs -6.8% benchmark', positive: true, icon: 'activity' },
      { id: 'w5', title: 'Beta', value: '0.87', change: 'Defensive tilt', positive: true, icon: 'pie' },
      { id: 'w6', title: 'Active Clients', value: '34', change: '+2 this quarter', positive: true, icon: 'globe' },
      { id: 'w7', title: 'Cash Position', value: '3.1%', change: 'Target: 3%', positive: true, icon: 'dollar' },
      { id: 'w8', title: 'Equity Allocation', value: '65.2%', change: 'Target: 60–70%', positive: true, icon: 'chart' },
    ],
  },
  {
    id: 'dash-002',
    title: 'Market Monitor',
    type: 'market',
    status: 'live',
    updatedAt: '2026-02-18T13:30:00Z',
    widgets: [
      { id: 'w1', title: 'S&P 500', value: '5,842', change: '+0.43%', positive: true, icon: 'trending' },
      { id: 'w2', title: 'NASDAQ', value: '18,341', change: '+0.71%', positive: true, icon: 'trending' },
      { id: 'w3', title: '10Y Treasury', value: '4.62%', change: '-3 bps', positive: true, icon: 'chart' },
      { id: 'w4', title: 'USD Index (DXY)', value: '104.2', change: '+0.12%', positive: false, icon: 'globe' },
      { id: 'w5', title: 'VIX', value: '14.8', change: '-1.2', positive: true, icon: 'activity' },
      { id: 'w6', title: 'Gold (XAU)', value: '$2,384', change: '+0.28%', positive: true, icon: 'dollar' },
      { id: 'w7', title: 'Crude Oil (WTI)', value: '$78.42', change: '-0.64%', positive: false, icon: 'trending' },
      { id: 'w8', title: 'BTC/USD', value: '$52,140', change: '+1.84%', positive: true, icon: 'trending' },
      { id: 'w9', title: 'EUR/USD', value: '1.0841', change: '-0.08%', positive: false, icon: 'globe' },
      { id: 'w10', title: 'Fed Funds Rate', value: '4.75%', change: 'Unchanged', positive: true, icon: 'dollar' },
      { id: 'w11', title: 'CPI YoY', value: '3.1%', change: '-0.2% MoM', positive: true, icon: 'activity' },
      { id: 'w12', title: 'US Unemployment', value: '3.8%', change: 'Stable', positive: true, icon: 'pie' },
    ],
  },
  {
    id: 'dash-003',
    title: 'Risk Dashboard',
    type: 'risk',
    status: 'live',
    updatedAt: '2026-02-17T16:00:00Z',
    widgets: [
      { id: 'w1', title: 'Portfolio VaR (95%)', value: '-$1.2M', change: 'Per day, 1-day horizon', positive: true, icon: 'activity' },
      { id: 'w2', title: 'Beta vs S&P 500', value: '0.87', change: 'Defensive positioning', positive: true, icon: 'chart' },
      { id: 'w3', title: 'Tracking Error', value: '3.2%', change: 'Ann. vs blended bench', positive: true, icon: 'trending' },
      { id: 'w4', title: 'Correlation to HY', value: '0.41', change: 'Low credit beta', positive: true, icon: 'pie' },
      { id: 'w5', title: 'Liquidity Score', value: '94/100', change: '92% can liquidate <3 days', positive: true, icon: 'dollar' },
      { id: 'w6', title: 'Concentration Risk', value: 'Medium', change: 'Top 10 = 42% of equity', positive: false, icon: 'alert' },
    ],
  },
  {
    id: 'dash-004',
    title: 'Sector Allocation',
    type: 'custom',
    status: 'draft',
    updatedAt: '2026-02-15T11:00:00Z',
    widgets: [
      { id: 'w1', title: 'Technology', value: '28.4%', change: '+3.4% OW vs benchmark', positive: true, icon: 'chart' },
      { id: 'w2', title: 'Healthcare', value: '12.1%', change: '-1.9% UW', positive: false, icon: 'activity' },
      { id: 'w3', title: 'Financials', value: '14.8%', change: '+0.8% OW', positive: true, icon: 'dollar' },
      { id: 'w4', title: 'Energy', value: '8.2%', change: '+1.2% OW', positive: true, icon: 'trending' },
      { id: 'w5', title: 'Utilities', value: '5.4%', change: '+2.4% OW (AI power)', positive: true, icon: 'pie' },
      { id: 'w6', title: 'Consumer Disc.', value: '10.1%', change: '-2.9% UW', positive: false, icon: 'chart' },
      { id: 'w7', title: 'Industrials', value: '9.8%', change: 'Neutral', positive: true, icon: 'globe' },
      { id: 'w8', title: 'Int\'l Developed', value: '8.4%', change: 'Neutral weight', positive: true, icon: 'globe' },
    ],
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  dollar: DollarSign,
  trending: TrendingUp,
  chart: BarChart3,
  activity: Activity,
  pie: PieChart,
  globe: Globe,
  alert: AlertTriangle,
  check: CheckCircle,
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  portfolio: PieChart,
  market: TrendingUp,
  risk: Activity,
  custom: Layout,
};

function loadDashboards(): Dashboard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARDS;
    return JSON.parse(raw) as Dashboard[];
  } catch {
    return DEFAULT_DASHBOARDS;
  }
}

function saveDashboards(dashboards: Dashboard[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  } catch {}
}

export function DashboardsTab({ colors, isDark }: DashboardsTabProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreationChat, setShowCreationChat] = useState(false);

  useEffect(() => {
    const loaded = loadDashboards();
    setDashboards(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  const selected = dashboards.find((d) => d.id === selectedId) || null;

  const handleDelete = (id: string) => {
    const updated = dashboards.filter((d) => d.id !== id);
    setDashboards(updated);
    saveDashboards(updated);
    if (selectedId === id) setSelectedId(updated[0]?.id || null);
  };

  const handleDuplicate = (dashboard: Dashboard) => {
    const copy: Dashboard = {
      ...dashboard,
      id: `dash-${Date.now()}`,
      title: `${dashboard.title} (Copy)`,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    const updated = [...dashboards, copy];
    setDashboards(updated);
    saveDashboards(updated);
    setSelectedId(copy.id);
  };

  const handleCreated = (item: any) => {
    const newDash: Dashboard = {
      id: `dash-${Date.now()}`,
      title: item.title || 'New Dashboard',
      type: 'custom',
      status: 'live',
      updatedAt: new Date().toISOString(),
      widgets: [
        { id: 'w1', title: 'Total AUM', value: '$0', change: 'Connect data source', positive: true, icon: 'dollar' },
        { id: 'w2', title: 'YTD Return', value: '0.0%', change: 'Connect data source', positive: true, icon: 'trending' },
        { id: 'w3', title: 'Active Positions', value: '0', change: 'Connect data source', positive: true, icon: 'chart' },
        { id: 'w4', title: 'Risk Score', value: 'N/A', change: 'Connect data source', positive: true, icon: 'activity' },
      ],
    };
    const updated = [...dashboards, newDash];
    setDashboards(updated);
    saveDashboards(updated);
    setSelectedId(newDash.id);
    setShowCreationChat(false);
  };

  const cardBorder = `1px solid ${colors.border}`;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '280px',
          borderRight: cardBorder,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.surface,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '12px', borderBottom: cardBorder }}>
          <button
            onClick={() => setShowCreationChat(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              backgroundColor: colors.primaryYellow,
              color: colors.darkGray,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={16} /> NEW DASHBOARD
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {dashboards.map((dashboard) => {
            const TypeIcon = TYPE_ICONS[dashboard.type] || Layout;
            const isActive = selectedId === dashboard.id;
            return (
              <button
                key={dashboard.id}
                onClick={() => setSelectedId(dashboard.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px',
                  backgroundColor: isActive
                    ? isDark
                      ? '#2A2A2A'
                      : '#eeeeee'
                    : 'transparent',
                  border: isActive ? `1px solid ${colors.primaryYellow}40` : '1px solid transparent',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? '#333333' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TypeIcon size={17} color={colors.primaryYellow} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: colors.text,
                      fontSize: '13px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: "'Quicksand', sans-serif",
                    }}
                  >
                    {dashboard.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '3px',
                      fontSize: '11px',
                      color: colors.textMuted,
                    }}
                  >
                    <span>{dashboard.widgets.length} widgets</span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span
                      style={{
                        color:
                          dashboard.status === 'live' ? '#22c55e' : colors.primaryYellow,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '10px',
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      {dashboard.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                      fontSize: '10px',
                      color: colors.textSecondary,
                    }}
                  >
                    <Clock size={9} />
                    {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.background,
          overflow: 'hidden',
        }}
      >
        {selected ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Dashboard header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: cardBorder,
                flexShrink: 0,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: '18px',
                    color: colors.text,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  {selected.title}
                </h2>
                <p style={{ fontSize: '11px', color: colors.textMuted, margin: '2px 0 0' }}>
                  Last updated {new Date(selected.updatedAt).toLocaleString()}
                  {' · '}
                  <span
                    style={{
                      color: selected.status === 'live' ? '#22c55e' : colors.primaryYellow,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >
                    {selected.status}
                  </span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { icon: Pencil, label: 'Edit', action: () => {} },
                  { icon: Copy, label: 'Duplicate', action: () => handleDuplicate(selected) },
                  {
                    icon: Trash2,
                    label: 'Delete',
                    action: () => handleDelete(selected.id),
                  },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      padding: '7px',
                      backgroundColor: 'transparent',
                      border: cardBorder,
                      borderRadius: '8px',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    title={label}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        label === 'Delete' ? '#ef4444' : colors.primaryYellow;
                      e.currentTarget.style.color =
                        label === 'Delete' ? '#ef4444' : colors.primaryYellow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Widgets grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
                alignContent: 'start',
              }}
            >
              {selected.widgets.map((widget) => {
                const WidgetIcon = ICON_MAP[widget.icon] || BarChart3;
                return (
                  <div
                    key={widget.id}
                    style={{
                      backgroundColor: colors.cardBg,
                      border: cardBorder,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'default',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primaryYellow + '60';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          color: colors.textMuted,
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {widget.title}
                      </span>
                      <WidgetIcon size={14} color={colors.primaryYellow} />
                    </div>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: colors.text,
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                      }}
                    >
                      {widget.value}
                    </div>
                    {widget.change && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: widget.positive ? '#22c55e' : '#ef4444',
                          fontFamily: "'Quicksand', sans-serif",
                        }}
                      >
                        {widget.change}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <BarChart3
                size={48}
                color={colors.textSecondary}
                style={{ marginBottom: '16px', opacity: 0.4 }}
              />
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  color: colors.textMuted,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                Select a dashboard or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {showCreationChat && (
        <CreationChatModal
          colors={colors}
          isDark={isDark}
          contentType="dashboards"
          onClose={() => setShowCreationChat(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
