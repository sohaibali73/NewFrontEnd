'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Presentation, Clock, Trash2, Copy, Pencil, Download } from 'lucide-react';
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
  thumbnail?: string;
  downloadUrl?: string;
  presentationId?: string;
  filename?: string;
}

const STORAGE_KEY = 'potomac_slide_decks';

function loadDecks(): SlideDeck[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveDecks(decks: SlideDeck[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {}
}

export function SlideDecksTab({ colors, isDark }: SlideDecksTabProps) {
  const [decks, setDecks] = useState<SlideDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [showCreationChat, setShowCreationChat] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setDecks(loadDecks());
  }, []);

  // Persist whenever decks change
  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  const handleDelete = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    if (selectedDeck === id) setSelectedDeck(null);
  };

  const handleDuplicate = (deck: SlideDeck) => {
    const copy: SlideDeck = {
      ...deck,
      id: `deck-${Date.now()}`,
      title: `${deck.title} (Copy)`,
      updatedAt: 'just now',
      status: 'draft',
    };
    setDecks(prev => [copy, ...prev]);
  };

  const handleCreated = (newDeck: SlideDeck) => {
    setDecks(prev => [newDeck, ...prev]);
    setSelectedDeck(newDeck.id);
    setShowCreationChat(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Deck List Sidebar */}
      <div style={{
        width: '320px',
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.surface,
        flexShrink: 0,
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
          <button
            onClick={() => setShowCreationChat(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              backgroundColor: colors.primaryYellow,
              color: colors.darkGray,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '0.5px',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus size={18} />
            NEW SLIDE DECK
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {decks.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
              <Presentation size={32} style={{ opacity: 0.3, marginBottom: '8px' }} color={colors.textMuted} />
              <p style={{ margin: 0 }}>No slide decks yet.<br />Click "New Slide Deck" to create one.</p>
            </div>
          ) : (
            decks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => setSelectedDeck(deck.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: selectedDeck === deck.id ? (isDark ? '#2A2A2A' : '#eeeeee') : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  marginBottom: '4px',
                }}
              >
                <div style={{
                  width: '48px', height: '36px', borderRadius: '6px',
                  backgroundColor: isDark ? '#333333' : '#e0e0e0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Presentation size={18} color={colors.primaryYellow} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {deck.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                    <span>{deck.slideCount} slides</span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span style={{
                      color: deck.status === 'complete' ? colors.turquoise : colors.primaryYellow,
                      fontWeight: 600, textTransform: 'uppercase', fontSize: '11px',
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.3px',
                    }}>
                      {deck.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: colors.textSecondary }}>
                    <Clock size={11} />
                    {deck.updatedAt}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Deck Editor / Preview */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        {selectedDeck ? (() => {
          const deck = decks.find(d => d.id === selectedDeck);
          if (!deck) return null;
          return (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '18px',
                  color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0,
                }}>
                  {deck.title}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {deck.downloadUrl && (
                    <a
                      href={deck.downloadUrl}
                      download={deck.filename || 'presentation.pptx'}
                      style={{
                        padding: '8px 16px', backgroundColor: colors.primaryYellow,
                        color: colors.darkGray, border: 'none', borderRadius: '8px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        fontWeight: 700, fontSize: '13px', textDecoration: 'none',
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      <Download size={14} /> DOWNLOAD
                    </a>
                  )}
                  {[
                    { icon: Copy, label: 'Duplicate', onClick: () => handleDuplicate(deck) },
                    { icon: Trash2, label: 'Delete', onClick: () => handleDelete(deck.id) },
                  ].map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      style={{
                        padding: '8px', backgroundColor: 'transparent',
                        border: `1px solid ${colors.border}`, borderRadius: '8px',
                        color: colors.textMuted, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      title={label}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primaryYellow; e.currentTarget.style.color = colors.primaryYellow; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Slide Preview Grid */}
              <div style={{
                flex: 1, display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px', overflowY: 'auto', alignContent: 'start',
              }}>
                {Array.from({ length: deck.slideCount || 0 }).map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: '16/9', borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primaryYellow; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '11px', color: colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>
                      {i + 1}
                    </span>
                    <span style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: 500 }}>
                      Slide {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })() : (
          <div style={{ textAlign: 'center' }}>
            <Presentation size={48} color={colors.textSecondary} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px', color: colors.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Select a deck or create a new one
            </p>
          </div>
        )}
      </div>

      {showCreationChat && (
        <CreationChatModal
          colors={colors}
          isDark={isDark}
          contentType="slides"
          onClose={() => setShowCreationChat(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
