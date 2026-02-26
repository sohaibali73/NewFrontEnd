'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface CreationChatModalProps {
  colors: Record<string, string>;
  isDark: boolean;
  contentType: 'slides' | 'articles' | 'documents' | 'dashboards';
  onClose: () => void;
  onCreated: (item: any) => void;
}

interface Msg { id: string; role: 'user' | 'assistant'; content: string; }

const TYPE_CONFIG: Record<string, { label: string; systemPrompt: string; placeholder: string }> = {
  slides: {
    label: 'Slide Deck',
    systemPrompt: 'You are a professional content creator for Potomac Asset Management. Create a detailed slide deck outline with slide titles and bullet points. Format with ## for slide titles and - for bullets.',
    placeholder: 'Describe the slide deck you want to create...',
  },
  articles: {
    label: 'Article',
    systemPrompt: 'You are a professional financial writer for Potomac Asset Management. Write well-structured articles with headers (##), paragraphs, and relevant analysis.',
    placeholder: 'What article topic would you like to write about?',
  },
  documents: {
    label: 'Document',
    systemPrompt: 'You are a professional document creator for Potomac Asset Management. Create formal business documents — reports, memos, briefs — with clear structure.',
    placeholder: 'Describe the document you need...',
  },
  dashboards: {
    label: 'Dashboard',
    systemPrompt: 'You are a dashboard designer for Potomac Asset Management. Describe dashboard layouts with metrics, charts, and data panels.',
    placeholder: 'What kind of dashboard do you need?',
  },
};

export function CreationChatModal({ colors, isDark, contentType, onClose, onCreated }: CreationChatModalProps) {
  const config = TYPE_CONFIG[contentType] || TYPE_CONFIG.slides;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [canSave, setCanSave] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Create a conversation for this modal session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const conv = await apiClient.createConversation(`Content: ${config.label}`, 'agent');
        if (!cancelled) {
          const id = (conv as any).id || (conv as any).conversation_id;
          if (id) setConversationId(id);
        }
      } catch {
        // Backend unavailable — will use fallback
      }
    })();
    return () => { cancelled = true; };
  }, [config.label]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const prompt = input.trim();
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aId = `a-${Date.now() + 1}`;
    setMessages(prev => [...prev, { id: aId, role: 'assistant', content: '' }]);

    let fullText = '';

    // Prepend system context to the user prompt for the first message
    const isFirst = messages.filter(m => m.role === 'user').length === 0;
    const effectivePrompt = isFirst
      ? (() => {
          // Inject writing style from localStorage if available
          let styleInstruction = '';
          try {
            const cached = localStorage.getItem('content_writing_styles');
            if (cached) {
              const styles = JSON.parse(cached);
              const defaultStyle = styles.find((s: any) => s.isDefault) || styles[0];
              if (defaultStyle) {
                styleInstruction = `\n\n[Writing Style: ${defaultStyle.name}. Tone: ${defaultStyle.tone || 'Professional'}. Formality: ${defaultStyle.formality || 'formal'}. ${defaultStyle.personality?.length ? `Traits: ${defaultStyle.personality.join(', ')}.` : ''} Do not use any emojis.]`;
              }
            }
          } catch {}
          return `${config.systemPrompt}${styleInstruction}\n\nUser request: ${prompt}`;
        })()
      : prompt;

    if (conversationId) {
      // ── Real backend streaming ────────────────────────────────
      try {
        await apiClient.sendMessageStream(effectivePrompt, conversationId, {
          onText: (chunk) => {
            fullText += chunk;
            const snap = fullText;
            setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: snap } : m));
          },
          onError: (error) => {
            console.error('[CreationChat] Stream error:', error);
          },
          onFinish: () => {
            setIsLoading(false);
            setCanSave(true);
          },
        });

        if (!fullText.trim()) {
          // Empty response — show a clear error, NOT fake content
          throw new Error('empty');
        }
      } catch (err) {
        // Show clear error instead of silently generating fake content
        if (!fullText.trim()) {
          fullText = '';
          const errorMsg = `⚠️ **Unable to reach the AI backend**\n\nThe backend service is currently unavailable. Please check:\n- Your internet connection\n- That the backend server is running\n- Your API key is configured in Settings\n\nYou can try again in a moment, or use the template below as a starting point:\n\n---\n\n${generateOfflineContent(prompt, contentType)}`;
          const chars = errorMsg.split('');
          for (let i = 0; i < chars.length; i += 4) {
            fullText += chars.slice(i, i + 4).join('');
            const snap = fullText;
            setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: snap } : m));
            await new Promise(r => setTimeout(r, 6));
          }
          setIsLoading(false);
          setCanSave(true); // Still allow saving the template
        }
      }
    } else {
      // ── No conversation created (backend unreachable) — show clear offline indicator
      await new Promise(r => setTimeout(r, 300));
      const offlineMsg = `⚠️ **Offline Mode — Backend Unavailable**\n\nCouldn't connect to the AI service. Here's a template to get you started:\n\n---\n\n${generateOfflineContent(prompt, contentType)}`;
      const chars = offlineMsg.split('');
      for (let i = 0; i < chars.length; i += 4) {
        fullText += chars.slice(i, i + 4).join('');
        const snap = fullText;
        setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: snap } : m));
        await new Promise(r => setTimeout(r, 6));
      }
      setIsLoading(false);
      setCanSave(true);
    }
  }, [input, isLoading, conversationId, messages, config.systemPrompt, contentType]);

  const handleSave = () => {
    const allAssistant = messages.filter(m => m.role === 'assistant' && m.content.trim());
    const fullContent = allAssistant.map(m => m.content).join('\n\n---\n\n');
    const firstUserMsg = messages.find(m => m.role === 'user')?.content || '';

    // Extract a title from the content or first user message
    const titleMatch = fullContent.match(/^##?\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : (firstUserMsg.slice(0, 60) || `New ${config.label}`);

    onCreated({
      title,
      content: fullContent,
      slideCount: contentType === 'slides' ? (fullContent.match(/^##/gm) || []).length || 10 : undefined,
      tags: contentType === 'articles' ? extractTags(fullContent) : undefined,
      type: contentType === 'documents' ? 'AI Generated' : undefined,
    });

    // Clean up conversation
    if (conversationId) {
      apiClient.deleteConversation(conversationId).catch(() => {});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const border = `1px solid ${colors.border}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '680px', maxWidth: '95vw', height: '80vh', maxHeight: '700px', borderRadius: '16px', backgroundColor: colors.cardBg, border, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: border, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color={colors.primaryYellow} />
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '16px', color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>Create {config.label}</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canSave && (
              <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', backgroundColor: colors.primaryYellow, color: colors.darkGray, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px' }}>
                <CheckCircle2 size={14} /> SAVE {config.label.toUpperCase()}
              </button>
            )}
            <button onClick={onClose} style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', borderRadius: '6px' }}><X size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center' }}>
              <Sparkles size={36} color={colors.primaryYellow} style={{ opacity: 0.4 }} />
              <p style={{ color: colors.textMuted, fontSize: '14px', maxWidth: '320px', lineHeight: 1.5 }}>
                Describe the {config.label.toLowerCase()} you want to create. The AI will generate it for you.
              </p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: msg.role === 'user' ? '70%' : '100%',
                padding: msg.role === 'user' ? '10px 14px' : '12px 16px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                backgroundColor: msg.role === 'user' ? '#FEC00F' : 'rgba(255,255,255,0.04)',
                border: msg.role === 'assistant' ? `1px solid rgba(255,255,255,0.08)` : 'none',
                color: msg.role === 'user' ? '#1a1a1a' : colors.text,
                fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
              }}>
                {msg.content || <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', opacity: 0.4 }} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: border, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', backgroundColor: colors.inputBg, borderRadius: '10px', border, padding: '6px 10px' }}>
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={config.placeholder} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: colors.text, fontSize: '13px', fontFamily: "'Quicksand', sans-serif", resize: 'none', minHeight: '40px', maxHeight: '120px', lineHeight: 1.5, padding: '6px 0' }} />
            <button onClick={handleSend} disabled={!input.trim() || isLoading} style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: input.trim() && !isLoading ? colors.primaryYellow : isDark ? '#333' : '#e0e0e0', color: input.trim() && !isLoading ? colors.darkGray : colors.textMuted, border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Utility: extract tags from content ─────────────────────────────────────
function extractTags(content: string): string[] {
  const tags: string[] = [];
  const headings = content.match(/^##?\s+(.+)/gm) || [];
  headings.slice(0, 3).forEach(h => {
    const clean = h.replace(/^#+\s*/, '').trim();
    if (clean.length < 30) tags.push(clean);
  });
  return tags.length > 0 ? tags : ['AI Generated'];
}

// ── Offline content generation (only used when backend is unreachable) ──────
function generateOfflineContent(prompt: string, type: string): string {
  const lower = prompt.toLowerCase();

  if (type === 'slides') {
    return `## Slide Deck: ${prompt}

> Generated offline — connect to backend for AI-powered content

## Slide 1 — Title Slide
- ${prompt}
- Potomac Asset Management
- ${new Date().toLocaleDateString()}

## Slide 2 — Executive Summary
- Key findings and recommendations
- [Content will be generated when connected to backend]

## Slide 3 — Analysis
- Data-driven insights
- Market context and implications

## Slide 4 — Recommendations
- Actionable next steps
- Risk considerations

## Slide 5 — Appendix
- Supporting data
- Methodology notes`;
  }

  if (type === 'articles') {
    return `# ${prompt}

> Generated offline — connect to backend for full AI-powered article

## Introduction
This article explores ${prompt.toLowerCase()}. A comprehensive analysis will be provided when connected to the backend AI.

## Analysis
Key considerations and market dynamics will be explored here.

## Conclusion
Further research and AI-generated insights available when backend is connected.

---
*Potomac Asset Management*`;
  }

  if (type === 'documents') {
    return `# ${prompt}

**Potomac Asset Management**
Date: ${new Date().toLocaleDateString()}

> Generated offline — connect to backend for full AI document generation

## Overview
This document addresses: ${prompt}

## Details
Full content will be generated when connected to the backend AI service.

## Next Steps
- Review requirements
- Connect to backend for AI generation
- Finalize and distribute`;
  }

  // dashboards
  return `# Dashboard: ${prompt}

> Generated offline — connect to backend for AI-powered dashboard design

## Metrics Panel
- Key performance indicators
- [Connect to backend for detailed metrics]

## Chart Area
- Time series visualization
- Comparative analysis

## Data Table
- Detailed breakdowns
- Filtering and sorting capabilities`;
}
