'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Paperclip, Sparkles, Trash2, Wifi, WifiOff } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ContentChatProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ── localStorage keys ─────────────────────────────────────────────────────
const CONV_ID_KEY = 'content_chat_conversation_id';
const HISTORY_KEY = 'content_chat_history';

// ── Fallback response when backend is unreachable ─────────────────────────
function getFallbackResponse(input: string): string {
  return `⚠️ **Backend Unavailable**

I'm currently unable to connect to the Potomac AI backend to process your request:
> "${input.slice(0, 100)}${input.length > 100 ? '...' : ''}"

**What you can do:**
- Check your internet connection
- Verify the backend server is running (check Settings)
- Use the **Slide Decks**, **Articles**, **Documents**, or **Dashboards** tabs — they have built-in templates that work offline
- Try again in a moment — this chat will automatically reconnect when the backend is available

*This is NOT an AI-generated response — it's a connection error message.*`;
}

// ── Streaming text helper ─────────────────────────────────────────────────
async function streamIntoMessage(
  text: string,
  msgId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  let built = '';
  const chars = text.split('');
  for (let i = 0; i < chars.length; i += 4) {
    built += chars.slice(i, i + 4).join('');
    const snap = built;
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, content: snap } : m))
    );
    await new Promise((r) => setTimeout(r, 8));
  }
}

// ── localStorage helpers ───────────────────────────────────────────────────
function loadLocalHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs));
  } catch {}
}

// ── Main component ─────────────────────────────────────────────────────────
export function ContentChat({ colors, isDark }: ContentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(null); // null = checking
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load local history on mount ──────────────────────────────────────
  useEffect(() => {
    const history = loadLocalHistory();
    setMessages(history);
  }, []);

  // ── Probe backend ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiClient.checkHealth();
        if (!cancelled) setBackendOk(true);
      } catch {
        if (!cancelled) setBackendOk(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ─────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  // ── Send message ─────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const prompt = input.trim();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = [...prev, userMsg];
      saveLocalHistory(next);
      return next;
    });
    setInput('');
    setIsLoading(true);

    const assistantMsgId = `msg-${Date.now() + 1}`;
    const placeholderMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, placeholderMsg]);

    if (backendOk) {
      // ── Real backend /content/chat endpoint ─────────────────────────
      try {
        const result = await apiClient.sendContentChat(prompt, 'content-studio');
        const responseText = result.response || '';
        if (responseText) {
          await streamIntoMessage(responseText, assistantMsgId, setMessages);
        } else {
          const fallback = getFallbackResponse(prompt);
          await streamIntoMessage(fallback, assistantMsgId, setMessages);
        }
        setIsLoading(false);
        setMessages((prev) => { saveLocalHistory(prev); return prev; });
      } catch (err: any) {
        // If /content/chat fails, try /chat/stream as fallback
        try {
          if (!conversationId) {
            const conv = await apiClient.createConversation('Content Studio', 'agent');
            const newId = (conv as any).id || (conv as any).conversation_id;
            if (newId) { setConversationId(newId); localStorage.setItem(CONV_ID_KEY, newId); }
          }
          let fullText = '';
          const cid = conversationId || localStorage.getItem(CONV_ID_KEY) || undefined;
          await apiClient.sendMessageStream(prompt, cid, {
            onText: (chunk) => {
              fullText += chunk;
              setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullText } : m)));
            },
            onFinish: () => {
              setIsLoading(false);
              setMessages((prev) => { saveLocalHistory(prev); return prev; });
            },
          });
          if (!fullText.trim()) {
            await streamIntoMessage(getFallbackResponse(prompt), assistantMsgId, setMessages);
            setIsLoading(false);
            setMessages((prev) => { saveLocalHistory(prev); return prev; });
          }
        } catch {
          await streamIntoMessage(getFallbackResponse(prompt), assistantMsgId, setMessages);
          setIsLoading(false);
          setMessages((prev) => { saveLocalHistory(prev); return prev; });
        }
      }
    } else {
      // ── Offline / no backend — use fallback responses ───────────────
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      const fallback = getFallbackResponse(prompt);
      await streamIntoMessage(fallback, assistantMsgId, setMessages);
      setIsLoading(false);
      setMessages((prev) => { saveLocalHistory(prev); return prev; });
    }
  }, [input, isLoading, backendOk, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    abortRef.current?.abort();
    setMessages([]);
    localStorage.removeItem(HISTORY_KEY);

    if (backendOk) {
      // Create a fresh conversation
      try {
        if (conversationId) {
          await apiClient.deleteConversation(conversationId).catch(() => {});
        }
        const conv = await apiClient.createConversation('Content Studio', 'agent');
        const newId = (conv as any).id || (conv as any).conversation_id;
        if (newId) {
          setConversationId(newId);
          localStorage.setItem(CONV_ID_KEY, newId);
        }
      } catch {}
    } else {
      localStorage.removeItem(CONV_ID_KEY);
      setConversationId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.background,
      }}
    >
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
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
                'Draft a quarterly client report',
                'Build a portfolio dashboard',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
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
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Connection status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                {backendOk === null ? (
                  <Loader2 size={11} color={colors.textSecondary} style={{ animation: 'spin 1s linear infinite' }} />
                ) : backendOk ? (
                  <Wifi size={11} color="#22c55e" />
                ) : (
                  <WifiOff size={11} color={colors.textSecondary} />
                )}
                <span style={{ color: backendOk ? '#22c55e' : colors.textSecondary }}>
                  {backendOk === null ? 'Connecting…' : backendOk ? 'Live (backend)' : 'Offline (cached)'}
                </span>
              </div>

              <button
                onClick={handleClearHistory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.textMuted,
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.color = colors.textMuted;
                }}
              >
                <Trash2 size={11} />
                CLEAR HISTORY
              </button>
            </div>

            {/* Messages */}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: colors.textMuted,
                    padding: '0 4px',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <img
                      src="/potomac-icon.png"
                      alt="Yang"
                      style={{ width: '18px', height: '18px', borderRadius: '4px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span style={{ fontWeight: 600, color: colors.text }}>
                    {msg.role === 'user' ? 'You' : 'Yang'}
                  </span>
                  <span style={{ color: colors.textSecondary }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  style={{
                    maxWidth: msg.role === 'user' ? '75%' : '100%',
                    padding: msg.role === 'user' ? '10px 16px' : '16px 20px',
                    borderRadius:
                      msg.role === 'user' ? '16px 16px 6px 16px' : '16px 16px 16px 6px',
                    backgroundColor:
                      msg.role === 'user' ? '#FEC00F' : 'rgba(255,255,255,0.04)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    outline:
                      msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: msg.role === 'user' ? '#1a1a1a' : colors.text,
                    fontSize: '14px',
                    lineHeight: 1.7,
                    fontWeight: msg.role === 'user' ? 500 : 400,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content || (
                    <span style={{ opacity: 0.4 }}>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px' }}>
                <Loader2 size={16} color={colors.primaryYellow} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: colors.textMuted, fontSize: '13px' }}>Generating…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
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
              color: input.trim() && !isLoading ? colors.darkGray : colors.textMuted,
              border: 'none',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            aria-label="Send"
          >
            {isLoading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: colors.textSecondary,
            marginTop: '8px',
            fontFamily: "'Quicksand', sans-serif",
          }}
        >
          {backendOk
            ? 'Connected to Potomac backend · History synced'
            : 'History saved locally · Switch tabs to create specific content types'}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
