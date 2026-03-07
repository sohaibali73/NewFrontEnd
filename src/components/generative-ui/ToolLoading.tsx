'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Terminal, Database, DollarSign, Globe, Code2, Shield, Bug, BookOpen, Wand2, Zap, FileText, Presentation, Search, TrendingUp, BarChart3, FlameKindling, CheckCircle2 } from 'lucide-react';

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
  create_presentation:  { icon: <Presentation size={16} />, label: 'Creating presentation',       color: '#FEC00F', estimatedSeconds: 60 },
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

// Realistic progress steps for different tool types
type ProgressStage = { threshold: number; message: string; speed: number };

function getProgressStages(toolName: string): ProgressStage[] {
  const isDocument = toolName.includes('document') || toolName.includes('docx') || toolName.includes('word');
  const isPptx = toolName.includes('pptx') || toolName.includes('presentation') || toolName.includes('powerpoint');
  const isResearch = toolName.includes('research') || toolName.includes('analysis') || toolName.includes('quant') || toolName.includes('bubble') || toolName.includes('backtest');
  const isSearch = toolName.includes('search') || toolName.includes('web');
  const isAfl = toolName.includes('afl');

  if (isDocument) {
    return [
      { threshold: 0, message: 'Initializing document engine...', speed: 3 },
      { threshold: 8, message: 'Analyzing content structure...', speed: 2.5 },
      { threshold: 18, message: 'Generating document sections...', speed: 1.5 },
      { threshold: 35, message: 'Applying professional formatting...', speed: 1.2 },
      { threshold: 50, message: 'Building table of contents...', speed: 1 },
      { threshold: 65, message: 'Formatting headers and styles...', speed: 0.8 },
      { threshold: 78, message: 'Embedding images and charts...', speed: 0.5 },
      { threshold: 88, message: 'Running final quality checks...', speed: 0.3 },
      { threshold: 95, message: 'Packaging document...', speed: 0.1 },
    ];
  }
  if (isPptx) {
    return [
      { threshold: 0, message: 'Initializing presentation engine...', speed: 3 },
      { threshold: 6, message: 'Loading Potomac brand template...', speed: 2 },
      { threshold: 14, message: 'Analyzing content for slides...', speed: 1.8 },
      { threshold: 25, message: 'Generating slide layouts...', speed: 1.5 },
      { threshold: 38, message: 'Creating title and section slides...', speed: 1.2 },
      { threshold: 50, message: 'Building content slides...', speed: 1 },
      { threshold: 62, message: 'Rendering charts and diagrams...', speed: 0.8 },
      { threshold: 74, message: 'Applying transitions and styling...', speed: 0.6 },
      { threshold: 85, message: 'Adding speaker notes...', speed: 0.4 },
      { threshold: 92, message: 'Final review and packaging...', speed: 0.2 },
      { threshold: 96, message: 'Almost done...', speed: 0.1 },
    ];
  }
  if (isResearch) {
    return [
      { threshold: 0, message: 'Starting research pipeline...', speed: 2.5 },
      { threshold: 8, message: 'Gathering data sources...', speed: 2 },
      { threshold: 18, message: 'Analyzing financial data...', speed: 1.5 },
      { threshold: 30, message: 'Cross-referencing market indicators...', speed: 1 },
      { threshold: 45, message: 'Running quantitative models...', speed: 0.8 },
      { threshold: 58, message: 'Evaluating risk factors...', speed: 0.7 },
      { threshold: 70, message: 'Generating insights...', speed: 0.5 },
      { threshold: 82, message: 'Compiling research report...', speed: 0.3 },
      { threshold: 92, message: 'Finalizing analysis...', speed: 0.15 },
    ];
  }
  if (isSearch) {
    return [
      { threshold: 0, message: 'Sending search query...', speed: 4 },
      { threshold: 20, message: 'Scanning web results...', speed: 3 },
      { threshold: 45, message: 'Analyzing relevance...', speed: 2 },
      { threshold: 70, message: 'Extracting key information...', speed: 1.5 },
      { threshold: 90, message: 'Formatting results...', speed: 0.5 },
    ];
  }
  if (isAfl) {
    return [
      { threshold: 0, message: 'Analyzing AFL requirements...', speed: 3 },
      { threshold: 15, message: 'Generating AFL code structure...', speed: 2 },
      { threshold: 35, message: 'Implementing trading logic...', speed: 1.5 },
      { threshold: 55, message: 'Adding safety checks...', speed: 1.2 },
      { threshold: 75, message: 'Validating syntax...', speed: 0.8 },
      { threshold: 90, message: 'Finalizing code...', speed: 0.3 },
    ];
  }
  // Default stages for generic tools
  return [
    { threshold: 0, message: 'Initializing...', speed: 4 },
    { threshold: 15, message: 'Processing request...', speed: 3 },
    { threshold: 35, message: 'Analyzing data...', speed: 2 },
    { threshold: 60, message: 'Generating output...', speed: 1 },
    { threshold: 85, message: 'Finalizing...', speed: 0.4 },
  ];
}

interface ToolLoadingProps {
  toolName: string;
  input?: Record<string, any>;
}

export function ToolLoading({ toolName, input }: ToolLoadingProps) {
  const meta = toolMeta[toolName] || { icon: <Zap size={16} />, label: `Running ${toolName.replace(/_/g, ' ')}`, color: '#FEC00F' };
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stagesCompleted, setStagesCompleted] = useState(0);

  const stages = useMemo(() => getProgressStages(toolName), [toolName]);
  const estimatedSeconds = (meta as any).estimatedSeconds || 10;
  const isLongRunning = estimatedSeconds >= 30;

  // Get current stage message based on progress
  const currentStage = useMemo(() => {
    let current = stages[0];
    for (let i = stages.length - 1; i >= 0; i--) {
      if (progress >= stages[i].threshold) {
        current = stages[i];
        break;
      }
    }
    return current;
  }, [progress, stages]);

  // Count completed stages
  useEffect(() => {
    let completed = 0;
    for (const stage of stages) {
      if (progress >= stage.threshold) completed++;
    }
    setStagesCompleted(completed);
  }, [progress, stages]);

  // Realistic non-linear progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(s => s + 1);
      setProgress(prev => {
        // Find current speed based on which stage we're in
        let speed = 1;
        for (let i = stages.length - 1; i >= 0; i--) {
          if (prev >= stages[i].threshold) {
            speed = stages[i].speed;
            break;
          }
        }
        // Add small random variation for realism (±30%)
        const variation = 0.7 + Math.random() * 0.6;
        const increment = speed * variation * 0.5; // Half-second increments
        const next = prev + increment;
        // Cap at 97% — never reaches 100% until tool actually finishes
        return Math.min(next, 97);
      });
    }, 500);
    return () => clearInterval(interval);
  }, [stages]);

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
    else if (input.query) inputDisplay = input.query.slice(0, 50);
    else if (input.description) inputDisplay = input.description.slice(0, 50);
    else if (input.topic) inputDisplay = input.topic.slice(0, 50);
    else if (input.skill_slug) inputDisplay = input.skill_slug.replace(/-/g, ' ');
    else if (input.message) inputDisplay = input.message.slice(0, 50);
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
        maxWidth: '560px',
        marginTop: '8px',
      }}
    >
      {/* Main progress bar at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: `${meta.color}10`,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${meta.color}60, ${meta.color}, ${meta.color}60)`,
          backgroundSize: '200% 100%',
          animation: 'shimmerBar 1.5s ease-in-out infinite',
          transition: 'width 0.5s ease-out',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Main content row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Animated icon with pulse ring */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
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
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {inputDisplay}{inputDisplay.length >= 50 ? '...' : ''}
            </div>
          )}
        </div>

        {/* Progress percentage + Timer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            color: meta.color,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.round(progress)}%
          </span>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.3)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Progress stages section */}
      <div style={{ marginTop: '12px' }}>
        {/* Current status message with animated dots */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}>
          <div style={{
            display: 'flex',
            gap: '3px',
            alignItems: 'center',
          }}>
            <span className="progress-dot" style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: meta.color,
              animation: 'dotBounce 1.4s ease-in-out infinite',
              animationDelay: '0s',
            }} />
            <span className="progress-dot" style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: meta.color,
              animation: 'dotBounce 1.4s ease-in-out infinite',
              animationDelay: '0.2s',
            }} />
            <span className="progress-dot" style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: meta.color,
              animation: 'dotBounce 1.4s ease-in-out infinite',
              animationDelay: '0.4s',
            }} />
          </div>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
            transition: 'all 0.3s ease',
          }}>
            {currentStage.message}
          </span>
        </div>

        {/* Visual progress bar */}
        <div style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          backgroundColor: `${meta.color}10`,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: '3px',
            background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
            transition: 'width 0.5s ease-out',
            position: 'relative',
          }}>
            {/* Animated shimmer on progress bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
              animation: 'progressShimmer 2s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* Stage indicators for long-running tasks */}
        {isLongRunning && stages.length > 3 && (
          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '8px',
            flexWrap: 'wrap',
          }}>
            {stages.slice(0, -1).map((stage, idx) => {
              const isCompleted = progress >= (stages[idx + 1]?.threshold || 100);
              const isCurrent = progress >= stage.threshold && !isCompleted;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isCompleted
                      ? `${meta.color}20`
                      : isCurrent
                      ? `${meta.color}10`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      isCompleted
                        ? `${meta.color}40`
                        : isCurrent
                        ? `${meta.color}25`
                        : 'rgba(255,255,255,0.05)'
                    }`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={9} color={meta.color} />
                  ) : isCurrent ? (
                    <Loader2 size={9} color={meta.color} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <div style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }} />
                  )}
                  <span style={{
                    fontSize: '9px',
                    color: isCompleted
                      ? meta.color
                      : isCurrent
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(255,255,255,0.2)',
                    fontWeight: isCurrent ? 600 : 400,
                    whiteSpace: 'nowrap',
                    maxWidth: '90px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {stage.message.replace('...', '')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Estimated time remaining for long-running tasks */}
        {isLongRunning && progress < 95 && elapsed > 3 && (
          <div style={{
            marginTop: '6px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.25)',
            textAlign: 'right',
          }}>
            {elapsed < estimatedSeconds
              ? `Est. ~${formatTime(Math.max(1, Math.round(estimatedSeconds - elapsed)))} remaining`
              : 'Almost there, finishing up...'}
          </div>
        )}
      </div>

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
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes progressShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export default ToolLoading;
