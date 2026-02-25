'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { Skill } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  afl: { icon: '📊', color: '#6366F1' }, document: { icon: '📄', color: '#10B981' },
  presentation: { icon: '📑', color: '#F59E0B' }, ui: { icon: '🎨', color: '#EC4899' },
  backtest: { icon: '📈', color: '#3B82F6' }, market_analysis: { icon: '🔍', color: '#EF4444' },
  quant: { icon: '🧮', color: '#8B5CF6' }, research: { icon: '🔬', color: '#14B8A6' },
};

interface SkillJob {
  job_id: string; skill_slug: string; skill_name: string; message: string;
  status: string; progress: number; status_message: string;
  has_result?: boolean; error?: string; created_at: number; result?: any;
}

export default function SkillsTab() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [jobs, setJobs] = useState<SkillJob[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const colors = {
    bg: isDark ? '#1E1E1E' : '#f8f8f8', border: isDark ? '#333' : '#e0e0e0',
    text: isDark ? '#fff' : '#212121', textMuted: isDark ? '#9E9E9E' : '#757575',
    accent: '#FEC00F', accentText: '#212121', inputBg: isDark ? '#2A2A2A' : '#fff',
    cardBg: isDark ? '#252525' : '#fff', tagBg: isDark ? '#333' : '#e8e8e8',
  };

  // Load skills
  useEffect(() => {
    apiClient.getSkills().then(r => setSkills(r.skills)).catch(() => {});
  }, []);

  // Load jobs and poll running ones
  const loadJobs = useCallback(async () => {
    try {
      const res = await apiClient.getSkillJobs();
      setJobs(res.jobs);
      // If any job is running, poll again
      const hasRunning = res.jobs.some((j: any) => j.status === 'pending' || j.status === 'running');
      if (hasRunning && !pollRef.current) {
        pollRef.current = setInterval(loadJobs, 3000);
      } else if (!hasRunning && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadJobs();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadJobs]);

  // Submit job
  const handleSubmit = async () => {
    if (!selectedSkill || !prompt.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.submitSkillJob(selectedSkill, prompt);
      setPrompt('');
      // Start polling
      if (!pollRef.current) pollRef.current = setInterval(loadJobs, 3000);
      await loadJobs();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // View result
  const handleViewResult = async (jobId: string) => {
    if (expandedJob === jobId) { setExpandedJob(null); return; }
    try {
      const res = await apiClient.getSkillJob(jobId);
      setExpandedResult(res.result?.text || res.error || 'No result');
      setExpandedJob(jobId);
    } catch { setExpandedResult('Failed to load result'); setExpandedJob(jobId); }
  };

  const statusColor = (s: string) => s === 'complete' ? '#10B981' : s === 'error' ? '#EF4444' : s === 'running' ? '#3B82F6' : '#9E9E9E';
  const statusIcon = (s: string) => s === 'complete' ? '✓' : s === 'error' ? '✕' : s === 'running' ? '⟳' : '⏳';

  const selectedSkillObj = skills.find(s => s.slug === selectedSkill);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Submission Form */}
      <div style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg }}>
        <div style={{ marginBottom: '12px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: colors.text }}>
          ⚡ Run AI Skill (Background)
        </div>
        <p style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '16px' }}>
          Submit a job and navigate away — it runs server-side. Come back to see results.
        </p>

        {/* Skill Selector */}
        <select
          value={selectedSkill}
          onChange={e => setSelectedSkill(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px',
            border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg,
            color: colors.text, fontSize: '14px', fontFamily: "'Quicksand', sans-serif",
          }}
        >
          <option value="">Select a skill…</option>
          {skills.map(s => (
            <option key={s.slug} value={s.slug}>
              {CATEGORY_META[s.category]?.icon || '📦'} {s.name}
            </option>
          ))}
        </select>

        {selectedSkillObj && (
          <div style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '12px', padding: '8px', borderRadius: '6px', backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
            {selectedSkillObj.description}
          </div>
        )}

        {/* Prompt */}
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe what you want the skill to do…"
          rows={4}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`,
            backgroundColor: colors.inputBg, color: colors.text, fontSize: '14px',
            fontFamily: "'Quicksand', sans-serif", resize: 'vertical', boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '8px' }}>⚠️ {error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedSkill || !prompt.trim() || submitting}
          style={{
            marginTop: '12px', padding: '10px 24px', borderRadius: '8px', border: 'none',
            backgroundColor: selectedSkill && prompt.trim() ? colors.accent : colors.tagBg,
            color: selectedSkill && prompt.trim() ? colors.accentText : colors.textMuted,
            fontWeight: 700, fontSize: '13px', cursor: selectedSkill && prompt.trim() ? 'pointer' : 'not-allowed',
            fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px',
          }}
        >
          {submitting ? '⏳ SUBMITTING…' : '▶ SUBMIT JOB'}
        </button>
      </div>

      {/* Jobs List */}
      <div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: colors.text, marginBottom: '12px' }}>
          📋 Skill Jobs ({jobs.length})
        </div>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted, fontSize: '14px' }}>
            No jobs yet. Submit a skill job above to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobs.map(job => (
              <div key={job.job_id} style={{ borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, overflow: 'hidden' }}>
                <div
                  onClick={() => (job.status === 'complete' || job.status === 'error') ? handleViewResult(job.job_id) : undefined}
                  style={{
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: (job.status === 'complete' || job.status === 'error') ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: '16px', color: statusColor(job.status), fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                    {statusIcon(job.status)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{CATEGORY_META[skills.find(s => s.slug === job.skill_slug)?.category || '']?.icon || '⚡'}</span>
                      <span>{job.skill_name}</span>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: `${statusColor(job.status)}20`, color: statusColor(job.status), fontWeight: 700, textTransform: 'uppercase' }}>
                        {job.status}
                      </span>
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: '12px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.message}
                    </div>
                  </div>
                  {(job.status === 'running' || job.status === 'pending') && (
                    <div style={{ minWidth: '80px' }}>
                      <div style={{ height: '4px', borderRadius: '2px', backgroundColor: colors.tagBg, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${job.progress}%`, backgroundColor: '#3B82F6', borderRadius: '2px', transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px', textAlign: 'center' }}>{job.status_message}</div>
                    </div>
                  )}
                  {job.status === 'complete' && (
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>{expandedJob === job.job_id ? '▼' : '▶'} View</span>
                  )}
                </div>

                {/* Expanded Result */}
                {expandedJob === job.job_id && (
                  <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${colors.border}` }}>
                    <div style={{ padding: '12px 0', color: colors.text, fontSize: '14px', lineHeight: 1.7, maxHeight: '400px', overflowY: 'auto' }}>
                      <MarkdownRenderer content={expandedResult} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
