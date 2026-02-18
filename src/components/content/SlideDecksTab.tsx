'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Presentation, Clock, Trash2, Download, RefreshCw } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface SlideDecksTabProps {
  colors: Record<string, string>;
  isDark: boolean;
}

interface SlideDeck {
  id: string;
  title: string;
  slideCount: number;
  updatedAt: string;
  status: 'draft' | 'complete';
  topic: string;
}

const STORAGE_KEY = 'content_slide_decks';

const DEFAULT_DECKS: SlideDeck[] = [
  {
    id: 'deck-001',
    title: 'Q1 2026 Market Outlook',
    slideCount: 12,
    updatedAt: '2026-02-10T10:00:00Z',
    status: 'complete',
    topic: 'Equity markets, macro conditions, sector rotation strategy for Q1 2026',
  },
  {
    id: 'deck-002',
    title: 'AI Infrastructure Investment Thesis',
    slideCount: 15,
    updatedAt: '2026-02-12T14:30:00Z',
    status: 'complete',
    topic: 'Semiconductor, data center, and power infrastructure investment opportunity',
  },
  {
    id: 'deck-003',
    title: 'Portfolio Performance Review – Q4 2025',
    slideCount: 10,
    updatedAt: '2026-01-28T09:15:00Z',
    status: 'complete',
    topic: 'Client-facing portfolio attribution, benchmark comparison, forward outlook',
  },
  {
    id: 'deck-004',
    title: 'Fixed Income Strategy Update',
    slideCount: 8,
    updatedAt: '2026-02-05T16:00:00Z',
    status: 'draft',
    topic: 'Duration positioning, credit quality, yield curve scenarios',
  },
  {
    id: 'deck-005',
    title: 'ESG Integration Framework',
    slideCount: 11,
    updatedAt: '2026-01-20T11:00:00Z',
    status: 'complete',
    topic: 'Environmental, social, governance criteria embedded in investment process',
  },
];

function loadDecks(): SlideDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DECKS;
    return JSON.parse(raw) as SlideDeck[];
  } catch {
    return DEFAULT_DECKS;
  }
}

function saveDecks(decks: SlideDeck[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {}
}

function generateMockPptx(deck: SlideDeck): void {
  // Create a simple text file representing the PPTX outline
  const content = `POTOMAC ASSET MANAGEMENT — PRESENTATION OUTLINE
================================================
Title: ${deck.title}
Slides: ${deck.slideCount}
Generated: ${new Date().toLocaleString()}

SLIDE 1: Title Slide
- ${deck.title}
- Potomac Asset Management | ${new Date().getFullYear()}

SLIDE 2: Executive Summary
- Key themes and takeaways
- Investment implications

SLIDE 3: Market Context
- ${deck.topic}

SLIDE 4–${deck.slideCount - 2}: Analysis & Deep Dive
- Data-driven insights
- Charts and visual exhibits

SLIDE ${deck.slideCount - 1}: Risk Considerations
- Key risks to thesis
- Mitigating factors

SLIDE ${deck.slideCount}: Conclusion & Next Steps
- Summary of recommendations
- Action items

================================================
Potomac Asset Management | Confidential
`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.title.replace(/[^a-zA-Z0-9 ]/g, '')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SlideDecksTab({ colors, isDark }: SlideDecksTabProps) {
  const [decks, setDecks] = useState<SlideDeck[]>([]);
  const [showCreationChat, setShowCreationChat] = useState(false);

  useEffect(() => {
    setDecks(loadDecks());
  }, []);

  const handleDelete = (id: string) => {
    const updated = decks.filter((d) => d.id !== id);
    setDecks(updated);
    saveDecks(updated);
  };

  const handleCreated = (item: any) => {
    const newDeck: SlideDeck = {
      id: `deck-${Date.now()}`,
      title: item.title || 'New Presentation',
      slideCount: item.slideCount || 10,
      updatedAt: new Date().toISOString(),
      status: 'complete',
      topic: item.topic || item.title || '',
    };
    const updated = [newDeck, ...decks];
    setDecks(updated);
    saveDecks(updated);
    setShowCreationChat(false);
  };

  const handleRefresh = useCallback(() => {
    setDecks(loadDecks());
  }, []);

  const cardBorder = `1px solid ${colors.border}`;

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
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
            Slide Decks
          </h2>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0' }}>
            {decks.length} deck{decks.length !== 1 ? 's' : ''} · Saved locally
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
            <Plus size={15} /> NEW DECK
          </button>
        </div>
      </div>

      {/* Deck Grid */}
      {decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Presentation
            size={40}
            color={colors.border}
            style={{ margin: '0 auto 12px' }}
          />
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
            No slide decks yet
          </p>
          <p
            style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 16px' }}
          >
            Create your first AI-generated presentation
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
            CREATE FIRST DECK
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {decks.map((deck) => (
            <div
              key={deck.id}
              style={{
                backgroundColor: colors.cardBg,
                border: cardBorder,
                borderRadius: '12px',
                padding: '16px',
                position: 'relative',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = colors.primaryYellow + '60')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = colors.border)
              }
            >
              {/* Status badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '10px',
                  color: deck.status === 'complete' ? '#22c55e' : colors.primaryYellow,
                  backgroundColor:
                    deck.status === 'complete' ? '#22c55e15' : `${colors.primaryYellow}15`,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                {deck.status === 'complete' ? '✓ Ready' : '✎ Draft'}
              </div>

              <Presentation
                size={28}
                color={colors.primaryYellow}
                style={{ marginBottom: '10px' }}
              />
              <h3
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '14px',
                  color: colors.text,
                  margin: '0 0 4px',
                  letterSpacing: '0.5px',
                  lineHeight: 1.3,
                  paddingRight: '60px',
                }}
              >
                {deck.title}
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: colors.textMuted,
                  marginBottom: '8px',
                }}
              >
                <Clock size={11} />
                {new Date(deck.updatedAt).toLocaleDateString()}
                {` · ${deck.slideCount} slides`}
              </div>
              {deck.topic && (
                <p
                  style={{
                    fontSize: '11px',
                    color: colors.textSecondary,
                    margin: '0 0 14px',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {deck.topic}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => generateMockPptx(deck)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '7px',
                    backgroundColor: colors.primaryYellow,
                    border: 'none',
                    borderRadius: '7px',
                    color: colors.darkGray,
                    cursor: 'pointer',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.3px',
                  }}
                >
                  <Download size={12} /> DOWNLOAD
                </button>
                <button
                  onClick={() => handleDelete(deck.id)}
                  style={{
                    padding: '7px',
                    backgroundColor: 'transparent',
                    border: cardBorder,
                    borderRadius: '7px',
                    color: colors.textMuted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreationChat && (
        <CreationChatModal
          colors={colors}
          isDark={isDark}
          contentType="slides"
          onClose={() => setShowCreationChat(false)}
          onCreated={handleCreated}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
