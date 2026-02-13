'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, X, Sparkles, Paperclip, Presentation, BookOpen, File, BarChart3 } from 'lucide-react';

type ContentType = 'slides' | 'articles' | 'documents' | 'dashboards';

interface CreationChatModalProps {
  colors: Record<string, string>;
  isDark: boolean;
  contentType: ContentType;
  onClose: () => void;
  onCreated?: (item: { title: string; messages: ChatMessage[] }) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Placeholder: Backend will be wired manually
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I'll create your ${config.label.toLowerCase()} based on that. Here's what I'm planning:\n\n- Analyzing your requirements\n- Structuring the ${config.label.toLowerCase()} layout\n- Generating content outline\n\nThis is a placeholder response. Wire up your backend to handle the actual ${config.label.toLowerCase()} creation.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1500);
  }, [input, isLoading, config.label]);

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
                background: `linear-gradient(135deg, ${colors.primaryYellow}20, ${colors.turquoise}20)`,
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
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Describe what you need and the AI will generate it
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
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
                  background: `linear-gradient(135deg, ${colors.primaryYellow}15, ${colors.turquoise}15)`,
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
                      borderRadius:
                        msg.role === 'user'
                          ? '14px 14px 4px 14px'
                          : '14px 14px 14px 4px',
                      backgroundColor:
                        msg.role === 'user'
                          ? colors.primaryYellow
                          : isDark
                            ? '#262626'
                            : '#f0f0f0',
                      color:
                        msg.role === 'user' ? colors.darkGray : colors.text,
                      fontSize: '13px',
                      lineHeight: 1.6,
                      fontWeight: msg.role === 'user' ? 500 : 400,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: colors.textSecondary,
                      marginTop: '3px',
                      padding: '0 4px',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px' }}>
                  <Loader2
                    size={15}
                    color={colors.primaryYellow}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                    Generating your {config.label.toLowerCase()}...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
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
                backgroundColor:
                  input.trim() && !isLoading
                    ? colors.primaryYellow
                    : isDark
                      ? '#333333'
                      : '#e0e0e0',
                color:
                  input.trim() && !isLoading
                    ? colors.darkGray
                    : colors.textMuted,
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
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
