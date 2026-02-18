'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  BookOpen,
  Clock,
  Trash2,
  Pencil,
  RefreshCw,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface ArticlesTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'complete' | 'published';
  tags: string[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'content_articles';

const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'art-001',
    title: 'The Case for AI Infrastructure: A Multi-Decade Opportunity',
    content: `The secular shift toward artificial intelligence represents one of the most significant infrastructure buildouts in modern history. From semiconductor fabrication to data center construction and power generation, the capex cycle is accelerating across every layer of the stack.

Semiconductor manufacturers are racing to meet insatiable GPU demand, with NVIDIA's data center segment growing over 400% year-over-year. The bottleneck has shifted from chip design to manufacturing capacity and advanced packaging.

Data center operators are signing multi-billion dollar leases with hyperscalers, driving occupancy rates to historic highs. Power infrastructure is emerging as the critical constraint — AI training runs consume 10 to 100 times more electricity than traditional workloads.

For investors, the opportunity spans three distinct tiers: direct beneficiaries (chip designers, memory manufacturers), enabling infrastructure (power utilities, network equipment), and application layer plays (enterprise software, cloud platforms).

Risk factors include valuation compression if AI capex cycles disappoint, regulatory headwinds on chip exports, and the ever-present possibility of a "Jevons paradox" where efficiency gains accelerate rather than reduce consumption.

Our base case: overweight AI infrastructure on a 2–3 year horizon with a focus on quality and cash flow generation over speculative growth names.`,
    status: 'published',
    tags: ['AI', 'Technology', 'Infrastructure'],
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-10T14:00:00Z',
  },
  {
    id: 'art-002',
    title: 'Sector Rotation in a Higher-for-Longer Rate Environment',
    content: `The Federal Reserve's commitment to keeping rates elevated has profound implications for sector allocation. Traditional playbooks — piling into duration and growth when rates peak — may not apply in this cycle.

Financials benefit from net interest margin expansion, though credit quality bears watching. Regional banks remain under pressure from commercial real estate exposure and deposit competition from money market funds.

Energy continues to offer a compelling free cash flow story with disciplined capital returns. The transition to renewables creates a long tail of investment in both legacy infrastructure and next-generation capacity.

Healthcare provides defensive characteristics with less sensitivity to the rate cycle, though biosimilar competition and drug pricing policy create stock-specific risks. Select medtech names offer an attractive combination of pricing power and secular demand.

Utilities, traditionally a bond proxy, are experiencing a renaissance driven by AI-related power demand. This structural tailwind changes the growth narrative for a sector previously dismissed as purely defensive.

We favor a barbell approach: overweight quality cyclicals with pricing power and underweight pure interest-rate-sensitive sectors until the rate trajectory clarifies.`,
    status: 'complete',
    tags: ['Macro', 'Sectors', 'Fixed Income'],
    created_at: '2026-01-25T09:00:00Z',
    updated_at: '2026-02-05T11:30:00Z',
  },
  {
    id: 'art-003',
    title: 'Emerging Markets: Selective Opportunities Amid Dollar Strength',
    content: `Broad EM exposure has underperformed in the current dollar strength regime, but dispersion across countries and sectors creates compelling stock-picking opportunities for active managers.

India stands out as a structural winner — demographics, digitalization, and domestic consumption provide a multi-decade growth engine largely decoupled from the global rate cycle. The Nifty 50 has compounded at over 14% annually in local currency terms over the past decade.

Southeast Asia benefits from supply chain diversification away from China, with Vietnam and Indonesia attracting significant manufacturing FDI. Infrastructure development and a rising middle class amplify the consumer opportunity.

China remains a tactical wild card. Stimulus measures have been underwhelming relative to the scale of the property sector downturn. We prefer a neutral weight with selective exposure to domestically-focused consumer names over export-dependent manufacturers.

Latin America offers high real yields but requires careful navigation of political and currency risk. Brazil's fiscal trajectory and Mexico's nearshoring momentum are key differentiation factors.

Bottom line: think EM country-by-country rather than as an asset class. The era of passive EM beta is over; alpha requires genuine ground-level research.`,
    status: 'draft',
    tags: ['Emerging Markets', 'Global', 'Currency'],
    created_at: '2026-02-08T15:00:00Z',
    updated_at: '2026-02-08T15:00:00Z',
  },
  {
    id: 'art-004',
    title: 'Credit Markets: Navigating the Dispersion Cycle',
    content: `Investment grade and high yield spreads have compressed to near-cycle tights, raising questions about whether credit markets are pricing in an overly benign scenario. The answer, as usual, lies beneath the surface.

IG spreads at 90–100 bps offer limited cushion against rate volatility but benefit from strong corporate balance sheets and a technical bid from insurance companies and pension funds rebalancing into credit.

HY presents a more nuanced picture. CCC-rated paper trades at elevated spreads reflecting genuine fundamental stress, while BB and single-B issuers have benefited from the soft landing narrative. Dispersion between quality tiers is near decade highs — a credit picker's environment.

Leveraged loans offer floating rate protection but face headwinds from slowing new issuance and rising payment-in-kind activity among the weakest borrowers. Default rates are climbing toward historical norms after an extended period of suppression.

Private credit has absorbed significant institutional capital, potentially creating crowded positioning in middle market lending. Covenant quality has deteriorated, and repricing risk in a downturn could be substantial.

Our positioning: overweight high quality IG, selective in HY with emphasis on BB-rated issuers, underweight CCC, and cautious on private credit at current risk-adjusted yields.`,
    status: 'complete',
    tags: ['Credit', 'Fixed Income', 'High Yield'],
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
];

function loadArticles(): Article[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ARTICLES;
    return JSON.parse(raw) as Article[];
  } catch {
    return DEFAULT_ARTICLES;
  }
}

function saveArticles(articles: Article[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch {}
}

function downloadArticle(article: Article) {
  const content = `${article.title}\n${'='.repeat(article.title.length)}\n\nTags: ${article.tags.join(', ')}\nDate: ${new Date(article.updated_at).toLocaleDateString()}\nStatus: ${article.status}\n\n${article.content}\n\n---\nPotomac Asset Management | Confidential\n`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${article.title.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ArticlesTab({ colors, isDark }: ArticlesTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [showCreationChat, setShowCreationChat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setArticles(loadArticles());
  }, []);

  const handleDelete = (id: string) => {
    const updated = articles.filter((a) => a.id !== id);
    setArticles(updated);
    saveArticles(updated);
  };

  const handleRename = (id: string) => {
    if (!editTitle.trim()) return;
    const updated = articles.map((a) =>
      a.id === id
        ? { ...a, title: editTitle.trim(), updated_at: new Date().toISOString() }
        : a
    );
    setArticles(updated);
    saveArticles(updated);
    setEditingId(null);
  };

  const handleCreated = (item: any) => {
    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title: item.title || `New Article — ${new Date().toLocaleDateString()}`,
      content: item.content || '',
      status: 'complete',
      tags: item.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newArticle, ...articles];
    setArticles(updated);
    saveArticles(updated);
    setShowCreationChat(false);
    setExpandedId(newArticle.id);
  };

  const handleRefresh = useCallback(() => {
    setArticles(loadArticles());
  }, []);

  const cardBorder = `1px solid ${colors.border}`;
  const statusColor: Record<string, string> = {
    draft: colors.textMuted,
    complete: '#22c55e',
    published: colors.primaryYellow,
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
            Articles
          </h2>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0' }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''} · Saved
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
            <Plus size={15} /> NEW ARTICLE
          </button>
        </div>
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BookOpen
            size={40}
            color={colors.border}
            style={{ margin: '0 auto 12px' }}
          />
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
            No articles yet
          </p>
          <p
            style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 16px' }}
          >
            Generate your first article with AI
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
            WRITE FIRST ARTICLE
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {articles.map((article) => (
            <div
              key={article.id}
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
                <BookOpen
                  size={20}
                  color={colors.primaryYellow}
                  style={{ flexShrink: 0 }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === article.id ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(article.id);
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
                        onClick={() => handleRename(article.id)}
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
                        setExpandedId(expandedId === article.id ? null : article.id)
                      }
                    >
                      {article.title}
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
                      {new Date(article.updated_at).toLocaleDateString()}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: statusColor[article.status] || colors.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      · {article.status}
                    </span>
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '10px',
                          color: colors.turquoise,
                          backgroundColor: `${colors.turquoise}15`,
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {article.content && (
                      <span style={{ fontSize: '10px', color: colors.textMuted }}>
                        · {Math.ceil(article.content.split(' ').length / 200)} min read
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === article.id ? null : article.id)
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
                    title={expandedId === article.id ? 'Collapse' : 'Expand'}
                  >
                    {expandedId === article.id ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </button>
                  {article.content && (
                    <button
                      onClick={() => downloadArticle(article)}
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
                      setEditingId(article.id);
                      setEditTitle(article.title);
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
                    onClick={() => handleDelete(article.id)}
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

              {/* Expanded Content */}
              {expandedId === article.id && article.content && (
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
                      fontSize: '13px',
                      color: colors.text,
                      fontFamily: "'Quicksand', sans-serif",
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.8,
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                  >
                    {article.content}
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
          contentType="articles"
          onClose={() => setShowCreationChat(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
