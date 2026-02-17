'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Paperclip, Sparkles } from 'lucide-react';

interface ContentChatProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ContentChat({ colors, isDark }: ContentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

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

    try {
      // Get API base URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Call content chat streaming endpoint
      const response = await fetch(`${apiUrl}/content/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: currentInput,
          contentType: 'general'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      let assistantContent = '';
      const assistantMsgId = `msg-${Date.now() + 1}`;

      // Create initial assistant message
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
                    // Update the assistant message
                    setMessages((prev) => prev.map(msg => 
                      msg.id === assistantMsgId 
                        ? { ...msg, content: assistantContent }
                        : msg
                    ));
                  } else if (data.type === 'complete') {
                    break;
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  // Ignore invalid JSON chunks
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error('Content chat error:', error);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.background,
      }}
    >
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
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
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.primaryYellow}20, ${colors.turquoise}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={28} color={colors.primaryYellow} />
            </div>
            <h3
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '22px',
                color: colors.text,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Content Assistant
            </h3>
            <p
              style={{
                color: colors.textMuted,
                fontSize: '14px',
                textAlign: 'center',
                maxWidth: '400px',
                lineHeight: 1.6,
              }}
            >
              Ask me to create slide decks, articles, documents, or dashboards.
              I can also help you refine your writing style and tone.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center',
                marginTop: '8px',
              }}
            >
              {[
                'Create a market analysis deck',
                'Write an investment thesis article',
                'Draft a quarterly report',
                'Build a portfolio dashboard',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isDark ? '#262626' : '#f0f0f0',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '20px',
                    color: colors.textMuted,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '4px',
                }}
              >
                {/* Sender label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: colors.textMuted,
                  padding: '0 4px',
                }}>
                  {msg.role === 'assistant' && (
                    <img src="/potomac-icon.png" alt="Yang AI" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                  )}
                  <span style={{ fontWeight: 600, color: colors.text }}>
                    {msg.role === 'user' ? 'You' : 'Yang'}
                  </span>
                  <span style={{ color: colors.textSecondary }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: msg.role === 'user' ? '75%' : '100%',
                    padding: msg.role === 'user' ? '10px 16px' : '16px 20px',
                    borderRadius: msg.role === 'user' ? '16px 16px 6px 16px' : '16px 16px 16px 6px',
                    backgroundColor: msg.role === 'user' ? '#FEC00F' : 'rgba(255,255,255,0.04)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    outline: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: msg.role === 'user' ? '#1a1a1a' : colors.text,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    fontWeight: msg.role === 'user' ? 500 : 400,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px' }}>
                <Loader2
                  size={16}
                  color={colors.primaryYellow}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <span style={{ color: colors.textMuted, fontSize: '13px' }}>
                  Generating...
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
          padding: '16px 24px',
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.cardBg,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: colors.inputBg,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            padding: '8px 12px',
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
            <Paperclip size={18} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the content you want to create..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: colors.text,
              fontSize: '14px',
              fontFamily: "'Quicksand', sans-serif",
              resize: 'none',
              minHeight: '44px',
              maxHeight: '160px',
              lineHeight: 1.5,
              padding: '8px 0',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: '40px',
              height: '40px',
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
              <Loader2
                size={18}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
