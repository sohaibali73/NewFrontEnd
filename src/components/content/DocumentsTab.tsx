'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  File,
  Clock,
  Trash2,
  Pencil,
  RefreshCw,
  X,
  Save,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface DocumentsTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface Document {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'complete' | 'published';
  type: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'content_documents';

const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    title: 'Q4 2025 Client Portfolio Report — Acme Capital',
    type: 'Quarterly Report',
    content: `POTOMAC ASSET MANAGEMENT
Q4 2025 PORTFOLIO REVIEW — ACME CAPITAL
Prepared: January 15, 2026 | Confidential

EXECUTIVE SUMMARY
─────────────────
Your portfolio delivered a total return of +12.4% in Q4 2025, outperforming the blended benchmark (60/40) by 320 basis points. Strong equity selection in technology and disciplined risk management during November's volatility spike were the primary contributors.

PORTFOLIO PERFORMANCE
──────────────────────
Asset Class         Q4 Return   YTD Return   Benchmark
Equities (65%)      +16.2%      +28.4%       +22.1%
Fixed Income (25%)  +4.1%       +7.8%        +6.2%
Alternatives (7%)   +8.3%       +11.2%       +9.0%
Cash (3%)           +1.3%       +5.1%        +5.3%
─────────────────────────────────────────────────────
TOTAL PORTFOLIO     +12.4%      +22.8%       +19.6%

TOP HOLDINGS
─────────────
1. NVDA — 8.2% of equity sleeve (+41% in Q4)
2. MSFT — 7.1% (+18%)
3. AMZN — 5.9% (+22%)
4. BRK.B — 4.8% (+12%)
5. UNH — 4.1% (+6%)

FIXED INCOME POSITIONING
─────────────────────────
Duration: 4.2 years (benchmark: 5.8 years)
Credit Quality: 78% IG / 22% HY
Average Yield: 5.4%

FORWARD OUTLOOK
───────────────
We maintain a constructive outlook for 2026 with a focus on quality over speculative growth. Key themes: AI infrastructure, energy transition, and selective EM exposure in India and Southeast Asia.

Risks to monitor: Fed policy path, geopolitical escalation, commercial real estate stress.

NEXT REVIEW: April 15, 2026

Potomac Asset Management | 1234 K Street NW | Washington, DC 20005
Past performance is not indicative of future results.`,
    status: 'complete',
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 'doc-002',
    title: 'Due Diligence Brief — Quantum Robotics Series B',
    type: 'Due Diligence',
    content: `INVESTMENT DUE DILIGENCE BRIEF
Quantum Robotics Inc. | Series B Investment
Date: February 3, 2026 | CONFIDENTIAL

COMPANY OVERVIEW
────────────────
Quantum Robotics Inc. is a developer of autonomous warehouse logistics systems. Founded 2021, headquartered in Pittsburgh, PA. The company has deployed 340 autonomous mobile robots (AMRs) across 12 distribution centers.

FINANCIAL SUMMARY
─────────────────
Revenue (2025A):    $14.2M  (+187% YoY)
ARR (Feb 2026):     $18.7M
Gross Margin:       68%
Monthly Burn Rate:  $1.1M
Runway (post-B):    ~28 months

SERIES B TERMS
──────────────
Raise:              $40M
Pre-money Val:      $120M
Lead Investor:      Sequoia Capital
Our Allocation:     $5M (12.5% of round)
Pro-rata Rights:    Yes (up to 2x)
Liquidation Pref:   1x non-participating

COMPETITIVE LANDSCAPE
─────────────────────
Key Competitors: 6 River Systems (acquired by Shopify), Locus Robotics, Fetch Robotics
Differentiation: Proprietary SLAM algorithm delivers 40% better throughput per sq ft vs. nearest competitor; no fixed infrastructure required.

CUSTOMER REFERENCES
───────────────────
• Amazon Logistics — 3 sites (renewal at 140% NRR)
• Target Distribution — 2 sites (in contract negotiations for 5 additional)
• FedEx Supply Chain — Pilot (1 site, converting to full deployment Q2 2026)

KEY RISKS
─────────
1. Customer concentration: Top 2 customers = 61% of revenue
2. Supply chain: LIDAR chip sourcing from single Tier-2 supplier
3. Technical: Battery cycle life under heavy-use conditions (<18 months) requires hardware refresh program
4. Competitive: Amazon Robotics has significant internal capability

RECOMMENDATION
──────────────
INVEST — with allocation of $5M as proposed. Risk-adjusted return profile is attractive given strong NRR, clear path to profitability at $35M ARR, and strategic moat in SLAM technology.

Key conditions: (1) Co-sale rights, (2) Board observer seat, (3) Standard information rights.

Prepared by: Research Team, Potomac Asset Management`,
    status: 'complete',
    created_at: '2026-02-03T11:00:00Z',
    updated_at: '2026-02-04T16:30:00Z',
  },
  {
    id: 'doc-003',
    title: 'Investment Committee Memo — Q1 2026 Rebalance',
    type: 'IC Memo',
    content: `INVESTMENT COMMITTEE MEMORANDUM
Quarterly Portfolio Rebalance Proposal
Q1 2026 | February 18, 2026

TO: Investment Committee
FROM: Portfolio Management Team
RE: Q1 2026 Rebalancing Actions

PROPOSED CHANGES
────────────────

EQUITIES — Net +2% (65% → 67%)
  ADD:    Utilities sector +1.5% (power demand secular tailwind from AI)
  ADD:    India ETF +1.0% (structural growth, rate decoupling)
  REDUCE: Consumer Discretionary -0.5% (earnings risk at current valuations)

FIXED INCOME — Net -2% (25% → 23%)
  REDUCE: Long-duration Treasuries -3% (rate risk asymmetric to upside)
  ADD:    Short-duration IG Credit +1% (carry with limited duration risk)

ALTERNATIVES — Unchanged at 7%
  Maintain current allocation to hedge funds and real assets.
  Next review of alternatives allocation scheduled for Q3 2026.

CASH — Net flat at 3%
  Maintain cash for tactical deployment on volatility-driven opportunities.

RATIONALE
─────────
(1) AI-driven power demand creates structural support for utility earnings growth
(2) India's 7%+ GDP growth and digital transformation underpin multi-year equity performance
(3) Duration reduction reduces portfolio sensitivity to upside rate surprises
(4) Consumer discretionary multiples (28x fwd P/E) assume a soft landing that is not yet confirmed

IMPLEMENTATION TIMELINE
───────────────────────
Date:        February 25, 2026
Method:      Systematic rebalance across all discretionary accounts
Tax-loss:    Harvest where applicable in taxable accounts
Transition:  Minimize market impact via VWAP execution

VOTE REQUIRED
─────────────
This memo requires a majority vote from the Investment Committee to proceed.
Scheduled Committee Call: February 20, 2026 at 10:00 AM ET

Potomac Asset Management | Investment Committee | Confidential`,
    status: 'draft',
    created_at: '2026-02-18T09:00:00Z',
    updated_at: '2026-02-18T09:00:00Z',
  },
  {
    id: 'doc-004',
    title: 'Client Onboarding Memo — Greenfield Family Office',
    type: 'Onboarding',
    content: `CLIENT ONBOARDING MEMORANDUM
New Client: Greenfield Family Office
AUM Onboarded: $22.5M | Date: February 10, 2026

CLIENT PROFILE
──────────────
Name: Greenfield Family Office
Primary Contact: Sarah Greenfield, CIO
Legal Entity: Greenfield Trust Holdings LLC (Delaware)
Tax Status: Non-taxable entity (Trust)
Investment Horizon: 10+ years
Risk Tolerance: Moderate-Aggressive

INVESTMENT POLICY STATEMENT SUMMARY
────────────────────────────────────
Target Allocation:
  Public Equities:        55%
  Private Equity/Venture: 20%
  Fixed Income:           15%
  Real Assets:            7%
  Cash:                   3%

Return Objective: CPI + 500 bps net of fees
Liquidity Requirement: $500K available within 30 days at all times
ESG Overlay: Exclude tobacco, weapons, private prisons

EXCLUDED SECURITIES
───────────────────
Per client instruction: Altria, Philip Morris, Lockheed Martin, GEO Group

FEE STRUCTURE
─────────────
Management Fee: 0.75% on AUM up to $50M, 0.60% above
Performance Fee: 10% above 8% hurdle (public equity sleeve only)
Reporting: Monthly performance reports, Quarterly full reports, Annual tax packages

INITIAL POSITIONING
───────────────────
Pending IC approval, initial equity allocation will focus on:
- Quality growth stocks (40% of equity sleeve)
- Dividend growth (25%)
- International exposure: developed markets (20%), emerging markets (15%)

Fixed income: Short-intermediate IG credit, no HY initially.

NEXT STEPS
──────────
[ ] Complete KYC documentation
[ ] Execute investment management agreement
[ ] Fund transfer from Goldman Sachs custody
[ ] Initial investment deployment by March 1, 2026
[ ] Onboarding call scheduled: February 22, 2026

Prepared by: Client Services Team, Potomac Asset Management`,
    status: 'complete',
    created_at: '2026-02-10T14:00:00Z',
    updated_at: '2026-02-10T14:00:00Z',
  },
];

function loadDocuments(): Document[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DOCUMENTS;
    return JSON.parse(raw) as Document[];
  } catch {
    return DEFAULT_DOCUMENTS;
  }
}

function saveDocuments(docs: Document[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {}
}

function downloadDocument(doc: Document) {
  const blob = new Blob([doc.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DocumentsTab({ colors, isDark }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showCreationChat, setShowCreationChat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setDocuments(loadDocuments());
  }, []);

  const handleDelete = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    saveDocuments(updated);
  };

  const handleRename = (id: string) => {
    if (!editTitle.trim()) return;
    const updated = documents.map((d) =>
      d.id === id
        ? { ...d, title: editTitle.trim(), updated_at: new Date().toISOString() }
        : d
    );
    setDocuments(updated);
    saveDocuments(updated);
    setEditingId(null);
  };

  const handleCreated = (item: any) => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: item.title || `New Document — ${new Date().toLocaleDateString()}`,
      content: item.content || '',
      type: item.type || 'Document',
      status: 'complete',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveDocuments(updated);
    setShowCreationChat(false);
    setExpandedId(newDoc.id);
  };

  const handleRefresh = useCallback(() => {
    setDocuments(loadDocuments());
  }, []);

  const cardBorder = `1px solid ${colors.border}`;
  const statusColor: Record<string, string> = {
    draft: colors.primaryYellow,
    complete: '#22c55e',
    published: colors.turquoise,
  };
  const typeBg: Record<string, string> = {
    'Quarterly Report': '#6366f115',
    'Due Diligence': '#f59e0b15',
    'IC Memo': '#3b82f615',
    Onboarding: '#22c55e15',
    Document: `${colors.border}`,
  };
  const typeColor: Record<string, string> = {
    'Quarterly Report': '#6366f1',
    'Due Diligence': '#f59e0b',
    'IC Memo': '#3b82f6',
    Onboarding: '#22c55e',
    Document: colors.textMuted,
  };

  return (
    <div
      style={{
        padding: '24px',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '18px',
              color: colors.text,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Documents
          </h2>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0' }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} · Saved
            locally
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: cardBorder,
              borderRadius: '8px',
              color: colors.textMuted,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowCreationChat(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: colors.primaryYellow,
              border: 'none',
              borderRadius: '8px',
              color: colors.darkGray,
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.5px',
            }}
          >
            <Plus size={15} /> NEW DOCUMENT
          </button>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <File size={40} color={colors.border} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
            No documents yet
          </p>
          <p
            style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 16px' }}
          >
            Draft your first document with AI
          </p>
          <button
            onClick={() => setShowCreationChat(true)}
            style={{
              padding: '8px 20px',
              backgroundColor: colors.primaryYellow,
              border: 'none',
              borderRadius: '8px',
              color: colors.darkGray,
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            CREATE FIRST DOCUMENT
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                backgroundColor: colors.cardBg,
                border: cardBorder,
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = colors.primaryYellow + '50')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = colors.border)
              }
            >
              {/* Row */}
              <div
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <File
                  size={20}
                  color={colors.primaryYellow}
                  style={{ flexShrink: 0 }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === doc.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(doc.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: `1px solid ${colors.primaryYellow}`,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: colors.text,
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleRename(doc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: colors.primaryYellow,
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: colors.textMuted,
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontFamily: "'Quicksand', sans-serif",
                        fontWeight: 600,
                        fontSize: '13px',
                        color: colors.text,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        setExpandedId(expandedId === doc.id ? null : doc.id)
                      }
                    >
                      {doc.title}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '3px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Clock size={10} color={colors.textMuted} />
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: statusColor[doc.status] || colors.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      · {doc.status}
                    </span>
                    {doc.type && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: typeColor[doc.type] || colors.textMuted,
                          backgroundColor: typeBg[doc.type] || 'transparent',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 600,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {doc.type}
                      </span>
                    )}
                    {doc.content && (
                      <span style={{ fontSize: '10px', color: colors.textMuted }}>
                        · {Math.ceil(doc.content.split(' ').length / 200)} min read
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    flexShrink: 0,
                    alignItems: 'center',
                  }}
                >
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === doc.id ? null : doc.id)
                    }
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      border: cardBorder,
                      borderRadius: '6px',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={expandedId === doc.id ? 'Collapse' : 'Expand'}
                  >
                    {expandedId === doc.id ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </button>
                  {doc.content && (
                    <button
                      onClick={() => downloadDocument(doc)}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        border: cardBorder,
                        borderRadius: '6px',
                        color: colors.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.primaryYellow;
                        e.currentTarget.style.color = colors.primaryYellow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.color = colors.textMuted;
                      }}
                      title="Download"
                    >
                      <Download size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingId(doc.id);
                      setEditTitle(doc.title);
                    }}
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      border: cardBorder,
                      borderRadius: '6px',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primaryYellow;
                      e.currentTarget.style.color = colors.primaryYellow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      border: cardBorder,
                      borderRadius: '6px',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
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
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === doc.id && doc.content && (
                <div
                  style={{
                    borderTop: cardBorder,
                    padding: '16px 20px',
                    backgroundColor: isDark ? '#161616' : '#f5f5f5',
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: colors.text,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                      maxHeight: '420px',
                      overflowY: 'auto',
                    }}
                  >
                    {doc.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreationChat && (
        <CreationChatModal
          colors={colors}
          isDark={isDark}
          contentType="documents"
          onClose={() => setShowCreationChat(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
