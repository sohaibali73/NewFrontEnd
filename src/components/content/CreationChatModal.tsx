'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, X, Sparkles, Paperclip, Presentation, BookOpen, File, BarChart3, Download, CheckCircle } from 'lucide-react';

type ContentType = 'slides' | 'articles' | 'documents' | 'dashboards';

interface CreationChatModalProps {
  colors: Record<string, string>;
  isDark: boolean;
  contentType: ContentType;
  onClose: () => void;
  onCreated?: (item: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  downloadUrl?: string;
  presentationId?: string;
  title?: string;
}

const CONTENT_CONFIG: Record<ContentType, { label: string; icon: React.ElementType; placeholder: string; suggestions: string[] }> = {
  slides: {
    label: 'Slide Deck',
    icon: Presentation,
    placeholder: 'Describe the slide deck you want to create...',
    suggestions: [
      'Create a 10-slide market analysis deck',
      'Build an earnings review presentation',
      'Design an investment thesis pitch deck',
      'Make a portfolio performance summary',
    ],
  },
  articles: {
    label: 'Article',
    icon: BookOpen,
    placeholder: 'Describe the article you want to write...',
    suggestions: [
      'Write a deep-dive on sector rotation',
      'Draft an emerging markets outlook',
      'Create a technical analysis guide',
      'Write a macro commentary piece',
    ],
  },
  documents: {
    label: 'Document',
    icon: File,
    placeholder: 'Describe the document you want to create...',
    suggestions: [
      'Draft a quarterly portfolio report',
      'Create a client onboarding memo',
      'Write a due diligence brief',
      'Build an investment committee report',
    ],
  },
  dashboards: {
    label: 'Dashboard',
    icon: BarChart3,
    placeholder: 'Describe the dashboard you want to build...',
    suggestions: [
      'Build a real-time portfolio tracker',
      'Create a market sentiment dashboard',
      'Design a risk monitoring panel',
      'Make a sector performance overview',
    ],
  },
};

export function CreationChatModal({ colors, isDark, contentType, onClose, onCreated }: CreationChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = CONTENT_CONFIG[contentType];
  const Icon = config.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleDownload = useCallback(async (downloadUrl: string, title: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(downloadUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'presentation'}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setStatusMessage('');

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const token = localStorage.getItem('auth_token');

      if (!token) throw new Error('Authentication required');

      // Use the dedicated slides/generate endpoint for slides (potomac-pptx skill)
      if (contentType === 'slides') {
        const response = await fetch(`${apiUrl}/content/slides/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: currentInput,
            title: currentInput.slice(0, 60),
            slide_count: 10,
            skill_id: 'skill_01Aa2Us1EDWXRkrxg1PgqbaC',
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const reader = response.body?.getReader();
        const assistantMsgId = `msg-${Date.now() + 1}`;
        let assistantContent = '';
        let downloadUrl: string | undefined;
        let presentationId: string | undefined;
        let deckTitle = currentInput.slice(0, 60);

        setMessages((prev) => [...prev, {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }]);

        if (reader) {
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'status') {
                      setStatusMessage(data.message || '');
                    } else if (data.type === 'complete') {
                      assistantContent = data.text || 'Presentation generated successfully!';
                      downloadUrl = data.download_url;
                      presentationId = data.presentation_id;
                      deckTitle = data.title || deckTitle;
                      setStatusMessage('');
                      setMessages((prev) => prev.map(msg =>
                        msg.id === assistantMsgId
                          ? { ...msg, content: assistantContent, downloadUrl, presentationId, title: deckTitle }
                          : msg
                      ));
                      if (onCreated) {
                        onCreated({
                          id: `deck-${Date.now()}`,
                          title: deckTitle,
                          slideCount: data.slide_count || 10,
                          updatedAt: 'just now',
                          status: 'complete',
                          downloadUrl: downloadUrl,
                          presentationId: presentationId,
                          filename: data.filename || `${deckTitle}.pptx`,
                        });
                      }
                    } else if (data.type === 'error') {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    // ignore
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      } else {
        // Non-slides: use the general content chat endpoint
        const response = await fetch(`${apiUrl}/content/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ text: currentInput, contentType }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const reader = response.body?.getReader();
        let assistantContent = '';
        const assistantMsgId = `msg-${Date.now() + 1}`;

        setMessages((prev) => [...prev, {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }]);

        if (reader) {
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'text') {
                      assistantContent += data.text;
                      setMessages((prev) => prev.map(msg =>
                        msg.id === assistantMsgId ? { ...msg, content: assistantContent } : msg
                      ));
                    } else if (data.type === 'complete') {
                      if (onCreated && assistantContent) {
                        onCreated({
                          title: `${config.label} - ${new Date().toLocaleDateString()}`,
                          messages: [],
                        });
                      }
                    } else if (data.type === 'error') {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    // ignore
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      }
    } catch (error) {
      console.error('Content creation error:', error);
      setStatusMessage('');
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, config.label, contentType, onCreated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Create new ${config.label}`}
    >
      <div
        style={{
          width: '680px',
          maxWidth: '95vw',
          height: '75vh',
          maxHeight: '700px',
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          animation: 'modalSlideIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                    background: `linear-gradient(135deg, ${colors.primaryYellow}20, ${colors.border}40)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={17} color={colors.primaryYellow} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  color: colors.text,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                New {config.label}
              </h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0, lineHeight: 1.3 }}>
                {contentType === 'slides'
                  ? 'Powered by Potomac PPTX Skill — brand-compliant presentations'
                  : 'Describe what you need and the AI will generate it'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primaryYellow;
              e.currentTarget.style.color = colors.primaryYellow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.color = colors.textMuted;
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${colors.primaryYellow}15, ${colors.border}40)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={24} color={colors.primaryYellow} />
              </div>
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: '15px',
                  color: colors.textMuted,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                What would you like to create?
              </p>
              {contentType === 'slides' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: `${colors.primaryYellow}10`,
                    border: `1px solid ${colors.primaryYellow}30`,
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: colors.primaryYellow,
                  }}
                >
                  <Presentation size={14} />
                  Uses <strong>potomac-pptx</strong> skill — generates a real .pptx file with Potomac branding
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                  marginTop: '4px',
                  maxWidth: '500px',
                }}
              >
                {config.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    style={{
                      padding: '7px 14px',
                      backgroundColor: isDark ? '#262626' : '#f0f0f0',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '20px',
                      color: colors.textMuted,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Quicksand', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primaryYellow;
                      e.currentTarget.style.color = colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      backgroundColor: msg.role === 'user' ? colors.primaryYellow : isDark ? '#262626' : '#f0f0f0',
                      color: msg.role === 'user' ? colors.darkGray : colors.text,
                      fontSize: '13px',
                      lineHeight: 1.6,
                      fontWeight: msg.role === 'user' ? 500 : 400,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content || (isLoading && msg.role === 'assistant' ? '' : msg.content)}

                    {/* Download button for completed presentations */}
                    {msg.role === 'assistant' && msg.downloadUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <button
                          onClick={() => handleDownload(msg.downloadUrl!, msg.title || 'presentation')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            backgroundColor: colors.primaryYellow,
                            color: colors.darkGray,
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700,
                            fontSize: '13px',
                            letterSpacing: '0.5px',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                        >
                          <Download size={16} />
                          DOWNLOAD PPTX
                        </button>
                      </div>
                    )}

                    {/* Success badge when no download URL but complete */}
                    {msg.role === 'assistant' && msg.content && contentType === 'slides' && !msg.downloadUrl && msg.content !== '' && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.primaryYellow }}>
                        <CheckCircle size={13} />
                        Presentation outline generated
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textMuted, marginTop: '3px', padding: '0 4px' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={15} color={colors.primaryYellow} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                      {statusMessage || `Generating your ${config.label.toLowerCase()}...`}
                    </span>
                  </div>
                  {contentType === 'slides' && (
                    <div style={{ fontSize: '11px', color: colors.textMuted, paddingLeft: '23px' }}>
                      Using potomac-pptx skill for brand-compliant output
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '12px 20px 16px', borderTop: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '10px',
              backgroundColor: colors.inputBg,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              padding: '6px 10px',
              transition: 'border-color 0.2s ease',
            }}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                color: colors.textMuted,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Attach file"
            >
              <Paperclip size={16} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: colors.text,
                fontSize: '13px',
                fontFamily: "'Quicksand', sans-serif",
                resize: 'none',
                minHeight: '44px',
                maxHeight: '140px',
                lineHeight: 1.5,
                padding: '8px 0',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: input.trim() && !isLoading ? colors.primaryYellow : isDark ? '#333333' : '#e0e0e0',
                color: input.trim() && !isLoading ? colors.darkGray : colors.textMuted,
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
