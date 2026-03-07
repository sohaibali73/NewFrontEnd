'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Terminal, Database, DollarSign, Globe, Code2, Shield, Bug, BookOpen, Wand2, Zap, FileText, Presentation, Search, TrendingUp, BarChart3, FlameKindling } from 'lucide-react';

const toolMeta: Record<string, { icon: React.ReactNode; label: string; color: string; estimatedSeconds?: number }> = {
  execute_python:       { icon: <Terminal size={16} />,     label: 'Executing Python code',       color: '#22c55e' },
  search_knowledge_base:{ icon: <Database size={16} />,     label: 'Searching knowledge base',    color: '#3b82f6' },
  get_stock_data:       { icon: <DollarSign size={16} />,   label: 'Fetching stock data',         color: '#FEC00F' },
  get_stock_chart:      { icon: <DollarSign size={16} />,   label: 'Loading stock chart',         color: '#FEC00F' },
  technical_analysis:   { icon: <TrendingUp size={16} />,   label: 'Running technical analysis',  color: '#818cf8' },
  get_weather:          { icon: <Globe size={16} />,        label: 'Getting weather data',        color: '#38bdf8' },
  get_news:             { icon: <Globe size={16} />,        label: 'Fetching news headlines',     color: '#f97316' },
  create_chart:         { icon: <BarChart3 size={16} />,    label: 'Creating data chart',         color: '#a78bfa' },
  code_sandbox:         { icon: <Code2 size={16} />,        label: 'Running code sandbox',        color: '#22c55e' },
  web_search:           { icon: <Search size={16} />,       label: 'Searching the web',           color: '#7c3aed' },
  validate_afl:         { icon: <Shield size={16} />,       label: 'Validating AFL code',         color: '#22c55e' },
  generate_afl_code:    { icon: <Wand2 size={16} />,        label: 'Generating AFL code',         color: '#FEC00F' },
  debug_afl_code:       { icon: <Bug size={16} />,          label: 'Debugging AFL code',          color: '#818cf8' },
  explain_afl_code:     { icon: <BookOpen size={16} />,     label: 'Explaining AFL code',         color: '#3b82f6' },
  sanity_check_afl:     { icon: <Shield size={16} />,       label: 'Running AFL sanity check',    color: '#22c55e' },
  get_live_scores:      { icon: <Zap size={16} />,          label: 'Fetching live scores',        color: '#f97316' },
  get_search_trends:    { icon: <Globe size={16} />,        label: 'Loading search trends',       color: '#7c3aed' },
  create_linkedin_post: { icon: <Globe size={16} />,        label: 'Creating LinkedIn post',      color: '#0077B5' },
  preview_website:      { icon: <Globe size={16} />,        label: 'Generating website preview',  color: '#3b82f6' },
  order_food:           { icon: <Zap size={16} />,          label: 'Finding food options',        color: '#FEC00F' },
  track_flight:         { icon: <Globe size={16} />,        label: 'Tracking flight',             color: '#3b82f6' },
  search_flights:       { icon: <Globe size={16} />,        label: 'Searching for flights',       color: '#FEC00F' },
  // Document & Presentation tools — these take longer
  create_word_document: { icon: <FileText size={16} />,     label: 'Generating Word document',    color: '#3b82f6', estimatedSeconds: 45 },
  create_pptx_with_skill:{ icon: <Presentation size={16} />,label: 'Generating PowerPoint',       color: '#FEC00F', estimatedSeconds: 60 },
  invoke_skill:         { icon: <FlameKindling size={16} />,label: 'Running skill',               color: '#FEC00F', estimatedSeconds: 30 },
  // Research & analysis skills
  run_financial_deep_research: { icon: <TrendingUp size={16} />, label: 'Deep financial research', color: '#818cf8', estimatedSeconds: 120 },
  run_backtest_analysis: { icon: <BarChart3 size={16} />,   label: 'Backtest analysis',           color: '#22c55e', estimatedSeconds: 60 },
  run_quant_analysis:   { icon: <BarChart3 size={16} />,    label: 'Quant analysis',              color: '#a78bfa', estimatedSeconds: 90 },
  run_bubble_detection: { icon: <TrendingUp size={16} />,   label: 'Bubble detection analysis',   color: '#ef4444', estimatedSeconds: 60 },
  generate_afl_with_skill: { icon: <Wand2 size={16} />,    label: 'Expert AFL generation',       color: '#FEC00F', estimatedSeconds: 45 },
  // EDGAR tools
  edgar_get_security_id: { icon: <Database size={16} />,    label: 'Looking up SEC identifier',   color: '#3b82f6' },
  edgar_get_filings:    { icon: <Database size={16} />,     label: 'Fetching SEC filings',        color: '#3b82f6' },
  edgar_get_financials: { icon: <DollarSign size={16} />,   label: 'Fetching SEC financials',     color: '#3b82f6' },
  edgar_search_fulltext:{ icon: <Search size={16} />,       label: 'Searching SEC filings',       color: '#3b82f6' },
};

interface ToolLoadingProps {
  toolName: string;
  input?: Record<string, any>;
}

export function ToolLoading({ toolName, input }: ToolLoadingProps) {
  const meta = toolMeta[toolName] || { icon: <Zap size={16} />, label: `Running ${toolName.replace(/_/g, ' ')}`, color: '#FEC00F' };
  const [elapsed, setElapsed] = useState(0);

  // Timer that counts up
  useEffect(() => {
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const estimatedSeconds = (meta as any).estimatedSeconds || 10;
  const progress = Math.min(elapsed / estimatedSeconds, 0.95); // Cap at 95%
  const isLongRunning = estimatedSeconds >= 30;

  // Format elapsed time
  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  // Extract display info from input
  let inputDisplay = '';
  if (input) {
    if (input.title) inputDisplay = input.title;
    else if (input.symbol) inputDisplay = input.symbol;
    else if (input.query) inputDisplay = input.query.slice(0, 40);
    else if (input.description) inputDisplay = input.description.slice(0, 40);
    else if (input.topic) inputDisplay = input.topic.slice(0, 40);
    else if (input.skill_slug) inputDisplay = input.skill_slug.replace(/-/g, ' ');
    else if (input.message) inputDisplay = input.message.slice(0, 40);
  }

  return (
    <div
      className="tool-loading-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '16px 20px',
        borderRadius: '14px',
        backgroundColor: `${meta.color}08`,
        border: `1px solid ${meta.color}25`,
        maxWidth: '520px',
        marginTop: '8px',
      }}
    >
      {/* Shimmer progress bar at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '3px',
        width: `${progress * 100}%`,
        background: `linear-gradient(90deg, ${meta.color}40, ${meta.color}, ${meta.color}40)`,
        backgroundSize: '200% 100%',
        animation: 'shimmerBar 1.5s ease-in-out infinite',
        transition: 'width 1s ease-out',
        borderRadius: '0 2px 2px 0',
      }} />

      {/* Main content row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Animated icon with pulse ring */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: `${meta.color}15`,
          color: meta.color,
          flexShrink: 0,
        }}>
          {meta.icon}
          {/* Pulse ring animation */}
          <div style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '12px',
            border: `2px solid ${meta.color}30`,
            animation: 'pulseRing 2s ease-out infinite',
          }} />
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: meta.color,
              letterSpacing: '0.01em',
            }}>
              {meta.label}
            </span>
            <Loader2
              size={13}
              color={meta.color}
              style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
            />
          </div>

          {/* Input preview */}
          {inputDisplay && (
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.35)',
              marginTop: '3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {inputDisplay}{inputDisplay.length >= 40 ? '...' : ''}
            </div>
          )}
        </div>

        {/* Timer */}
        <div style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          textAlign: 'right',
        }}>
          {formatTime(elapsed)}
          {isLongRunning && elapsed < estimatedSeconds && (
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '1px' }}>
              ~{formatTime(estimatedSeconds - elapsed)} left
            </div>
          )}
        </div>
      </div>

      {/* Long-running tool message */}
      {isLongRunning && elapsed > 5 && elapsed < estimatedSeconds && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ fontSize: '13px' }}>&#9881;</span>
          {toolName.includes('document') || toolName.includes('docx')
            ? 'Generating your document with professional formatting...'
            : toolName.includes('pptx') || toolName.includes('presentation')
            ? 'Building slides with Potomac branding...'
            : toolName.includes('research')
            ? 'Running deep analysis — this takes 1-2 minutes...'
            : 'Processing — this may take a moment...'}
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes shimmerBar {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ToolLoading;
