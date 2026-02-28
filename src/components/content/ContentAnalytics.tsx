'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Presentation, BookOpen, File,
  BarChart3, TrendingUp, Clock, Star,
  Calendar, Hash, Activity,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ContentAnalyticsProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface ContentItem {
  id: string;
  title: string;
  content?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

interface AnalyticsData {
  slides: ContentItem[];
  articles: ContentItem[];
  documents: ContentItem[];
  dashboards: ContentItem[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  colors,
  isDark,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  colors: Record<string, string>;
  isDark: boolean;
}) {
  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={color} />
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: "'Rajdhani', sans-serif",
            color: colors.text,
            lineHeight: 1,
            letterSpacing: '-0.5px',
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: '11px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            color: colors.textSecondary,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginTop: '4px',
          }}
        >
          {label}
        </div>
        {subValue && (
          <div
            style={{
              fontSize: '10px',
              fontFamily: "'Quicksand', sans-serif",
              color: colors.textMuted,
              marginTop: '2px',
            }}
          >
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  maxValue,
  color,
  colors,
  isDark,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  colors: Record<string, string>;
  isDark: boolean;
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span
        style={{
          fontSize: '11px',
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          color: colors.textSecondary,
          minWidth: '80px',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: '8px',
          borderRadius: '4px',
          backgroundColor: isDark ? '#2A2A2A' : '#e8e8e8',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '4px',
            width: `${percentage}%`,
            backgroundColor: color,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '12px',
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          color: colors.text,
          minWidth: '30px',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );

}

export function ContentAnalytics({ colors, isDark }: ContentAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData>({
    slides: [],
    articles: [],
    documents: [],
    dashboards: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [slides, articles, documents, dashboards] = await Promise.all([
          apiClient.getSlides().catch(() => []),
          apiClient.getArticles().catch(() => []),
          apiClient.getDocuments().catch(() => []),
          apiClient.getDashboards().catch(() => []),
        ]);
        setData({ slides, articles, documents, dashboards });
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const analytics = useMemo(() => {
    const allItems = [...data.slides, ...data.articles, ...data.documents, ...data.dashboards];
    const totalCount = allItems.length;

    // Count by status
    const statusCounts = {
      complete: allItems.filter((i) => i.status === 'complete').length,
      generating: allItems.filter((i) => i.status === 'generating').length,
      draft: allItems.filter((i) => !i.status || i.status === 'draft').length,
    };

    // Word count across all content
    const totalWords = allItems.reduce((sum, item) => {
      return sum + (item.content ? item.content.split(/\s+/).filter(Boolean).length : 0);
    }, 0);

    // Total read time in minutes
    const totalReadMinutes = Math.ceil(totalWords / 200);

    // Tags frequency
    const tagMap = new Map<string, number>();
    allItems.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    const topTags = [...tagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Recent activity (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentItems = allItems.filter(
      (i) => i.created_at && new Date(i.created_at) >= weekAgo
    );

    // Activity by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityByDay = new Array(7).fill(0);
    allItems.forEach((item) => {
      if (item.created_at) {
        const day = new Date(item.created_at).getDay();
        activityByDay[day]++;
      }
    });
    const maxDayActivity = Math.max(...activityByDay, 1);

    // Recent items list
    const recentCreated = [...allItems]
      .filter((i) => i.created_at)
      .sort(
        (a, b) =>
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
      .slice(0, 5);

    return {
      totalCount,
      statusCounts,
      totalWords,
      totalReadMinutes,
      topTags,
      recentItems,
      activityByDay,
      dayNames,
      maxDayActivity,
      recentCreated,
      typeCounts: {
        slides: data.slides.length,
        articles: data.articles.length,
        documents: data.documents.length,
        dashboards: data.dashboards.length,
      },
    };
  }, [data]);

  const maxTypeCount = Math.max(
    analytics.typeCounts.slides,
    analytics.typeCounts.articles,
    analytics.typeCounts.documents,
    analytics.typeCounts.dashboards,
    1
  );

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <Activity
          size={32}
          color={colors.primaryYellow}
          style={{ animation: 'spin 2s linear infinite' }}
        />
        <span
          style={{
            fontSize: '12px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            color: colors.textMuted,
            letterSpacing: '0.5px',
          }}
        >
          LOADING ANALYTICS...
        </span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: '20px',
            color: colors.text,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Content Analytics
        </h2>
        <p
          style={{
            fontSize: '13px',
            fontFamily: "'Quicksand', sans-serif",
            color: colors.textSecondary,
            margin: '4px 0 0',
          }}
        >
          Overview of your content creation activity and statistics
        </p>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={FileText}
          label="Total Content"
          value={analytics.totalCount}
          subValue={`${analytics.recentItems.length} created this week`}
          color={colors.primaryYellow}
          colors={colors}
          isDark={isDark}
        />
        <StatCard
          icon={Hash}
          label="Total Words"
          value={analytics.totalWords.toLocaleString()}
          subValue={`~${analytics.totalReadMinutes} min total read time`}
          color={colors.turquoise || '#00DED1'}
          colors={colors}
          isDark={isDark}
        />
        <StatCard
          icon={Star}
          label="Completed"
          value={analytics.statusCounts.complete}
          subValue={`${analytics.statusCounts.generating} generating, ${analytics.statusCounts.draft} drafts`}
          color="#10b981"
          colors={colors}
          isDark={isDark}
        />
        <StatCard
          icon={Calendar}
          label="This Week"
          value={analytics.recentItems.length}
          subValue="Items created in last 7 days"
          color="#8b5cf6"
          colors={colors}
          isDark={isDark}
        />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Content by Type */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.cardBg,
          }}
        >
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              color: colors.text,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            Content by Type
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                label: 'Slide Decks',
                value: analytics.typeCounts.slides,
                color: colors.primaryYellow,
                icon: Presentation,
              },
              {
                label: 'Articles',
                value: analytics.typeCounts.articles,
                color: colors.turquoise || '#00DED1',
                icon: BookOpen,
              },
              {
                label: 'Documents',
                value: analytics.typeCounts.documents,
                color: '#8b5cf6',
                icon: File,
              },
              {
                label: 'Dashboards',
                value: analytics.typeCounts.dashboards,
                color: '#f59e0b',
                icon: BarChart3,
              },
            ].map((item) => (
              <MiniBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={maxTypeCount}
                color={item.color}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* Weekly Activity */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.cardBg,
          }}
        >
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              color: colors.text,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            Creation by Day
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '8px',
              height: '120px',
              padding: '0 4px',
            }}
          >
            {analytics.activityByDay.map((count, index) => {
              const height =
                analytics.maxDayActivity > 0
                  ? (count / analytics.maxDayActivity) * 100
                  : 0;
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      color: colors.text,
                    }}
                  >
                    {count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${Math.max(height, 4)}%`,
                      borderRadius: '4px 4px 2px 2px',
                      backgroundColor:
                        count > 0 ? colors.primaryYellow : isDark ? '#2A2A2A' : '#e8e8e8',
                      opacity: count > 0 ? 0.8 + (height / 100) * 0.2 : 0.4,
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      color: colors.textSecondary,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {analytics.dayNames[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Tags */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.cardBg,
          }}
        >
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              color: colors.text,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            Top Tags
          </h3>
          {analytics.topTags.length === 0 ? (
            <p
              style={{
                fontSize: '12px',
                color: colors.textSecondary,
                fontFamily: "'Quicksand', sans-serif",
              }}
            >
              No tags found across your content.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {analytics.topTags.map(([tag, count]) => (
                <div
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    backgroundColor: isDark
                      ? 'rgba(254,192,15,0.08)'
                      : 'rgba(254,192,15,0.1)',
                    border: `1px solid ${colors.primaryYellow}20`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 600,
                      color: colors.text,
                    }}
                  >
                    {tag}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      color: colors.primaryYellow,
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '8px',
                      backgroundColor: `${colors.primaryYellow}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.cardBg,
          }}
        >
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              color: colors.text,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            Recent Activity
          </h3>
          {analytics.recentCreated.length === 0 ? (
            <p
              style={{
                fontSize: '12px',
                color: colors.textSecondary,
                fontFamily: "'Quicksand', sans-serif",
              }}
            >
              No content created yet.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {analytics.recentCreated.map((item) => {
                const typeIcon =
                  data.slides.find((s) => s.id === item.id)
                    ? Presentation
                    : data.articles.find((a) => a.id === item.id)
                      ? BookOpen
                      : data.documents.find((d) => d.id === item.id)
                        ? File
                        : BarChart3;
                const ItemIcon = typeIcon;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${colors.borderSubtle}`,
                    }}
                  >
                    <ItemIcon size={14} color={colors.textSecondary} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: colors.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        color: colors.textSecondary,
                        flexShrink: 0,
                      }}
                    >
                      <Clock size={10} />
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Unknown'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
