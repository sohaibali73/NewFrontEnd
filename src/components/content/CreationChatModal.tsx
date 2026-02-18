'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Loader2,
  X,
  Sparkles,
  Paperclip,
  Presentation,
  BookOpen,
  File,
  BarChart3,
  Download,
  CheckCircle,
} from 'lucide-react';

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
  createdItem?: any;
}

const CONTENT_CONFIG: Record<
  ContentType,
  {
    label: string;
    icon: React.ElementType;
    placeholder: string;
    suggestions: string[];
  }
> = {
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

// ─── Mock content generators ───────────────────────────────────────────────

function generateSlideContent(prompt: string) {
  const title = prompt.length > 60 ? prompt.slice(0, 57) + '…' : prompt;
  const slideCount = 10 + Math.floor(Math.random() * 6); // 10–15 slides
  return {
    title,
    slideCount,
    topic: prompt,
    content: `Slide deck generated: "${title}" (${slideCount} slides)`,
    response: `✅ **Slide deck created successfully!**

**Title:** ${title}
**Slides:** ${slideCount}
**Format:** Potomac-branded PPTX

**Outline:**
1. Title Slide
2. Executive Summary
3. Market Context & Backdrop
4. Key Thesis / Core Argument
5. Supporting Data & Analysis
6. Competitive Landscape
7. Risk Factors
8. Financial Projections
9. Investment Implications
10. Conclusion & Next Steps
${slideCount > 10 ? Array.from({ length: slideCount - 10 }, (_, i) => `${11 + i}. Appendix ${i + 1}`).join('\n') : ''}

The deck has been saved to your Slide Decks library. Click **DOWNLOAD** to export the presentation outline.`,
  };
}

function generateArticleContent(prompt: string) {
  const title = prompt.length > 80 ? prompt.slice(0, 77) + '…' : prompt;
  const isMarket = /market|macro|economy/i.test(prompt);
  const isSector = /sector|rotation|industry/i.test(prompt);
  const isEM = /emerging|em |international|global/i.test(prompt);

  let content = '';
  let tags: string[] = [];

  if (isMarket) {
    content = `${title}

The current macroeconomic environment presents a nuanced backdrop for investors navigating elevated rates, slowing but resilient growth, and emerging structural shifts in technology and energy.

Central bank policy remains the dominant driver of asset prices. The Federal Reserve's higher-for-longer posture has compressed multiples across rate-sensitive sectors while providing tailwinds for quality earnings compounders with pricing power.

Global divergence is becoming a defining characteristic of this cycle. The US continues to outperform on a relative basis, supported by productivity gains from AI adoption and resilient consumer spending. Europe faces deeper structural headwinds from energy costs and demographic trends.

Key risks: (1) Stickier-than-expected inflation forcing additional rate hikes; (2) Geopolitical escalation disrupting energy markets; (3) Commercial real estate stress spilling into regional banking.

Positioning: Maintain quality bias, prefer short duration, selectively add in volatility.`;
    tags = ['Macro', 'Market Analysis', 'Fixed Income'];
  } else if (isSector) {
    content = `${title}

Sector rotation dynamics are shifting materially as the rate cycle enters a new phase. The traditional growth-to-value playbook is being complicated by structural forces — AI adoption, energy transition, and demographic realignment — that are rewiring sector fundamentals.

Technology continues to command premium valuations, justified in part by extraordinary earnings growth from AI-driven productivity. The key question for investors is whether current multiples adequately discount the earnings durability or assume a perfect execution scenario.

Energy and utilities are re-rating as power demand from AI data centers transforms what were traditionally defensive sectors into growth stories. The levelized cost of renewable energy has crossed parity with fossil fuels in most geographies, accelerating the transition.

Healthcare offers a compelling combination of defensive earnings and genuine innovation optionality through GLP-1 drugs, genomic medicine, and AI-assisted diagnostics.

Recommendation: Overweight technology (quality names), utilities (AI power exposure), and healthcare (medtech and biopharma). Underweight consumer discretionary and rate-sensitive REITs.`;
    tags = ['Sectors', 'Rotation', 'Equity Strategy'];
  } else if (isEM) {
    content = `${title}

Emerging market equities have underperformed developed markets in dollar terms, but surface-level analysis obscures enormous intra-EM dispersion that creates compelling opportunities for active managers.

India represents a structural conviction position. With GDP growth above 7%, a young demographic, accelerating digital adoption, and a government committed to infrastructure investment, India offers a multi-decade growth story that is increasingly decoupled from Western rate cycles. Nifty 50 valuations have expanded, but earnings quality justifies the premium.

Southeast Asia — Vietnam, Indonesia, Philippines — is emerging as the primary beneficiary of supply chain diversification. Manufacturing FDI from electronics, EVs, and semiconductors is creating genuine industrialization tailwinds.

China is more complex. Stimulus has been insufficient to offset property sector deflation, and investor confidence remains fragile amid regulatory uncertainty. We prefer a selective approach focused on domestic consumer and technology names over export-dependent manufacturers.

Actionable: Overweight India, selective ASEAN exposure, neutral China with optionality for tactical rebound, underweight broad EM beta.`;
    tags = ['Emerging Markets', 'Global', 'Asia'];
  } else {
    content = `${title}

This analysis examines the current investment landscape with a focus on identifying durable opportunities across asset classes and geographies.

The central thesis: quality matters more than ever in a higher-rate, higher-volatility environment. Companies with genuine pricing power, strong cash flow generation, and balance sheet resilience will separate from the pack as financial engineering becomes less viable as a earnings driver.

Fixed income is offering real yields for the first time in over a decade, creating genuine competition for equity capital. The 60/40 portfolio is back — but with a preference for shorter duration and higher credit quality than historical averages.

Alternative assets — particularly private credit, infrastructure, and real assets — continue to attract capital as institutional investors seek yield enhancement and inflation protection. Selectivity and due diligence are essential given crowded positioning in some segments.

Conclusion: Maintain a diversified, quality-biased portfolio. Use volatility as a buying opportunity in high-conviction names. Keep powder dry for dislocations.`;
    tags = ['Investment Strategy', 'Multi-Asset', 'Portfolio Management'];
  }

  return {
    title,
    content,
    tags,
    response: `✅ **Article drafted successfully!**

**Title:** ${title}
**Tags:** ${tags.join(', ')}
**Estimated read time:** ~${Math.ceil(content.split(' ').length / 200)} min

The article has been saved to your Articles library. Click the **expand** button (▼) to read the full text, or **download** to export as a text file.`,
  };
}

function generateDocumentContent(prompt: string) {
  const isReport = /report|quarterly|performance/i.test(prompt);
  const isDueDil = /due diligence|dd|brief|investment/i.test(prompt);
  const isOnboard = /onboard|client|memo|welcome/i.test(prompt);
  const isIC = /committee|ic memo|rebalanc/i.test(prompt);

  let title = '';
  let type = 'Document';
  let content = '';

  if (isReport) {
    title = `Quarterly Portfolio Report — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    type = 'Quarterly Report';
    content = `QUARTERLY PORTFOLIO REPORT
${title.toUpperCase()}
Prepared by: Potomac Asset Management | Confidential

EXECUTIVE SUMMARY
─────────────────
Portfolio delivered strong risk-adjusted returns this quarter, outperforming the blended benchmark by 280 basis points. Key contributors were technology overweights and disciplined duration positioning in fixed income.

PERFORMANCE ATTRIBUTION
────────────────────────
Equity Selection:        +180 bps
Sector Allocation:       +60 bps
Fixed Income Duration:   +40 bps
Currency Overlay:        +20 bps
Other:                   -20 bps
─────────────────────────
Total Alpha:             +280 bps

TOP 5 CONTRIBUTORS
──────────────────
1. Technology overweight:   +160 bps
2. Utilities (AI power):    +55 bps
3. Short duration FI:       +40 bps
4. India ETF:               +35 bps
5. Energy free cash flow:   +28 bps

PORTFOLIO POSITIONING
─────────────────────
Equities:       65.2%  (Target: 60–70%)
Fixed Income:   23.8%  (Target: 20–30%)
Alternatives:   7.0%   (Target: 5–10%)
Cash:           4.0%   (Target: 3–5%)

FORWARD OUTLOOK
───────────────
Maintain constructive stance on equities with quality bias. Reduce duration risk in fixed income. Selectively add alternatives exposure in private credit and infrastructure.

Next quarterly review: ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}

─────────────────────────────────────────────
Potomac Asset Management | Past performance is not indicative of future results.`;
  } else if (isDueDil) {
    title = `Due Diligence Brief — ${prompt.includes('—') ? prompt.split('—')[1].trim() : 'Investment Opportunity'}`;
    type = 'Due Diligence';
    content = `INVESTMENT DUE DILIGENCE BRIEF
${title.toUpperCase()}
Date: ${new Date().toLocaleDateString()} | CONFIDENTIAL — POTOMAC ASSET MANAGEMENT

COMPANY OVERVIEW
────────────────
[Target Company] operates in a high-growth segment of the market with demonstrated product-market fit, scalable unit economics, and a clear path to profitability.

Founded: [Year] | HQ: [Location] | Stage: [Series X]

FINANCIAL SUMMARY
─────────────────
Revenue (LTM):        $[X]M  (+[Y]% YoY)
ARR:                  $[X]M
Gross Margin:         [X]%
Monthly Burn:         $[X]M
Runway:               ~[X] months post-investment

DEAL TERMS
──────────
Raise:             $[X]M
Pre-money Val:     $[X]M
Our Allocation:    $[X]M ([X]% of round)
Lead Investor:     [Lead VC]
Pro-rata Rights:   Yes
Liquidation Pref:  1x non-participating

KEY RISKS
─────────
1. Customer concentration
2. Competitive pressure from well-funded incumbents
3. Execution risk on go-to-market expansion
4. Key person dependency on founding team

RECOMMENDATION
──────────────
[INVEST / PASS] — [Brief rationale]

Key conditions: (1) Information rights, (2) Anti-dilution protection, (3) Board observer seat

Prepared by: Potomac Asset Management Research Team`;
  } else if (isOnboard) {
    title = `Client Onboarding Memo — ${new Date().toLocaleDateString()}`;
    type = 'Onboarding';
    content = `CLIENT ONBOARDING MEMORANDUM
${title.toUpperCase()}
Prepared by: Client Services Team, Potomac Asset Management | Confidential

CLIENT INFORMATION
──────────────────
Client Name:          [Client Name]
Entity Type:          [Individual / Trust / LLC / Foundation]
AUM Onboarded:        $[X]M
Primary Contact:      [Name, Title]
Investment Horizon:   [X]+ years
Risk Tolerance:       [Conservative / Moderate / Aggressive]

INVESTMENT POLICY STATEMENT
────────────────────────────
Return Objective:         CPI + [X]% net of fees
Liquidity Requirement:    $[X]K available within [X] days
ESG Restrictions:         [None / Specific exclusions]

TARGET ALLOCATION
─────────────────
Public Equities:          [X]%
Fixed Income:             [X]%
Alternatives:             [X]%
Cash:                     [X]%

FEE SCHEDULE
────────────
Management Fee:     [X]% on AUM
Performance Fee:    [X]% above [X]% hurdle
Reporting Cycle:    Monthly performance, Quarterly full reports, Annual tax

NEXT STEPS
──────────
[ ] Execute Investment Management Agreement
[ ] Complete KYC / AML documentation
[ ] Arrange custody account transfer
[ ] Initial investment deployment by [Date]
[ ] Onboarding call scheduled: [Date]

Potomac Asset Management | Confidential`;
  } else if (isIC) {
    title = `Investment Committee Memo — ${new Date().toLocaleDateString()}`;
    type = 'IC Memo';
    content = `INVESTMENT COMMITTEE MEMORANDUM
${title.toUpperCase()}
TO: Investment Committee
FROM: Portfolio Management Team
DATE: ${new Date().toLocaleDateString()}
RE: Proposed Portfolio Rebalancing

EXECUTIVE SUMMARY
─────────────────
This memo proposes tactical adjustments to portfolio positioning based on current market conditions, valuation signals, and risk management considerations.

PROPOSED CHANGES
────────────────
EQUITIES — Net Change: [+/-X]%
  ADD:    [Sector/Asset] +[X]% — Rationale: [Brief rationale]
  REDUCE: [Sector/Asset] -[X]% — Rationale: [Brief rationale]

FIXED INCOME — Net Change: [+/-X]%
  REDUCE: [Duration/Instrument] -[X]%
  ADD:    [Duration/Instrument] +[X]%

ALTERNATIVES — [Change or Unchanged]

RATIONALE
─────────
(1) [Primary macro driver]
(2) [Valuation consideration]
(3) [Risk management rationale]

IMPLEMENTATION
──────────────
Target Date:    [Date]
Method:         Systematic rebalance
Tax Impact:     [Minimal / Harvest opportunities in taxable accounts]

VOTE REQUIRED
─────────────
Majority IC vote required to proceed.
Committee Call: [Date] at [Time] ET

Potomac Asset Management | Investment Committee | Confidential`;
  } else {
    title = prompt.length > 60 ? prompt.slice(0, 57) + '…' : prompt;
    type = 'Document';
    content = `${title.toUpperCase()}
${new Date().toLocaleDateString()} | Potomac Asset Management | Confidential

OVERVIEW
────────
${prompt}

This document has been prepared based on your request. The following sections provide a structured analysis and recommendations.

KEY POINTS
──────────
1. [Key Point 1 — Add specific content here]
2. [Key Point 2 — Add specific content here]
3. [Key Point 3 — Add specific content here]

ANALYSIS
────────
[Detailed analysis section — customize with specific data, charts, and findings relevant to your audience and objectives]

RECOMMENDATIONS
───────────────
• [Recommendation 1]
• [Recommendation 2]
• [Recommendation 3]

NEXT STEPS
──────────
• [Action 1] — Due: [Date]
• [Action 2] — Due: [Date]
• [Action 3] — Due: [Date]

─────────────────────────────────────────────
Potomac Asset Management | Confidential`;
  }

  return {
    title,
    type,
    content,
    response: `✅ **Document created successfully!**

**Title:** ${title}
**Type:** ${type}
**Created:** ${new Date().toLocaleString()}

The document has been saved to your Documents library. Click the **expand** button (▼) to preview, **pencil** to rename, or **download** to export as a text file.`,
  };
}

function generateDashboardContent(prompt: string) {
  const title = prompt.length > 60 ? prompt.slice(0, 57) + '…' : prompt;
  return {
    title,
    response: `✅ **Dashboard created successfully!**

**Name:** ${title}
**Widgets:** 4 (expandable)
**Status:** Live

Your new dashboard has been added to the Dashboards panel. You can:
• **Select it** from the sidebar to view all widgets
• **Duplicate** existing dashboards as templates
• **Add more widgets** by editing the dashboard configuration

The dashboard is initialized with placeholder metrics — connect your data sources to populate live values.`,
  };
}

async function streamText(
  text: string,
  onChunk: (partial: string) => void,
  onDone: () => void
) {
  const chars = text.split('');
  let built = '';
  for (let i = 0; i < chars.length; i += 3) {
    built += chars.slice(i, i + 3).join('');
    onChunk(built);
    await new Promise((r) => setTimeout(r, 10));
  }
  onDone();
}

export function CreationChatModal({
  colors,
  isDark,
  contentType,
  onClose,
  onCreated,
}: CreationChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
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
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const prompt = input.trim();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStatusMsg(`Generating your ${config.label.toLowerCase()}...`);

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

    // Generate content based on type
    let responseText = '';
    let createdItem: any = null;

    if (contentType === 'slides') {
      setStatusMsg('Building slide structure...');
      await new Promise((r) => setTimeout(r, 500));
      const result = generateSlideContent(prompt);
      responseText = result.response;
      createdItem = result;
    } else if (contentType === 'articles') {
      setStatusMsg('Writing article content...');
      await new Promise((r) => setTimeout(r, 600));
      const result = generateArticleContent(prompt);
      responseText = result.response;
      createdItem = result;
    } else if (contentType === 'documents') {
      setStatusMsg('Drafting document...');
      await new Promise((r) => setTimeout(r, 500));
      const result = generateDocumentContent(prompt);
      responseText = result.response;
      createdItem = result;
    } else {
      setStatusMsg('Configuring dashboard...');
      await new Promise((r) => setTimeout(r, 400));
      const result = generateDashboardContent(prompt);
      responseText = result.response;
      createdItem = result;
    }

    setStatusMsg('');

    // Create streaming message
    const assistantMsgId = `msg-${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        createdItem,
      },
    ]);
    setIsLoading(false);

    // Stream the response text
    await streamText(
      responseText,
      (partial) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: partial } : m
          )
        );
      },
      () => {
        // After streaming completes, notify parent
        if (onCreated && createdItem) {
          setTimeout(() => {
            onCreated(createdItem);
          }, 500);
        }
      }
    );
  }, [input, isLoading, contentType, config.label, onCreated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownloadSlide = (item: any) => {
    const content = `POTOMAC ASSET MANAGEMENT — PRESENTATION OUTLINE
================================================
Title: ${item.title}
Slides: ${item.slideCount}
Generated: ${new Date().toLocaleString()}
Topic: ${item.topic}

SLIDE OUTLINE
─────────────
1. Title Slide — ${item.title}
2. Executive Summary — Key themes and investment implications
3. Market Context — Macro backdrop and sector drivers
4. Core Thesis — Investment rationale and supporting evidence
5. Data Analysis — Charts, metrics, and supporting data
6. Competitive Landscape — Peer comparison and positioning
7. Financial Projections — Forward estimates and scenarios
8. Risk Factors — Key risks and mitigation strategies
9. Portfolio Implications — Actionable investment ideas
10. Conclusion — Summary and next steps

================================================
Potomac Asset Management | Confidential
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
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
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          animation: 'modalSlideIn 0.2s ease-out',
        }}
      >
        {/* Header */}
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
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                AI-powered content generation · Saves locally
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
                      maxWidth: '90%',
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
                      color: msg.role === 'user' ? colors.darkGray : colors.text,
                      fontSize: '13px',
                      lineHeight: 1.65,
                      fontWeight: msg.role === 'user' ? 500 : 400,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}

                    {/* Download button for slides */}
                    {msg.role === 'assistant' &&
                      msg.createdItem &&
                      contentType === 'slides' &&
                      msg.content.length > 20 && (
                        <div style={{ marginTop: '12px' }}>
                          <button
                            onClick={() => handleDownloadSlide(msg.createdItem)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '9px 16px',
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
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                          >
                            <Download size={14} />
                            DOWNLOAD OUTLINE
                          </button>
                        </div>
                      )}

                    {/* Success indicator for non-slides */}
                    {msg.role === 'assistant' &&
                      msg.createdItem &&
                      contentType !== 'slides' &&
                      msg.content.length > 20 && (
                        <div
                          style={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            color: '#22c55e',
                          }}
                        >
                          <CheckCircle size={13} />
                          Saved to {config.label}s library
                        </div>
                      )}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    backgroundColor: isDark ? '#262626' : '#f0f0f0',
                    borderRadius: '14px 14px 14px 4px',
                    maxWidth: '80%',
                  }}
                >
                  <Loader2
                    size={15}
                    color={colors.primaryYellow}
                    style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
                  />
                  <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                    {statusMsg || `Generating your ${config.label.toLowerCase()}...`}
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
                  input.trim() && !isLoading ? colors.darkGray : colors.textMuted,
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
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: colors.textSecondary,
              marginTop: '6px',
              fontFamily: "'Quicksand', sans-serif",
            }}
          >
            Press Enter to generate · Content saves automatically to library
          </p>
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
