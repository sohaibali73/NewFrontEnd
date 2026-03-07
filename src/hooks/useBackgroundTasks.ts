'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProcessManager, ProcessType } from '@/contexts/ProcessManager';

/**
 * Background Tasks Hook
 * =====================
 * Polls the backend Tasks API (GET /api/tasks) every 3 seconds when there
 * are active tasks, and syncs task status with the ProcessManager widget.
 * Also provides a submitTask() helper to POST new background tasks.
 */

interface BackendTask {
  id: string;
  user_id: string;
  conversation_id?: string;
  title: string;
  task_type: string;
  status: string;       // pending | running | complete | failed | cancelled
  progress: number;
  message: string;
  result?: Record<string, unknown>;
  error?: string;
  created_at: number;
  started_at?: number;
  completed_at?: number;
  elapsed_seconds: number;
}

interface SubmitTaskParams {
  task_type: string;
  title: string;
  message: string;
  conversation_id?: string;
  skill_slug?: string;
  params?: Record<string, unknown>;
}

function mapTaskType(taskType: string): ProcessType {
  switch (taskType) {
    case 'presentation': return 'slide';
    case 'document': return 'document';
    case 'afl': return 'afl';
    case 'research': return 'article';
    default: return 'general';
  }
}

function mapStatus(status: string): 'pending' | 'running' | 'complete' | 'failed' {
  switch (status) {
    case 'pending': return 'pending';
    case 'running': return 'running';
    case 'complete': return 'complete';
    case 'failed':
    case 'cancelled':
      return 'failed';
    default: return 'running';
  }
}

export function useBackgroundTasks() {
  const { addProcess, updateProcess, processes } = useProcessManager();
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Map backend task IDs to ProcessManager process IDs
  const taskProcessMapRef = useRef<Map<string, string>>(new Map());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAuthToken = useCallback(() => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  }, []);

  // Submit a new background task
  const submitTask = useCallback(async (params: SubmitTaskParams): Promise<{ task_id?: string; error?: string }> => {
    const token = getAuthToken();
    try {
      const resp = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const data = await resp.json();

      if (data.task_id) {
        // Register in ProcessManager
        const processId = addProcess({
          title: params.title,
          type: mapTaskType(params.task_type),
          status: 'running',
          progress: 0,
          message: 'Submitted to background queue...',
        });
        taskProcessMapRef.current.set(data.task_id, processId);
        setIsPolling(true);
      }

      return { task_id: data.task_id, error: data.error };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to submit task' };
    }
  }, [getAuthToken, addProcess]);

  // Poll backend for task updates
  const pollTasks = useCallback(async () => {
    const token = getAuthToken();
    try {
      const resp = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!resp.ok) return;

      const data = await resp.json();
      const tasks: BackendTask[] = data.tasks || [];
      setBackendTasks(tasks);

      // Sync each backend task with ProcessManager
      for (const task of tasks) {
        const processId = taskProcessMapRef.current.get(task.id);

        if (processId) {
          // Update existing process
          updateProcess(processId, {
            status: mapStatus(task.status),
            progress: task.progress,
            message: task.message || '',
            result: task.result as unknown,
            error: task.error,
          });

          // Clean up completed/failed tasks from tracking map
          if (task.status === 'complete' || task.status === 'failed' || task.status === 'cancelled') {
            // Keep in map for a bit so the UI shows completion, then remove
            setTimeout(() => {
              taskProcessMapRef.current.delete(task.id);
            }, 5000);
          }
        } else if (task.status === 'pending' || task.status === 'running') {
          // Backend task not yet tracked — register it
          const processId = addProcess({
            title: task.title,
            type: mapTaskType(task.task_type),
            status: mapStatus(task.status),
            progress: task.progress,
            message: task.message || '',
          });
          taskProcessMapRef.current.set(task.id, processId);
        }
      }

      // Check if we should stop polling
      const hasActive = tasks.some(t => t.status === 'pending' || t.status === 'running');
      if (!hasActive) {
        setIsPolling(false);
      }
    } catch {
      // Silently fail — polling will retry
    }
  }, [getAuthToken, updateProcess, addProcess]);

  // Start/stop polling based on isPolling state
  useEffect(() => {
    if (isPolling) {
      // Poll immediately, then every 3 seconds
      pollTasks();
      pollingRef.current = setInterval(pollTasks, 3000);
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isPolling, pollTasks]);

  // Auto-start polling if there are active processes (e.g., after page navigation)
  useEffect(() => {
    const hasActiveProcesses = processes.some(
      p => p.status === 'pending' || p.status === 'running'
    );
    if (hasActiveProcesses && !isPolling) {
      setIsPolling(true);
    }
  }, [processes, isPolling]);

  // Initial check on mount — see if there are existing tasks in the backend
  useEffect(() => {
    const initialCheck = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const resp = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.active_count > 0) {
          setIsPolling(true);
        }
      } catch { /* ignore */ }
    };
    initialCheck();
  }, [getAuthToken]);

  return {
    submitTask,
    backendTasks,
    isPolling,
    startPolling: () => setIsPolling(true),
  };
}
