'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  X, ChevronUp, ChevronDown, Loader2, CheckCircle2,
  AlertCircle, Minimize2, Maximize2, Presentation,
  FileText, BarChart3, Code, Sparkles,
} from 'lucide-react';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type ProcessStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ProcessType = 'slide' | 'document' | 'dashboard' | 'afl' | 'article' | 'general';

export interface BackgroundProcess {
  id: string;
  title: string;
  type: ProcessType;
  status: ProcessStatus;
  progress: number;       // 0-100
  message?: string;       // Current step description
  startedAt: number;
  completedAt?: number;
  error?: string;
  result?: unknown;       // Result data when complete
  onComplete?: (result: unknown) => void;
}

interface ProcessManagerContextType {
  processes: BackgroundProcess[];
  addProcess: (process: Omit<BackgroundProcess, 'id' | 'startedAt'>) => string;
  updateProcess: (id: string, updates: Partial<BackgroundProcess>) => void;
  removeProcess: (id: string) => void;
  clearCompleted: () => void;
  activeCount: number;
}

/* ================================================================== */
/*  Context                                                            */
/* ================================================================== */

const ProcessManagerContext = createContext<ProcessManagerContextType | null>(null);

export function useProcessManager() {
  const ctx = useContext(ProcessManagerContext);
  if (!ctx) throw new Error('useProcessManager must be used within ProcessManagerProvider');
  return ctx;
}

/* ================================================================== */
/*  Provider                                                           */
/* ================================================================== */

export function ProcessManagerProvider({ children }: { children: React.ReactNode }) {
  const [processes, setProcesses] = useState<BackgroundProcess[]>([]);
  const counterRef = useRef(0);

  const addProcess = useCallback((proc: Omit<BackgroundProcess, 'id' | 'startedAt'>) => {
    const id = `proc_${Date.now()}_${++counterRef.current}`;
    const newProc: BackgroundProcess = {
      ...proc,
      id,
      startedAt: Date.now(),
    };
    setProcesses(prev => [newProc, ...prev]);
    return id;
  }, []);

  const updateProcess = useCallback((id: string, updates: Partial<BackgroundProcess>) => {
    setProcesses(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      if (updates.status === 'complete' && !updated.completedAt) {
        updated.completedAt = Date.now();
        if (p.onComplete && updates.result !== undefined) {
          setTimeout(() => p.onComplete?.(updates.result), 0);
        }
      }
      return updated;
    }));
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setProcesses(prev => prev.filter(p => p.status !== 'complete' && p.status !== 'failed'));
  }, []);

  const activeCount = processes.filter(p => p.status === 'pending' || p.status === 'running').length;

  return (
    <ProcessManagerContext.Provider value={{
      processes, addProcess, updateProcess, removeProcess, clearCompleted, activeCount,
    }}>
      {children}
    </ProcessManagerContext.Provider>
  );
}

/* ================================================================== */
/*  Floating Widget                                                    */
/* ================================================================== */

const TYPE_ICONS: Record<ProcessType, React.ElementType> = {
  slide: Presentation,
  document: FileText,
  dashboard: BarChart3,
  afl: Code,
  article: FileText,
  general: Sparkles,
};

export function ProcessManagerWidget() {
  const { processes, removeProcess, clearCompleted, activeCount } = useProcessManager();
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Always show a minimal indicator so users know the widget exists
  if (processes.length === 0) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 9998,
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: '20px',
        backgroundColor: '#141414', border: '1px solid #2a2a2a',
        color: '#555', fontSize: '10px', fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 600, letterSpacing: '0.5px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        opacity: 0.6, transition: 'opacity 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00DED1' }} />
        NO TASKS
      </div>
    );
  }

  const completedCount = processes.filter(p => p.status === 'complete').length;
  const failedCount = processes.filter(p => p.status === 'failed').length;

  // Minimized pill
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9998,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', borderRadius: '24px',
          backgroundColor: '#1a1a1a', border: '1px solid #333',
          color: '#FEC00F', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: '12px', letterSpacing: '0.5px',
        }}
      >
        {activeCount > 0 && (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        )}
        {activeCount > 0 ? `${activeCount} RUNNING` : `${processes.length} TASKS`}
        <Maximize2 size={12} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9998,
      width: expanded ? '380px' : '320px',
      backgroundColor: '#141414', border: '1px solid #2a2a2a',
      borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      transition: 'width 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid #2a2a2a',
        background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeCount > 0 && (
            <Loader2 size={14} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
          )}
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '12px', color: '#FEC00F', letterSpacing: '1px',
          }}>
            PROCESSES {activeCount > 0 ? `(${activeCount} ACTIVE)` : `(${processes.length})`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {completedCount > 0 && (
            <button onClick={clearCompleted} style={{
              padding: '3px 8px', background: 'none', border: '1px solid #333',
              borderRadius: '4px', color: '#666', cursor: 'pointer',
              fontSize: '9px', fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, letterSpacing: '0.5px',
            }}>CLEAR DONE</button>
          )}
          <button onClick={() => setExpanded(!expanded)} style={{
            padding: '3px', background: 'none', border: 'none',
            color: '#666', cursor: 'pointer', display: 'flex',
          }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button onClick={() => setMinimized(true)} style={{
            padding: '3px', background: 'none', border: 'none',
            color: '#666', cursor: 'pointer', display: 'flex',
          }}>
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      {/* Process list */}
      <div style={{
        maxHeight: expanded ? '400px' : '200px',
        overflowY: 'auto', transition: 'max-height 0.2s ease',
      }}>
        {processes.map(proc => {
          const TypeIcon = TYPE_ICONS[proc.type] || Sparkles;
          const isActive = proc.status === 'pending' || proc.status === 'running';
          const isDone = proc.status === 'complete';
          const isFailed = proc.status === 'failed';

          return (
            <div key={proc.id} style={{
              padding: '10px 14px', borderBottom: '1px solid #1e1e1e',
              opacity: isDone ? 0.7 : 1,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '4px',
              }}>
                {isActive ? (
                  <Loader2 size={13} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
                ) : isDone ? (
                  <CheckCircle2 size={13} color="#00DED1" />
                ) : isFailed ? (
                  <AlertCircle size={13} color="#ef4444" />
                ) : (
                  <TypeIcon size={13} color="#666" />
                )}
                <span style={{
                  flex: 1, fontSize: '12px', fontWeight: 600,
                  color: isFailed ? '#ef4444' : '#e0e0e0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: "'Quicksand', sans-serif",
                }}>
                  {proc.title}
                </span>
                {!isActive && (
                  <button onClick={() => removeProcess(proc.id)} style={{
                    padding: '2px', background: 'none', border: 'none',
                    color: '#444', cursor: 'pointer', display: 'flex',
                  }}>
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Progress bar for active processes */}
              {isActive && (
                <>
                  <div style={{
                    height: '3px', borderRadius: '2px', backgroundColor: '#222',
                    overflow: 'hidden', marginBottom: '3px',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${proc.progress}%`,
                      background: 'linear-gradient(90deg, #FEC00F, #FFD700)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  {proc.message && (
                    <span style={{
                      fontSize: '10px', color: '#666',
                      fontFamily: "'Quicksand', sans-serif",
                    }}>
                      {proc.message}
                    </span>
                  )}
                </>
              )}

              {/* Error message for failed */}
              {isFailed && proc.error && (
                <span style={{ fontSize: '10px', color: '#ef4444' }}>
                  {proc.error}
                </span>
              )}

              {/* Elapsed time */}
              {isDone && proc.completedAt && (
                <span style={{ fontSize: '10px', color: '#555' }}>
                  Completed in {Math.round((proc.completedAt - proc.startedAt) / 1000)}s
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
