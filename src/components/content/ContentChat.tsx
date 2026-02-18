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

// ── Fallback responses when backend is unreachable ────────────────────────
const FALLBACK_RESPONSES: Record<string, string> = {
  default: `I can help you create professional financial content. Here are some things I can assist with:

• **Slide Decks** — Brand-compliant presentations with market analysis, earnings reviews, and investment theses
• **Articles** — Deep-dive research pieces, macro commentary, sector outlooks
• **Documents** — Quarterly reports, due diligence briefs, client memos
• **Dashboards** — Portfolio trackers, market monitors, risk panels

What would you like to create today?`,

  market: `## Market Analysis Overview — Q1 2026

The equity markets have shown resilience despite elevated interest rate expectations. Key themes:

1. **Large-Cap Tech** continues to outperform, driven by AI infrastructure spend
2. **Energy Sector** faces headwinds from supply normalization
3. **Financials** benefit from sustained higher-for-longer rate environment
4. **Fixed Income** — Duration risk remains elevated; short-end preferred

**Key Macro Indicators:**
- Fed Funds Rate: 4.50–4.75% (stable)
- 10Y Treasury: 4.62%
- S&P 500 YTD: +8.3%
- USD Index (DXY): 104.2

Would you like me to create a full slide deck or detailed report on any of these themes?`,

  thesis: `## Investment Thesis: AI Infrastructure

The secular shift toward AI-driven computing represents a multi-decade infrastructure buildout. We identify three primary beneficiaries:

### Tier 1 — Direct Beneficiaries
- **Semiconductor Design** (NVDA, AMD) — GPU demand remains supply-constrained
- **Data Center REITs** (EQIX, DLR) — Hyperscaler lease demand at record levels
- **Power Infrastructure** (NEE, VST) — AI data centers consume 10–100x more power

### Tier 2 — Enabling Layer
- **Networking** (ANET) — 400G/800G ethernet upgrades required
- **Memory** (MU) — HBM demand structurally elevated

### Risk Factors
- Valuation compression if AI capex disappoints
- Regulatory overhang on chip exports
- Power grid constraints delaying deployment

**Recommendation:** Overweight with 18–24 month horizon.`,

  portfolio: `## Portfolio Performance Summary — Q4 2025

| Metric | Portfolio | Benchmark |
|--------|-----------|-----------|
| Total Return | +12.4% | +9.1% |
| Sharpe Ratio | 1.42 | 1.18 |
| Max Drawdown | -4.2% | -6.8% |
| Beta | 0.87 | 1.00 |

**Top Contributors:**
1. Technology allocation (+340 bps)
2. Underweight Utilities (+80 bps)
3. Long USD positioning (+120 bps)

**Top Detractors:**
1. Healthcare underweight (-60 bps)
2. International exposure (-40 bps)

**Outlook:** Maintaining defensive tilt with selective rotation into quality cyclicals as rate cycle stabilizes.`,

  report: `## Quarterly Client Report — Template

**Q1 2026 Portfolio Review**

---

### Executive Summary
Your portfolio returned **+X.X%** during Q1 2026, outperforming the benchmark by **+X.X%**.

### Portfolio Allocation
- Equities: 65% (target: 60–70%)
- Fixed Income: 25% (target: 20–30%)
- Alternatives: 7%
- Cash: 3%

### Market Commentary
Global equity markets navigated a complex macro backdrop characterized by persistent inflation, central bank divergence, and geopolitical uncertainty.

### Forward Outlook
We remain constructive on risk assets with a quality bias, expecting continued volatility to provide tactical entry points.

---
*Potomac Asset Management. Past performance is not indicative of future results.*`,
};

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('market') || lower.includes('analysis') || lower.includes('macro')) return FALLBACK_RESPONSES.market;
  if (lower.includes('thesis') || lower.includes('ai') || lower.includes('tech') || lower.includes('infrastructure')) return FALLBACK_RESPONSES.thesis;
  if (lower.includes('portfolio') || lower.includes('performance') || lower.includes('return')) return FALLBACK_RESPONSES.portfolio;
  if (lower.includes('report') || lower.includes('quarterly') || lower.includes('client')) return FALLBACK_RESPONSES.report;
  return FALLBACK_RESPONSES.default;
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

  // ── Probe backend & restore conversation ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Check connectivity
        await apiClient.checkHealth();
        if (cancelled) return;
        setBackendOk(true);

        // 2. Restore or create a dedicated "content" conversation
        const savedConvId = localStorage.getItem(CONV_ID_KEY);
        if (savedConvId) {
          try {
            // Verify it still exists & load messages
            const backendMsgs = await apiClient.getMessages(savedConvId);
            if (cancelled) return;
            setConversationId(savedConvId);
            if (backendMsgs && backendMsgs.length > 0) {
              const mapped: ChatMessage[] = backendMsgs.map((m: any) => ({
                id: m.id || `msg-${Date.now()}-${Math.random()}`,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: m.timestamp || m.created_at || new Date().toISOString(),
              }));
              setMessages(mapped);
              saveLocalHistory(mapped);
            }
            return;
          } catch {
            // Conversation gone — create a new one
            localStorage.removeItem(CONV_ID_KEY);
          }
        }

        // 3. Create a new conversation for the Content Studio
        const conv = await apiClient.createConversation('Content Studio', 'agent');
        if (cancelled) return;
        const newId = (conv as any).id || (conv as any).conversation_id;
        if (newId) {
          setConversationId(newId);
          localStorage.setItem(CONV_ID_KEY, newId);
        }
      } catch {
        if (!cancelled) {
          setBackendOk(false);
          // Fall back to localStorage history
          const history = loadLocalHistory();
          setMessages(history);
        }
      }
    }

    init();
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

    if (backendOk && conversationId) {
      // ── Real backend streaming ──────────────────────────────────────
      const abort = new AbortController();
      abortRef.current = abort;

      let fullText = '';
      try {
        await apiClient.sendMessageStream(prompt, conversationId, {
          signal: abort.signal,
          onText: (chunk) => {
            fullText += chunk;
            const snap = fullText;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: snap } : m))
            );
          },
          onError: (err) => {
            console.error('Stream error:', err);
            // Fall through to fallback below
          },
          onFinish: () => {
            setIsLoading(false);
            setMessages((prev) => {
              saveLocalHistory(prev);
              return prev;
            });
          },
        });

        // If backend returned empty text, use fallback
        if (!fullText.trim()) {
          const fallback = getFallbackResponse(prompt);
          await streamIntoMessage(fallback, assistantMsgId, setMessages);
          setIsLoading(false);
          setMessages((prev) => { saveLocalHistory(prev); return prev; });
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setIsLoading(false);
          return;
        }
        // Network error → fall back to mock
        const fallback = getFallbackResponse(prompt);
        await streamIntoMessage(fallback, assistantMsgId, setMessages);
        setIsLoading(false);
        setMessages((prev) => { saveLocalHistory(prev); return prev; });
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
