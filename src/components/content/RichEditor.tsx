'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2,
  Image, Table2, Eye, EyeOff, Keyboard,
  CheckCircle2,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  colors: Record<string, string>;
  isDark: boolean;
  onAutoSave?: () => void;
}

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: (textarea: HTMLTextAreaElement, content: string) => string;
}

function insertAround(
  textarea: HTMLTextAreaElement,
  content: string,
  before: string,
  after: string,
  placeholder: string
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.substring(start, end);
  const text = selectedText || placeholder;
  const newContent =
    content.substring(0, start) + before + text + after + content.substring(end);
  // Restore cursor position after React re-render
  setTimeout(() => {
    textarea.focus();
    const newCursorPos = selectedText
      ? start + before.length + selectedText.length + after.length
      : start + before.length;
    const newEnd = selectedText
      ? newCursorPos
      : newCursorPos + placeholder.length;
    textarea.setSelectionRange(newCursorPos, newEnd);
  }, 10);
  return newContent;
}

function insertAtLineStart(
  textarea: HTMLTextAreaElement,
  content: string,
  prefix: string
): string {
  const start = textarea.selectionStart;
  const lineStart = content.lastIndexOf('\n', start - 1) + 1;
  const newContent =
    content.substring(0, lineStart) + prefix + content.substring(lineStart);
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + prefix.length,
      start + prefix.length
    );
  }, 10);
  return newContent;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    icon: Bold,
    label: 'Bold',
    shortcut: 'Ctrl+B',
    action: (ta, c) => insertAround(ta, c, '**', '**', 'bold text'),
  },
  {
    icon: Italic,
    label: 'Italic',
    shortcut: 'Ctrl+I',
    action: (ta, c) => insertAround(ta, c, '*', '*', 'italic text'),
  },
  {
    icon: Heading1,
    label: 'Heading 1',
    action: (ta, c) => insertAtLineStart(ta, c, '# '),
  },
  {
    icon: Heading2,
    label: 'Heading 2',
    action: (ta, c) => insertAtLineStart(ta, c, '## '),
  },
  {
    icon: Heading3,
    label: 'Heading 3',
    action: (ta, c) => insertAtLineStart(ta, c, '### '),
  },
  {
    icon: List,
    label: 'Bullet List',
    action: (ta, c) => insertAtLineStart(ta, c, '- '),
  },
  {
    icon: ListOrdered,
    label: 'Numbered List',
    action: (ta, c) => insertAtLineStart(ta, c, '1. '),
  },
  {
    icon: Quote,
    label: 'Blockquote',
    action: (ta, c) => insertAtLineStart(ta, c, '> '),
  },
  {
    icon: Code,
    label: 'Code Block',
    action: (ta, c) => insertAround(ta, c, '```\n', '\n```', 'code'),
  },
  {
    icon: Link2,
    label: 'Link',
    action: (ta, c) => insertAround(ta, c, '[', '](url)', 'link text'),
  },
  {
    icon: Image,
    label: 'Image',
    action: (ta, c) => insertAround(ta, c, '![', '](url)', 'alt text'),
  },
  {
    icon: Table2,
    label: 'Table',
    action: (ta, c) => {
      const table =
        '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n';
      const start = ta.selectionStart;
      const newContent =
        c.substring(0, start) + table + c.substring(start);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(
          start + table.length,
          start + table.length
        );
      }, 10);
      return newContent;
    },
  },
];

export function RichEditor({
  content,
  onChange,
  colors,
  isDark,
  onAutoSave,
}: RichEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const charCount = content ? content.length : 0;

  // Auto-save logic
  useEffect(() => {
    if (!onAutoSave) return;
    setAutoSaveStatus('unsaved');

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaveStatus('saving');
      onAutoSave();
      setTimeout(() => setAutoSaveStatus('saved'), 500);
    }, 30000); // Auto-save every 30 seconds of inactivity

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [content, onAutoSave]);

  const handleToolbarAction = useCallback(
    (action: ToolbarAction) => {
      if (!textareaRef.current) return;
      const newContent = action.action(textareaRef.current, content);
      onChange(newContent);
    },
    [content, onChange]
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        handleToolbarAction(TOOLBAR_ACTIONS[0]); // Bold
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        handleToolbarAction(TOOLBAR_ACTIONS[1]); // Italic
      }
    },
    [handleToolbarAction]
  );

  const border = `1px solid ${colors.borderSubtle}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '10px',
        border,
        overflow: 'hidden',
        backgroundColor: colors.inputBg,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '6px 10px',
          borderBottom: border,
          backgroundColor: isDark ? '#1E1E1E' : '#f4f4f4',
          flexWrap: 'wrap',
        }}
      >
        {TOOLBAR_ACTIONS.map((action, index) => {
          const ActionIcon = action.icon;
          return (
            <React.Fragment key={action.label}>
              {/* Separators after Italic, H3, Ordered List, Quote */}
              {(index === 2 || index === 5 || index === 8 || index === 9) && (
                <div
                  style={{
                    width: '1px',
                    height: '18px',
                    backgroundColor: colors.borderSubtle,
                    margin: '0 4px',
                  }}
                />
              )}
              <button
                onClick={() => handleToolbarAction(action)}
                title={
                  action.shortcut
                    ? `${action.label} (${action.shortcut})`
                    : action.label
                }
                style={{
                  padding: '5px 7px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '5px',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)';
                  e.currentTarget.style.color = colors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.textMuted;
                }}
              >
                <ActionIcon size={15} />
              </button>
            </React.Fragment>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Keyboard shortcuts toggle */}
          <button
            onClick={() => setShowShortcuts((p) => !p)}
            title="Keyboard Shortcuts"
            style={{
              padding: '5px 7px',
              background: 'none',
              border: 'none',
              borderRadius: '5px',
              color: showShortcuts ? colors.primaryYellow : colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Keyboard size={15} />
          </button>

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview((p) => !p)}
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
            style={{
              padding: '5px 7px',
              background: showPreview ? `${colors.primaryYellow}18` : 'none',
              border: showPreview
                ? `1px solid ${colors.primaryYellow}40`
                : 'none',
              borderRadius: '5px',
              color: showPreview ? colors.primaryYellow : colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'EDIT' : 'PREVIEW'}
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {showShortcuts && (
        <div
          style={{
            padding: '8px 14px',
            borderBottom: border,
            backgroundColor: isDark ? 'rgba(254,192,15,0.04)' : 'rgba(254,192,15,0.06)',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            fontSize: '11px',
            fontFamily: "'Quicksand', sans-serif",
            color: colors.textSecondary,
          }}
        >
          {[
            { keys: 'Ctrl+B', desc: 'Bold' },
            { keys: 'Ctrl+I', desc: 'Italic' },
            { keys: '# text', desc: 'Heading' },
            { keys: '- text', desc: 'List' },
            { keys: '> text', desc: 'Quote' },
            { keys: '```code```', desc: 'Code' },
          ].map(({ keys, desc }) => (
            <span key={keys} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd
                style={{
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  backgroundColor: isDark ? '#333' : '#ddd',
                  border: `1px solid ${colors.borderSubtle}`,
                }}
              >
                {keys}
              </kbd>
              {desc}
            </span>
          ))}
        </div>
      )}

      {/* Editor / Preview area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {showPreview ? (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              fontFamily: "'Quicksand', sans-serif",
              lineHeight: 1.7,
            }}
          >
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p style={{ color: colors.textSecondary, fontSize: '13px' }}>
                Nothing to preview. Start writing to see the rendered output.
              </p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing... Use the toolbar above for formatting or type Markdown directly."
            style={{
              flex: 1,
              width: '100%',
              padding: '16px 20px',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: colors.text,
              fontSize: '13px',
              fontFamily: "'Quicksand', sans-serif",
              lineHeight: 1.7,
              resize: 'none',
            }}
          />
        )}
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          borderTop: border,
          backgroundColor: isDark ? '#1E1E1E' : '#f4f4f4',
          fontSize: '10px',
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          color: colors.textSecondary,
          letterSpacing: '0.3px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{wordCount.toLocaleString()} words</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span>{Math.ceil(wordCount / 200)} min read</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {autoSaveStatus === 'saved' && (
            <>
              <CheckCircle2 size={10} color={colors.turquoise || '#00DED1'} />
              <span style={{ color: colors.turquoise || '#00DED1' }}>SAVED</span>
            </>
          )}
          {autoSaveStatus === 'unsaved' && (
            <span style={{ color: colors.primaryYellow }}>UNSAVED CHANGES</span>
          )}
          {autoSaveStatus === 'saving' && (
            <span style={{ color: colors.primaryYellow }}>SAVING...</span>
          )}
        </div>
      </div>
    </div>
  );
}
