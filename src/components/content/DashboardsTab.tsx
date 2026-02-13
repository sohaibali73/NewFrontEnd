'use client';

import React, { useState } from 'react';
import { Plus, BarChart3, Clock, Layout, Pencil, Trash2, Copy, TrendingUp, PieChart, Activity } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface DashboardsTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface Dashboard {
  id: string;
  title: string;
  widgetCount: number;
  updatedAt: string;
  status: 'live' | 'draft';
  type: 'portfolio' | 'market' | 'risk' | 'custom';
}

const PLACEHOLDER_DASHBOARDS: Dashboard[] = [
  { id: '1', title: 'Portfolio Overview', widgetCount: 8, updatedAt: '30 min ago', status: 'live', type: 'portfolio' },
  { id: '2', title: 'Market Monitor', widgetCount: 12, updatedAt: '2 hours ago', status: 'live', type: 'market' },
  { id: '3', title: 'Risk Dashboard', widgetCount: 6, updatedAt: '1 day ago', status: 'draft', type: 'risk' },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  portfolio: PieChart,
  market: TrendingUp,
  risk: Activity,
  custom: Layout,
};

export function DashboardsTab({ colors, isDark }: DashboardsTabProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>(PLACEHOLDER_DASHBOARDS);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [showCreationChat, setShowCreationChat] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Dashboard List */}
      <div
        style={{
          width: '320px',
          borderRight: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.surface,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
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
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '0.5px',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus size={18} />
            NEW DASHBOARD
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {dashboards.map((dashboard) => {
            const TypeIcon = TYPE_ICONS[dashboard.type] || Layout;
            return (
              <button
                key={dashboard.id}
                onClick={() => setSelectedDashboard(dashboard.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: selectedDashboard === dashboard.id
                    ? isDark ? '#2A2A2A' : '#eeeeee'
                    : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: isDark ? '#333333' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TypeIcon size={20} color={colors.primaryYellow} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: colors.text,
                      fontSize: '14px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dashboard.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      fontSize: '12px',
                      color: colors.textMuted,
                    }}
                  >
                    <span>{dashboard.widgetCount} widgets</span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span
                      style={{
                        color:
                          dashboard.status === 'live'
                            ? colors.turquoise
                            : colors.primaryYellow,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.3px',
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
                      marginTop: '4px',
                      fontSize: '11px',
                      color: colors.textSecondary,
                    }}
                  >
                    <Clock size={11} />
                    {dashboard.updatedAt}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Preview */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.background,
          overflow: 'hidden',
        }}
      >
        {selectedDashboard ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexShrink: 0,
              }}
            >
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
                {dashboards.find((d) => d.id === selectedDashboard)?.title}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { icon: Pencil, label: 'Edit Layout' },
                  { icon: Copy, label: 'Duplicate' },
                  { icon: Trash2, label: 'Delete' },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
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
                      e.currentTarget.style.borderColor = colors.primaryYellow;
                      e.currentTarget.style.color = colors.primaryYellow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Widget Grid Placeholder */}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: '12px',
                overflow: 'auto',
              }}
            >
              {Array.from({
                length: dashboards.find((d) => d.id === selectedDashboard)?.widgetCount || 0,
              })
                .slice(0, 9)
                .map((_, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: '10px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primaryYellow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    <BarChart3 size={24} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                    <span
                      style={{
                        color: colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      Widget {i + 1}
                    </span>
                  </div>
                ))}
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
              <BarChart3 size={48} color={colors.textSecondary} style={{ marginBottom: '16px', opacity: 0.5 }} />
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
        />
      )}
    </div>
  );
}
