'use client';

import React from 'react';
import { Tag, FolderOpen, FileText, HardDrive } from 'lucide-react';
import { BrainStats } from '@/types/api';

interface KBTagCloudProps {
  stats: BrainStats | null;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
}

const catColors: Record<string, { bg: string; text: string; icon: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F', icon: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e', icon: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', icon: '#818cf8' },
  documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', icon: '#3b82f6' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af', icon: '#9ca3af' },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function KBTagCloud({
  stats,
  categories,
  activeCategory,
  onCategoryChange,
  isDark,
  colors,
  isMobile,
}: KBTagCloudProps) {
  if (!stats) return null;

  const totalDocs = stats.total_documents;
  const catEntries = Object.entries(stats.categories);

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isMobile ? '16px' : '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Tag size={16} color={colors.accent} />
        <h3
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '16px',
            fontWeight: 700,
            color: colors.text,
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          CATEGORIES & TAGS
        </h3>
      </div>

      {/* Stats Summary */}
      <div
        style={{
          padding: isMobile ? '16px' : '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        {[
          {
            label: 'Documents',
            value: totalDocs,
            icon: FileText,
            iconColor: colors.accent,
          },
          {
            label: 'Total Size',
            value: formatFileSize(stats.total_size),
            icon: HardDrive,
            iconColor: '#3b82f6',
          },
          {
            label: 'Categories',
            value: catEntries.length,
            icon: FolderOpen,
            iconColor: '#22c55e',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
              }}
            >
              <Icon
                size={18}
                color={stat.iconColor}
                style={{ marginBottom: '6px' }}
              />
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '22px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: '11px',
                  margin: '4px 0 0 0',
                }}
              >
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Category Buttons */}
      <div style={{ padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* "All" button */}
          <button
            onClick={() => onCategoryChange('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${
                activeCategory === 'all' ? colors.accent : colors.border
              }`,
              backgroundColor:
                activeCategory === 'all'
                  ? `${colors.accent}14`
                  : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <FolderOpen
                size={16}
                color={
                  activeCategory === 'all' ? colors.accent : colors.textMuted
                }
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color:
                    activeCategory === 'all' ? colors.accent : colors.text,
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                }}
              >
                ALL DOCUMENTS
              </span>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color:
                  activeCategory === 'all' ? colors.accent : colors.textMuted,
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              {totalDocs}
            </span>
          </button>

          {/* Category buttons */}
          {catEntries.map(([cat, count]) => {
            const cc = catColors[cat] || catColors.general;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${isActive ? cc.text : colors.border}`,
                  backgroundColor: isActive ? cc.bg : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: cc.text,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isActive ? cc.text : colors.text,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cat}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Progress bar showing proportion */}
                  <div
                    style={{
                      width: '40px',
                      height: '4px',
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${totalDocs > 0 ? (count / totalDocs) * 100 : 0}%`,
                        height: '100%',
                        backgroundColor: cc.text,
                        borderRadius: '2px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isActive ? cc.text : colors.textMuted,
                      fontFamily: "'Rajdhani', sans-serif",
                      minWidth: '20px',
                      textAlign: 'right',
                    }}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
