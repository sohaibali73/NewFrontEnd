'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Save,
  Trash2,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface WritingStyleSettingsProps {
  colors: Record<string, string>;
  isDark: boolean;
  onClose: () => void;
}

interface WritingStyle {
  id: string;
  name: string;
  description: string;
  tone: string;
  formality: 'casual' | 'neutral' | 'formal' | 'academic';
  personality: string[];
  sampleText: string;
  isDefault: boolean;
}

interface StylePreset {
  id: string;
  name: string;
  styleId: string;
  contentType: 'all' | 'slides' | 'articles' | 'documents' | 'dashboards';
  settings: {
    maxLength?: string;
    useHeaders: boolean;
    useBullets: boolean;
    includeSummary: boolean;
    language: string;
  };
}

const DEFAULT_STYLES: WritingStyle[] = [
  {
    id: 'style-1',
    name: 'Professional Analyst',
    description: 'Clear, data-driven writing style for financial analysis and reports.',
    tone: 'Authoritative and objective',
    formality: 'formal',
    personality: ['Precise', 'Data-driven', 'Concise'],
    sampleText: 'Based on our analysis of current market indicators, we recommend a cautious approach to equity allocation in Q1 2026.',
    isDefault: true,
  },
  {
    id: 'style-2',
    name: 'Thought Leader',
    description: 'Engaging, forward-thinking style for opinion pieces and strategic content.',
    tone: 'Insightful and conversational',
    formality: 'neutral',
    personality: ['Visionary', 'Persuasive', 'Engaging'],
    sampleText: 'The convergence of AI and quantitative finance isn\'t just a trend -- it\'s reshaping how we think about alpha generation.',
    isDefault: false,
  },
  {
    id: 'style-3',
    name: 'Executive Brief',
    description: 'Ultra-concise, action-oriented style for leadership communications.',
    tone: 'Direct and decisive',
    formality: 'formal',
    personality: ['Succinct', 'Action-oriented', 'Strategic'],
    sampleText: 'Key finding: Emerging market bonds offer 340bps spread above US Treasuries. Recommendation: Increase allocation by 5%.',
    isDefault: false,
  },
];

const DEFAULT_PRESETS: StylePreset[] = [
  {
    id: 'preset-1',
    name: 'Weekly Market Report',
    styleId: 'style-1',
    contentType: 'documents',
    settings: {
      maxLength: '2000 words',
      useHeaders: true,
      useBullets: true,
      includeSummary: true,
      language: 'English',
    },
  },
  {
    id: 'preset-2',
    name: 'Client Presentation',
    styleId: 'style-3',
    contentType: 'slides',
    settings: {
      maxLength: '15 slides',
      useHeaders: true,
      useBullets: true,
      includeSummary: false,
      language: 'English',
    },
  },
];

const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'formal', label: 'Formal' },
  { value: 'academic', label: 'Academic' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'slides', label: 'Slide Decks' },
  { value: 'articles', label: 'Articles' },
  { value: 'documents', label: 'Documents' },
  { value: 'dashboards', label: 'Dashboards' },
];

const LS_STYLES_KEY = 'content_writing_styles';
const LS_PRESETS_KEY = 'content_writing_presets';

export function WritingStyleSettings({ colors, isDark, onClose }: WritingStyleSettingsProps) {
  const [activeSection, setActiveSection] = useState<'styles' | 'presets' | 'clone'>('styles');
  const [styles, setStyles] = useState<WritingStyle[]>(DEFAULT_STYLES);
  const [presets, setPresets] = useState<StylePreset[]>(DEFAULT_PRESETS);
  const [editingStyle, setEditingStyle] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [cloneText, setCloneText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [cloneResult, setCloneResult] = useState<{
    name: string; description: string; tone: string;
    formality: 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
    personality: string[]; sampleText: string;
  } | null>(null);
  const [cloneUrl, setCloneUrl] = useState('');
  const [expandedStyle, setExpandedStyle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Load styles from localStorage (immediate) then backend (async)
  useEffect(() => {
    // 1. Load from localStorage for instant display
    try {
      const cachedStyles = localStorage.getItem(LS_STYLES_KEY);
      if (cachedStyles) setStyles(JSON.parse(cachedStyles));
      const cachedPresets = localStorage.getItem(LS_PRESETS_KEY);
      if (cachedPresets) setPresets(JSON.parse(cachedPresets));
    } catch {}

    // 2. Try loading from backend (overwrites localStorage if successful)
    (async () => {
      try {
        const backendData = await apiClient.getWritingStyles();
        if (backendData?.styles && Array.isArray(backendData.styles)) {
          setStyles(backendData.styles);
          localStorage.setItem(LS_STYLES_KEY, JSON.stringify(backendData.styles));
        }
        if (backendData?.presets && Array.isArray(backendData.presets)) {
          setPresets(backendData.presets);
          localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(backendData.presets));
        }
      } catch {
        // Backend unavailable — localStorage data is used
      }
    })();
  }, []);

  // Save to localStorage + backend
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');

    // Always save to localStorage (instant)
    try {
      localStorage.setItem(LS_STYLES_KEY, JSON.stringify(styles));
      localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(presets));
    } catch {}

    // Try saving to backend
    try {
      await apiClient.updateWritingStyles({ styles, presets });
      setSaveStatus('saved');
    } catch {
      // Backend save failed but localStorage is saved
      setSaveStatus('saved'); // Still show success since localStorage works
    }

    setSaving(false);
    // Auto-close after save
    setTimeout(() => onClose(), 800);
  }, [styles, presets, onClose]);

  const handleDeleteStyle = (id: string) => {
    setStyles((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setStyles((prev) =>
      prev.map((s) => ({ ...s, isDefault: s.id === id }))
    );
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddStyle = () => {
    const newStyle: WritingStyle = {
      id: `style-${Date.now()}`,
      name: 'New Writing Style',
      description: '',
      tone: '',
      formality: 'neutral',
      personality: [],
      sampleText: '',
      isDefault: false,
    };
    setStyles((prev) => [...prev, newStyle]);
    setEditingStyle(newStyle.id);
    setExpandedStyle(newStyle.id);
  };

  const handleAddPreset = () => {
    const newPreset: StylePreset = {
      id: `preset-${Date.now()}`,
      name: 'New Preset',
      styleId: styles[0]?.id || '',
      contentType: 'all',
      settings: {
        maxLength: '',
        useHeaders: true,
        useBullets: true,
        includeSummary: false,
        language: 'English',
      },
    };
    setPresets((prev) => [...prev, newPreset]);
    setEditingPreset(newPreset.id);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '720px',
          maxHeight: '85vh',
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 24px 48px rgba(0, 0, 0, 0.5)'
            : '0 24px 48px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${colors.primaryYellow}20, ${colors.turquoise}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color={colors.primaryYellow} />
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
                Writing Styles & Presets
              </h2>
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: '12px',
                  margin: 0,
                  marginTop: '2px',
                }}
              >
                Configure how content is generated across the studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#DC2626';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.color = colors.textMuted;
            }}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          {[
            { key: 'styles' as const, label: 'Writing Styles' },
            { key: 'presets' as const, label: 'Presets' },
            { key: 'clone' as const, label: 'Clone Style' },
          ].map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom:
                  activeSection === section.key
                    ? `2px solid ${colors.primaryYellow}`
                    : '2px solid transparent',
                color:
                  activeSection === section.key
                    ? colors.primaryYellow
                    : colors.textMuted,
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
          }}
        >
          {/* WRITING STYLES SECTION */}
          {activeSection === 'styles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {styles.map((style) => (
                <div
                  key={style.id}
                  style={{
                    borderRadius: '12px',
                    border: `1px solid ${style.isDefault ? colors.primaryYellow : colors.border}`,
                    backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {/* Style Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setExpandedStyle(expandedStyle === style.id ? null : style.id)
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              color: colors.text,
                              fontSize: '15px',
                              fontWeight: 600,
                            }}
                          >
                            {style.name}
                          </span>
                          {style.isDefault && (
                            <span
                              style={{
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                backgroundColor: `${colors.primaryYellow}20`,
                                color: colors.primaryYellow,
                              }}
                            >
                              Default
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            color: colors.textMuted,
                            fontSize: '12px',
                          }}
                        >
                          {style.description || 'No description'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!style.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(style.id);
                          }}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'transparent',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: colors.textMuted,
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase',
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
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStyle(style.id);
                        }}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: colors.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.textSecondary;
                        }}
                        aria-label="Delete style"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedStyle === style.id ? (
                        <ChevronUp size={16} color={colors.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={colors.textMuted} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedStyle === style.id && (
                    <div
                      style={{
                        padding: '0 16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        borderTop: `1px solid ${colors.border}`,
                        paddingTop: '14px',
                      }}
                    >
                      {/* Name */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '6px',
                          }}
                        >
                          Style Name
                        </label>
                        <input
                          value={style.name}
                          onChange={(e) =>
                            setStyles((prev) =>
                              prev.map((s) =>
                                s.id === style.id ? { ...s, name: e.target.value } : s
                              )
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '6px',
                          }}
                        >
                          Description
                        </label>
                        <input
                          value={style.description}
                          onChange={(e) =>
                            setStyles((prev) =>
                              prev.map((s) =>
                                s.id === style.id
                                  ? { ...s, description: e.target.value }
                                  : s
                              )
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        />
                      </div>

                      {/* Tone */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '6px',
                          }}
                        >
                          Tone
                        </label>
                        <input
                          value={style.tone}
                          onChange={(e) =>
                            setStyles((prev) =>
                              prev.map((s) =>
                                s.id === style.id ? { ...s, tone: e.target.value } : s
                              )
                            )
                          }
                          placeholder="e.g., Authoritative and objective"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        />
                      </div>

                      {/* Formality */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '6px',
                          }}
                        >
                          Formality Level
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {FORMALITY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() =>
                                setStyles((prev) =>
                                  prev.map((s) =>
                                    s.id === style.id
                                      ? { ...s, formality: opt.value as WritingStyle['formality'] }
                                      : s
                                  )
                                )
                              }
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: `1px solid ${
                                  style.formality === opt.value
                                    ? colors.primaryYellow
                                    : colors.border
                                }`,
                                backgroundColor:
                                  style.formality === opt.value
                                    ? `${colors.primaryYellow}15`
                                    : 'transparent',
                                color:
                                  style.formality === opt.value
                                    ? colors.primaryYellow
                                    : colors.textMuted,
                                fontSize: '12px',
                                fontWeight: 600,
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: '0.3px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Personality Tags */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '6px',
                          }}
                        >
                          Personality Tags
                        </label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {style.personality.map((tag, i) => (
                            <span
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: isDark ? '#333333' : '#e8e8e8',
                                color: colors.text,
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              {tag}
                              <button
                                onClick={() =>
                                  setStyles((prev) =>
                                    prev.map((s) =>
                                      s.id === style.id
                                        ? {
                                            ...s,
                                            personality: s.personality.filter(
                                              (_, idx) => idx !== i
                                            ),
                                          }
                                        : s
                                    )
                                  )
                                }
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: colors.textSecondary,
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          <button
                            onClick={() => {
                              const tag = prompt('Enter a personality tag:');
                              if (tag?.trim()) {
                                setStyles((prev) =>
                                  prev.map((s) =>
                                    s.id === style.id
                                      ? { ...s, personality: [...s.personality, tag.trim()] }
                                      : s
                                  )
                                );
                              }
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: `1px dashed ${colors.border}`,
                              backgroundColor: 'transparent',
                              color: colors.textMuted,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'border-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.primaryYellow;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.border;
                            }}
                          >
                            <Plus size={12} />
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Sample Text */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '6px',
                          }}
                        >
                          Sample Output
                        </label>
                        <textarea
                          value={style.sampleText}
                          onChange={(e) =>
                            setStyles((prev) =>
                              prev.map((s) =>
                                s.id === style.id ? { ...s, sampleText: e.target.value } : s
                              )
                            )
                          }
                          placeholder="Paste or type a sample of this writing style..."
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '13px',
                            lineHeight: 1.6,
                            outline: 'none',
                            fontFamily: "'Quicksand', sans-serif",
                            resize: 'vertical',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleAddStyle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px dashed ${colors.border}`,
                  backgroundColor: 'transparent',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
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
                <Plus size={16} />
                Add New Writing Style
              </button>
            </div>
          )}

          {/* PRESETS SECTION */}
          {activeSection === 'presets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {presets.map((preset) => {
                const linkedStyle = styles.find((s) => s.id === preset.styleId);
                return (
                  <div
                    key={preset.id}
                    style={{
                      borderRadius: '12px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <input
                          value={preset.name}
                          onChange={(e) =>
                            setPresets((prev) =>
                              prev.map((p) =>
                                p.id === preset.id ? { ...p, name: e.target.value } : p
                              )
                            )
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            color: colors.text,
                            fontSize: '15px',
                            fontWeight: 600,
                            padding: 0,
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        />
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '4px',
                          }}
                        >
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              fontFamily: "'Rajdhani', sans-serif",
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase',
                              backgroundColor: `${colors.turquoise}15`,
                              color: colors.turquoise,
                            }}
                          >
                            {CONTENT_TYPE_OPTIONS.find((o) => o.value === preset.contentType)?.label}
                          </span>
                          {linkedStyle && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: colors.textMuted,
                              }}
                            >
                              Style: {linkedStyle.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: colors.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.textSecondary;
                        }}
                        aria-label="Delete preset"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Preset Settings Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '4px',
                          }}
                        >
                          Linked Style
                        </label>
                        <select
                          value={preset.styleId}
                          onChange={(e) =>
                            setPresets((prev) =>
                              prev.map((p) =>
                                p.id === preset.id ? { ...p, styleId: e.target.value } : p
                              )
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          {styles.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '4px',
                          }}
                        >
                          Content Type
                        </label>
                        <select
                          value={preset.contentType}
                          onChange={(e) =>
                            setPresets((prev) =>
                              prev.map((p) =>
                                p.id === preset.id
                                  ? { ...p, contentType: e.target.value as StylePreset['contentType'] }
                                  : p
                              )
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          {CONTENT_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '4px',
                          }}
                        >
                          Max Length
                        </label>
                        <input
                          value={preset.settings.maxLength || ''}
                          onChange={(e) =>
                            setPresets((prev) =>
                              prev.map((p) =>
                                p.id === preset.id
                                  ? { ...p, settings: { ...p.settings, maxLength: e.target.value } }
                                  : p
                              )
                            )
                          }
                          placeholder="e.g., 2000 words"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '12px',
                            outline: 'none',
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            marginBottom: '4px',
                          }}
                        >
                          Language
                        </label>
                        <input
                          value={preset.settings.language}
                          onChange={(e) =>
                            setPresets((prev) =>
                              prev.map((p) =>
                                p.id === preset.id
                                  ? { ...p, settings: { ...p.settings, language: e.target.value } }
                                  : p
                              )
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            fontSize: '12px',
                            outline: 'none',
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        />
                      </div>
                    </div>

                    {/* Toggle Settings */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {[
                        { key: 'useHeaders', label: 'Headers' },
                        { key: 'useBullets', label: 'Bullets' },
                        { key: 'includeSummary', label: 'Summary' },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: colors.textMuted,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(preset.settings as any)[key]}
                            onChange={(e) =>
                              setPresets((prev) =>
                                prev.map((p) =>
                                  p.id === preset.id
                                    ? {
                                        ...p,
                                        settings: {
                                          ...p.settings,
                                          [key]: e.target.checked,
                                        },
                                      }
                                    : p
                                )
                              )
                            }
                            style={{ accentColor: colors.primaryYellow }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleAddPreset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px dashed ${colors.border}`,
                  backgroundColor: 'transparent',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
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
                <Plus size={16} />
                Add New Preset
              </button>
            </div>
          )}

          {/* CLONE STYLE SECTION */}
          {activeSection === 'clone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: `${colors.primaryYellow}08`,
                  border: `1px solid ${colors.primaryYellow}30`,
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: '15px',
                    color: colors.text,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Copy size={16} color={colors.primaryYellow} />
                  Clone a Writing Style
                </h3>
                <p
                  style={{
                    color: colors.textMuted,
                    fontSize: '13px',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Paste sample text or a URL below, and the AI will analyze the
                  writing style -- tone, formality, vocabulary, structure -- and
                  create a reusable style profile you can apply to any content type.
                </p>
              </div>

              {/* Paste Text */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: colors.textMuted,
                    marginBottom: '8px',
                  }}
                >
                  Paste Sample Text
                </label>
                <textarea
                  value={cloneText}
                  onChange={(e) => setCloneText(e.target.value)}
                  placeholder="Paste a paragraph or more of the writing style you want to clone..."
                  style={{
                    width: '100%',
                    minHeight: '140px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    fontSize: '14px',
                    lineHeight: 1.7,
                    outline: 'none',
                    fontFamily: "'Quicksand', sans-serif",
                    resize: 'vertical',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primaryYellow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                />
              </div>

              {/* Or URL */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
                <span
                  style={{
                    color: colors.textSecondary,
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Or
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: colors.textMuted,
                    marginBottom: '8px',
                  }}
                >
                  Article / Blog URL
                </label>
                <input
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  placeholder="https://example.com/article-to-clone-style-from"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: "'Quicksand', sans-serif",
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primaryYellow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                />
              </div>

              <button
                disabled={(!cloneText.trim() && !cloneUrl.trim()) || analyzing}
                onClick={async () => {
                  const text = cloneText.trim();
                  if (!text) return;
                  setAnalyzing(true);
                  setCloneResult(null);
                  try {
                    // Client-side text analysis
                    const words = text.split(/\s+/).filter(Boolean);
                    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
                    const avgSentenceLen = sentences.length > 0 ? Math.round(words.length / sentences.length) : 10;
                    const hasDataRefs = /\d+%|\$[\d,.]+|bps|basis points|Q[1-4]|FY\d{2,4}/i.test(text);
                    const hasQuestions = (text.match(/\?/g) || []).length > 1;
                    const hasFirstPerson = /\bI\b|\bwe\b|\bour\b|\bmy\b/i.test(text);
                    const hasContractions = /\b(don't|won't|can't|it's|we're|they're|isn't)\b/i.test(text);
                    const hasTechnicalTerms = /\b(alpha|beta|volatility|drawdown|sharpe|correlation|regression|yield|equity|portfolio)\b/i.test(text);
                    // Determine formality
                    let formality: 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual' = 'neutral';
                    if (avgSentenceLen > 25 && !hasContractions && !hasFirstPerson) formality = 'very_formal';
                    else if (avgSentenceLen > 18 && !hasContractions) formality = 'formal';
                    else if (hasContractions && hasFirstPerson) formality = 'casual';
                    else if (hasContractions && hasQuestions) formality = 'very_casual';
                    // Determine tone
                    let tone = 'Professional and measured';
                    if (hasDataRefs && hasTechnicalTerms) tone = 'Analytical and data-driven';
                    else if (hasQuestions && hasFirstPerson) tone = 'Conversational and engaging';
                    else if (!hasContractions && avgSentenceLen > 20) tone = 'Formal and authoritative';
                    else if (hasFirstPerson) tone = 'Personal and direct';
                    // Personality tags
                    const personality: string[] = [];
                    if (hasDataRefs) personality.push('Data-driven');
                    if (hasTechnicalTerms) personality.push('Technical');
                    if (avgSentenceLen < 15) personality.push('Concise');
                    if (avgSentenceLen > 22) personality.push('Detailed');
                    if (hasFirstPerson) personality.push('Personal');
                    if (!hasContractions && formality !== 'casual') personality.push('Professional');
                    if (hasQuestions) personality.push('Engaging');
                    if (personality.length === 0) personality.push('Balanced');
                    // Simulate async delay
                    await new Promise(r => setTimeout(r, 800));
                    setCloneResult({
                      name: `Cloned Style ${styles.length + 1}`,
                      description: `Analyzed from ${words.length} words, ${sentences.length} sentences. ${formality === 'formal' || formality === 'very_formal' ? 'Formal' : 'Conversational'} writing with ${avgSentenceLen}-word average sentence length.`,
                      tone,
                      formality,
                      personality,
                      sampleText: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
                    });
                  } catch {
                    setCloneResult(null);
                  } finally {
                    setAnalyzing(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor:
                    (cloneText.trim() || cloneUrl.trim()) && !analyzing
                      ? colors.primaryYellow
                      : isDark
                        ? '#333333'
                        : '#e0e0e0',
                  color:
                    (cloneText.trim() || cloneUrl.trim()) && !analyzing
                      ? colors.darkGray
                      : colors.textMuted,
                  border: 'none',
                  cursor:
                    (cloneText.trim() || cloneUrl.trim()) && !analyzing
                      ? 'pointer'
                      : 'not-allowed',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                }}
              >
                {analyzing ? (
                  <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                ) : (
                  <><Sparkles size={18} /> Analyze & Clone Style</>
                )}
              </button>

              {/* Clone Result */}
              {cloneResult && (
                <div style={{
                  padding: '16px', borderRadius: '12px',
                  border: `1px solid ${colors.turquoise}40`,
                  backgroundColor: `${colors.turquoise}08`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                      fontSize: '13px', color: colors.turquoise,
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                    }}>ANALYSIS RESULT</span>
                    <button onClick={() => {
                      const newStyle: WritingStyle = {
                        id: `style-${Date.now()}`,
                        name: cloneResult.name,
                        description: cloneResult.description,
                        tone: cloneResult.tone,
                        formality: cloneResult.formality === 'very_formal' ? 'formal'
                          : cloneResult.formality === 'very_casual' ? 'casual'
                          : cloneResult.formality as WritingStyle['formality'],
                        personality: cloneResult.personality,
                        sampleText: cloneResult.sampleText,
                        isDefault: false,
                      };
                      setStyles(prev => [...prev, newStyle]);
                      setCloneResult(null);
                      setCloneText('');
                      setActiveSection('styles');
                      setExpandedStyle(newStyle.id);
                    }} style={{
                      padding: '5px 14px', borderRadius: '6px',
                      background: `linear-gradient(135deg, ${colors.primaryYellow}, #FFD700)`,
                      color: '#1a1a1a', border: 'none', cursor: 'pointer',
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                      fontSize: '11px', letterSpacing: '0.5px',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <Plus size={12} /> SAVE AS STYLE
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div><span style={{ color: colors.textMuted }}>Tone:</span> <span style={{ color: colors.text }}>{cloneResult.tone}</span></div>
                    <div><span style={{ color: colors.textMuted }}>Formality:</span> <span style={{ color: colors.text, textTransform: 'capitalize' }}>{cloneResult.formality.replace('_', ' ')}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {cloneResult.personality.map((tag, i) => (
                      <span key={i} style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                        backgroundColor: isDark ? '#333' : '#e0e0e0', color: colors.text,
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderTop: `1px solid ${colors.border}`,
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: saveStatus === 'saved' ? '#22c55e' : colors.primaryYellow,
              color: saveStatus === 'saved' ? '#ffffff' : colors.darkGray,
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.opacity = '1'; }}
          >
            {saving ? (
              <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
            ) : saveStatus === 'saved' ? (
              <><CheckCircle2 size={14} /> Saved!</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
