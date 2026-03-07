'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, FileText, Presentation, CheckCircle, Sparkles, Layers, Palette, Type, BarChart3 } from 'lucide-react';
import DocumentDownloadCard, { FileDownloadData } from '@/components/ai-elements/document-download-card';

/**
 * PersistentGenerationCard
 * ========================
 * A non-streaming, localStorage-persisted loading card for PPTX/DOCX generation.
 * Does NOT depend on useChat streaming state. Survives:
 * - Conversation switches
 * - Page navigation
 * - Browser refresh
 * - Tab close and reopen
 *
 * Lifecycle:
 *   1. On mount with status='generating' → saves to localStorage, shows animation
 *   2. Animation cycles through realistic generation steps
 *   3. When `output` prop arrives (tool completed) → saves result to localStorage, shows download card
 *   4. On mount with saved 'complete' status → immediately shows download card
 */

const STORAGE_KEY = 'gen_cards';

interface GenerationJob {
  id: string;
  toolName: string;
  title: string;
  conversationId?: string;
  status: 'generating' | 'complete' | 'failed';
  startedAt: number;
  completedAt?: number;
  output?: FileDownloadData;
  error?: string;
}

// Steps for PPTX generation animation
const PPTX_STEPS = [
  { icon: Sparkles, label: 'Initializing presentation engine...', duration: 3000 },
  { icon: Layers, label: 'Building slide structure...', duration: 8000 },
  { icon: Type, label: 'Generating content for slides...', duration: 15000 },
  { icon: Palette, label: 'Applying design and formatting...', duration: 10000 },
  { icon: BarChart3, label: 'Adding charts and visuals...', duration: 8000 },
  { icon: Presentation, label: 'Compiling PowerPoint file...', duration: 5000 },
  { icon: CheckCircle, label: 'Finalizing presentation...', duration: 3000 },
];

// Steps for DOCX generation animation
const DOCX_STEPS = [
  { icon: Sparkles, label: 'Initializing document engine...', duration: 3000 },
  { icon: Type, label: 'Generating document content...', duration: 12000 },
  { icon: Layers, label: 'Structuring sections and headings...', duration: 8000 },
  { icon: Palette, label: 'Applying formatting and styles...', duration: 6000 },
  { icon: FileText, label: 'Compiling Word document...', duration: 4000 },
  { icon: CheckCircle, label: 'Finalizing document...', duration: 3000 },
];

function getStoredJobs(): Record<string, GenerationJob> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveJob(job: GenerationJob) {
  try {
    const jobs = getStoredJobs();
    jobs[job.id] = job;
    // Prune old completed jobs (older than 24h)
    const cutoff = Date.now() - 86400000;
    for (const [id, j] of Object.entries(jobs)) {
      if (j.status !== 'generating' && (j.completedAt || j.startedAt) < cutoff) {
        delete jobs[id];
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch { /* ignore */ }
}

function getJob(id: string): GenerationJob | null {
  const jobs = getStoredJobs();
  return jobs[id] || null;
}

interface Props {
  toolCallId: string;
  toolName: string;
  input?: any;
  output?: FileDownloadData;
  state?: string; // 'input-available' | 'input-streaming' | 'output-available' | 'output-error'
  errorText?: string;
  conversationId?: string;
}

export default function PersistentGenerationCard({
  toolCallId,
  toolName,
  input,
  output,
  state,
  errorText,
  conversationId,
}: Props) {
  const isPptx = toolName.includes('pptx') || toolName.includes('presentation') || toolName.includes('powerpoint');
  const steps = isPptx ? PPTX_STEPS : DOCX_STEPS;
  const accentColor = isPptx ? '#f59e0b' : '#3b82f6';
  const Icon = isPptx ? Presentation : FileText;
  const typeLabel = isPptx ? 'PowerPoint Presentation' : 'Word Document';

  // Derive a stable job ID
  const jobId = toolCallId || `gen_${toolName}_${Date.now()}`;

  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get title from input
  const title = input?.title || input?.topic || (isPptx ? 'Presentation' : 'Document');

  // Initialize: check localStorage for existing job or create new one
  useEffect(() => {
    const existing = getJob(jobId);

    if (state === 'output-available' && output) {
      // Tool completed — save result
      const completedJob: GenerationJob = {
        id: jobId,
        toolName,
        title,
        conversationId,
        status: 'complete',
        startedAt: existing?.startedAt || Date.now(),
        completedAt: Date.now(),
        output: output as FileDownloadData,
      };
      saveJob(completedJob);
      setJob(completedJob);
      return;
    }

    if (state === 'output-error') {
      const failedJob: GenerationJob = {
        id: jobId,
        toolName,
        title,
        conversationId,
        status: 'failed',
        startedAt: existing?.startedAt || Date.now(),
        completedAt: Date.now(),
        error: errorText || 'Generation failed',
      };
      saveJob(failedJob);
      setJob(failedJob);
      return;
    }

    if (existing && existing.status === 'complete' && existing.output) {
      // Already completed from a previous render
      setJob(existing);
      return;
    }

    if (existing && existing.status === 'failed') {
      setJob(existing);
      return;
    }

    // Active generation — create/update job
    const activeJob: GenerationJob = {
      id: jobId,
      toolName,
      title,
      conversationId,
      status: 'generating',
      startedAt: existing?.startedAt || Date.now(),
    };
    saveJob(activeJob);
    setJob(activeJob);
  }, [jobId, toolName, title, conversationId, state, output, errorText]);

  // Step animation timer
  useEffect(() => {
    if (!job || job.status !== 'generating') return;

    const advanceStep = () => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= steps.length) return steps.length - 1; // Stay on last step
        // Schedule next step
        stepTimerRef.current = setTimeout(advanceStep, steps[next].duration);
        return next;
      });
    };

    // Start from step 0
    stepTimerRef.current = setTimeout(advanceStep, steps[0].duration);

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [job?.status, steps]);

  // Elapsed time counter
  useEffect(() => {
    if (!job || job.status !== 'generating') return;

    elapsedTimerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - job.startedAt) / 1000));
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [job?.status, job?.startedAt]);

  // === RENDER: Completed → show DocumentDownloadCard ===
  if (job?.status === 'complete' && job.output) {
    return <DocumentDownloadCard output={job.output} />;
  }

  // === RENDER: Failed ===
  if (job?.status === 'failed') {
    return (
      <div style={{
        borderRadius: '12px',
        border: '1px solid rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.08)',
        padding: '16px',
        margin: '12px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
          <Icon size={20} />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>{typeLabel} Generation Failed</span>
        </div>
        <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>{job.error}</p>
      </div>
    );
  }

  // === RENDER: Generating → persistent animation ===
  const step = steps[Math.min(currentStep, steps.length - 1)];
  const StepIcon = step.icon;
  const progress = Math.min(95, Math.round((currentStep / steps.length) * 100 + (elapsed / 120) * 5));
  const elapsedStr = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <div style={{
      borderRadius: '14px',
      border: `1px solid ${accentColor}30`,
      background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}04)`,
      padding: '20px',
      margin: '12px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Animated top border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        animation: 'genSlide 2s ease-in-out infinite',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          backgroundColor: `${accentColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={22} color={accentColor} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            fontFamily: "'Quicksand', sans-serif",
          }}>
            {title}
          </h3>
          <p style={{
            margin: '2px 0 0',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            {typeLabel} • Generating
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '18px',
            fontWeight: 800,
            color: accentColor,
            fontFamily: "'Rajdhani', sans-serif",
          }}>
            {progress}%
          </span>
          <p style={{
            margin: '2px 0 0',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
          }}>
            {elapsedStr}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '6px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        marginBottom: '14px',
      }}>
        <div style={{
          height: '100%',
          borderRadius: '3px',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
          transition: 'width 1s ease',
          boxShadow: `0 0 12px ${accentColor}40`,
        }} />
      </div>

      {/* Current step */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '10px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ animation: 'genPulse 1.5s ease-in-out infinite' }}>
          <StepIcon size={16} color={accentColor} />
        </div>
        <span style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          fontFamily: "'Quicksand', sans-serif",
          fontWeight: 500,
        }}>
          {step.label}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Loader2 size={14} color={accentColor} style={{ animation: 'genSpin 1s linear infinite' }} />
        </div>
      </div>

      {/* Step dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '12px',
      }}>
        {steps.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: idx === currentStep ? '18px' : '6px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: idx <= currentStep ? accentColor : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease',
              opacity: idx <= currentStep ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes genSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes genPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        @keyframes genSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
