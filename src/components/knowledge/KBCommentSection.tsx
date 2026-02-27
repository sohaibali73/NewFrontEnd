'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  userVote?: 'up' | 'down' | null;
}

interface KBCommentSectionProps {
  documentId: string;
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
}

export default function KBCommentSection({
  documentId,
  isDark,
  colors,
  isMobile,
}: KBCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'You',
      text: 'Great resource for understanding AFL syntax basics.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      likes: 2,
      dislikes: 0,
      userVote: null,
    },
  ]);
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    const comment: Comment = {
      id: `c_${Date.now()}`,
      author: 'You',
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      userVote: null,
    };
    setComments((prev) => [comment, ...prev]);
    setNewComment('');
    setSubmitting(false);
  };

  const handleVote = (commentId: string, vote: 'up' | 'down') => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const prevVote = c.userVote;
        let likes = c.likes;
        let dislikes = c.dislikes;

        // Undo previous vote
        if (prevVote === 'up') likes--;
        if (prevVote === 'down') dislikes--;

        // Apply new vote (toggle if same)
        const newVote = prevVote === vote ? null : vote;
        if (newVote === 'up') likes++;
        if (newVote === 'down') dislikes++;

        return { ...c, likes, dislikes, userVote: newVote };
      })
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header (Collapsible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: isMobile ? '16px' : '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderBottom: isExpanded ? `1px solid ${colors.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={16} color={colors.accent} />
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '1px',
              margin: 0,
            }}
          >
            COMMENTS
          </h3>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: `${colors.accent}14`,
              color: colors.accent,
              fontWeight: 600,
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            {comments.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} color={colors.textMuted} />
        ) : (
          <ChevronDown size={16} color={colors.textMuted} />
        )}
      </button>

      {isExpanded && (
        <>
          {/* New Comment Input */}
          <div
            style={{
              padding: isMobile ? '16px' : '20px 24px',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: `${colors.accent}14`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <User size={18} color={colors.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a note or comment..."
                  style={{
                    width: '100%',
                    minHeight: '72px',
                    padding: '12px',
                    backgroundColor: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    color: colors.text,
                    fontSize: '13px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmit();
                    }
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: colors.textMuted,
                    }}
                  >
                    {isMobile ? 'Tap send' : 'Ctrl+Enter to submit'}
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || submitting}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor:
                        !newComment.trim() || submitting
                          ? colors.border
                          : colors.accent,
                      color:
                        !newComment.trim() || submitting
                          ? colors.textMuted
                          : '#212121',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                      cursor:
                        !newComment.trim() || submitting
                          ? 'not-allowed'
                          : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {submitting ? (
                      <Loader2
                        size={14}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : (
                      <Send size={14} />
                    )}
                    POST
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div style={{ maxHeight: '320px', overflow: 'auto' }}>
            {comments.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: colors.textMuted,
                  fontSize: '13px',
                }}
              >
                No comments yet. Be the first to add one!
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: isMobile ? '14px 16px' : '16px 24px',
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <User size={14} color={colors.textMuted} />
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      {comment.author}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={10} />
                      {formatTimeAgo(comment.timestamp)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: isDark ? '#C8C8C8' : '#555',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      margin: '0 0 10px 38px',
                    }}
                  >
                    {comment.text}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginLeft: '38px',
                    }}
                  >
                    <button
                      onClick={() => handleVote(comment.id, 'up')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color:
                          comment.userVote === 'up'
                            ? '#22c55e'
                            : colors.textMuted,
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'color 0.2s',
                      }}
                    >
                      <ThumbsUp size={13} />
                      {comment.likes > 0 && comment.likes}
                    </button>
                    <button
                      onClick={() => handleVote(comment.id, 'down')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color:
                          comment.userVote === 'down'
                            ? '#DC2626'
                            : colors.textMuted,
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'color 0.2s',
                      }}
                    >
                      <ThumbsDown size={13} />
                      {comment.dislikes > 0 && comment.dislikes}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
