'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, MessageSquare, Paperclip, Trash2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Pencil, X, Wifi, WifiOff, CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { Conversation as ConversationType } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { ArtifactRenderer } from '@/components/artifacts';

// AI Elements - Composable Components
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Tool as AITool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Conversation as AIConversation, ConversationContent, ConversationScrollButton, ConversationEmptyState } from '@/components/ai-elements/conversation';
import { Message as AIMessage, MessageContent, MessageActions, MessageAction, MessageResponse, MessageToolbar } from '@/components/ai-elements/message';
import { CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockActions, CodeBlockCopyButton, CodeBlockContent } from '@/components/ai-elements/code-block';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputHeader, PromptInputTools, PromptInputButton, PromptInputSubmit, usePromptInputAttachments, PromptInputActionMenu, PromptInputActionMenuTrigger, PromptInputActionMenuContent, PromptInputActionMenuContent as MenuContent, PromptInputActionAddAttachments } from '@/components/ai-elements/prompt-input';
import { Attachments, Attachment, AttachmentPreview, AttachmentInfo, AttachmentRemove } from '@/components/ai-elements/attachments';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactContent, ArtifactActions, ArtifactAction } from '@/components/ai-elements/artifact';
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
import { SpeechInput } from '@/components/ai-elements/speech-input';
import { WebPreview, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewBody, WebPreviewConsole } from '@/components/ai-elements/web-preview';
import {
  StockCard,
  LiveStockChart,
  TechnicalAnalysis,
  WeatherCard,
  NewsHeadlines,
  CodeSandbox,
  DataChart,
  CodeExecution,
  KnowledgeBaseResults,
  AFLGenerateCard,
  AFLValidateCard,
  AFLDebugCard,
  AFLExplainCard,
  AFLSanityCheckCard,
  WebSearchResults,
  ToolLoading,
} from '@/components/generative-ui';

const logo = '/yellowlogo.png';

// Component to display file attachments inside PromptInput
function AttachmentsDisplay() {
  const attachments = usePromptInputAttachments();
  
  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <PromptInputHeader>
      <Attachments variant="grid">
        {attachments.files.map((file) => (
          <Attachment key={file.id} data={file} onRemove={() => attachments.remove(file.id)}>
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  );
}

// Simple attachment button that opens file dialog
function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  
  return (
    <PromptInputButton
      tooltip="Attach files"
      onClick={() => attachments.openFileDialog()}
      disabled={disabled}
    >
      <Paperclip className="size-4" />
    </PromptInputButton>
  );
}

export function ChatPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [pageError, setPageError] = useState('');
  const [historicalMessages, setHistoricalMessages] = useState<any[]>([]);
  
  // Local input state - per the v5 docs pattern
  const [input, setInput] = useState('');

  // Conversation search & rename state
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Connection status
  const { status: connStatus, check: recheckConnection } = useConnectionStatus({ interval: 60000 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Ref to track current conversationId synchronously (avoids stale state in body callback)
  const conversationIdRef = useRef<string | null>(null);

  // ===== Message Parts Cache =====
  // Cache completed message parts (including tool outputs) in localStorage
  // so they survive page navigation and reload
  const saveMessagePartsToCache = (messageId: string, parts: any[]) => {
    try {
      const cacheKey = 'msg_parts_cache';
      const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      cache[messageId] = parts;
      // Keep cache under 200 entries to prevent unlimited growth
      const keys = Object.keys(cache);
      if (keys.length > 200) {
        keys.slice(0, keys.length - 200).forEach(k => delete cache[k]);
      }
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch { /* Silently fail */ }
  };

  const getMessagePartsFromCache = (messageId: string): any[] | null => {
    try {
      const cache = JSON.parse(localStorage.getItem('msg_parts_cache') || '{}');
      return cache[messageId] || null;
    } catch { return null; }
  };

  // Reconstruct message parts from backend data (tools_used, metadata, artifacts)
  const reconstructParts = (m: any): any[] => {
    // Gather tools_used from all possible locations
    const toolsUsed = m.metadata?.tools_used || m.tools_used || [];

    // 1. If metadata.parts exists (backend stored full parts), merge with tools_used
    if (m.metadata?.parts && Array.isArray(m.metadata.parts) && m.metadata.parts.length > 0) {
      const storedParts = [...m.metadata.parts];

      // Check if tool parts are already present in stored parts
      const hasToolParts = storedParts.some((p: any) => p.type?.startsWith('tool-') && p.state === 'output-available');

      // If tools were used but not in stored parts, prepend them
      if (!hasToolParts && Array.isArray(toolsUsed) && toolsUsed.length > 0) {
        const toolParts = toolsUsed.map((tool: any) => {
          const toolName = tool.tool || tool.toolName || 'unknown';
          return {
            type: `tool-${toolName}`,
            state: 'output-available',
            input: tool.input || tool.args || {},
            output: tool.result || tool.output || tool.result_data || {},
          };
        });
        return [...toolParts, ...storedParts];
      }

      return storedParts;
    }

    // 2. Check local cache for this message's parts
    const cachedParts = getMessagePartsFromCache(m.id);
    if (cachedParts && cachedParts.length > 0) {
      return cachedParts;
    }

    // 3. Reconstruct from tools_used + content
    const parts: any[] = [];

    // Add tool parts from tools_used array
    if (Array.isArray(toolsUsed) && toolsUsed.length > 0) {
      for (const tool of toolsUsed) {
        const toolName = tool.tool || tool.toolName || 'unknown';
        parts.push({
          type: `tool-${toolName}`,
          state: 'output-available',
          input: tool.input || tool.args || {},
          output: tool.result || tool.output || tool.result_data || {},
        });
      }
    }

    // Add artifact parts
    if (m.artifacts && Array.isArray(m.artifacts) && m.artifacts.length > 0) {
      for (const artifact of m.artifacts) {
        parts.push({
          type: `data-${artifact.type || 'code'}`,
          data: artifact,
        });
      }
    } else if (m.metadata?.artifacts && Array.isArray(m.metadata.artifacts)) {
      for (const artifact of m.metadata.artifacts) {
        parts.push({
          type: `data-${artifact.type || 'code'}`,
          data: artifact,
        });
      }
    }

    // Add text content
    if (m.content) {
      parts.push({ type: 'text', text: m.content });
    }

    return parts.length > 0 ? parts : [{ type: 'text', text: m.content || '' }];
  };

  // Get auth token for transport
  const getAuthToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

  // ===== Vercel AI SDK v5 useChat =====
  const { messages: streamMessages, sendMessage, status, stop, error: chatError, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: () => {
        const token = getAuthToken();
        return { 'Authorization': token ? `Bearer ${token}` : '' };
      },
      body: () => ({
        // Use ref for synchronous access to latest conversationId
        conversationId: conversationIdRef.current,
      }),
    }),
    onFinish: ({ message }) => {
      // Cache the completed message's parts (including tool outputs) to localStorage
      // so they persist when user navigates away and comes back
      if (message?.id && message?.parts && message.parts.length > 0) {
        // Filter to only cache parts that have meaningful data (tool outputs, text, artifacts)
        const cachableParts = message.parts.filter((p: any) => {
          if (p.type === 'text' && p.text) return true;
          if (p.type?.startsWith('tool-') && p.state === 'output-available') return true;
          if (p.type === 'dynamic-tool' && p.state === 'output-available') return true;
          if (p.type?.startsWith('data-') && p.data) return true;
          return false;
        });
        if (cachableParts.length > 0) {
          saveMessagePartsToCache(message.id, cachableParts);
        }
      }
      // Refresh conversation list when a message completes
      loadConversations();
    },
    onError: (error) => {
      const msg = error.message || 'An error occurred';
      setPageError(msg);
      toast.error('Chat Error', {
        description: msg,
        action: { label: 'Retry', onClick: () => regenerate() },
        duration: 8000,
      });
    },
    experimental_throttle: 50, // Throttle UI updates for smoother streaming
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    sidebar: isDark ? '#1E1E1E' : '#f8f9fa',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
  };

  // Keep conversationIdRef in sync with selectedConversation state
  useEffect(() => {
    conversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => {
    if (selectedConversation) {
      // Skip loading messages if we just created this conversation (avoids clearing stream messages)
      if (skipNextLoadRef.current) {
        skipNextLoadRef.current = false;
        return;
      }
      loadPreviousMessages(selectedConversation.id);
    }
  }, [selectedConversation]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [streamMessages, historicalMessages]);
  useEffect(() => { if (chatError) setPageError(chatError.message); }, [chatError]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const loadConversations = async () => {
    try {
      const allData = await apiClient.getConversations();
      const data = allData.filter((c: any) => !c.conversation_type || c.conversation_type === 'agent');
      setConversations(data);
      if (data.length > 0 && !selectedConversation) setSelectedConversation(data[0]);
    } catch { setPageError('Failed to load conversations'); }
    finally { setLoadingConversations(false); }
  };

  const loadPreviousMessages = async (conversationId: string) => {
    try {
      const data = await apiClient.getMessages(conversationId);
      setHistoricalMessages(data.map((m: any) => ({
        id: m.id, role: m.role, content: m.content || '',
        // FIXED: Reconstruct full parts (including tool outputs) from backend data + local cache
        parts: reconstructParts(m),
        createdAt: m.created_at ? new Date(m.created_at) : new Date(),
      })));
      setMessages([]);
    } catch { setHistoricalMessages([]); }
  };

  // Track whether we just created a new conversation (to skip re-loading messages)
  const skipNextLoadRef = useRef(false);

  const handleNewConversation = async () => {
    try {
      skipNextLoadRef.current = true; // Prevent loadPreviousMessages from running
      const newConv = await apiClient.createConversation();
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      conversationIdRef.current = newConv.id; // Sync ref immediately
      setHistoricalMessages([]);
      setMessages([]);
      setPageError('');
    } catch (err) { setPageError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      await apiClient.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConversation?.id === id) { setSelectedConversation(null); setMessages([]); setHistoricalMessages([]); }
    } catch { setPageError('Failed to delete'); }
  };

  // Send message using v5 API: sendMessage({ text }, { body: { conversationId } })
  const doSend = async () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    setPageError('');

    // Determine the conversationId to use
    let convId = selectedConversation?.id || conversationIdRef.current;

    // Auto-create conversation if needed
    if (!convId) {
      try {
        skipNextLoadRef.current = true; // Prevent loadPreviousMessages from clearing stream
        const conv = await apiClient.createConversation();
        setConversations(prev => [conv, ...prev]);
        setSelectedConversation(conv);
        // Update ref SYNCHRONOUSLY so body() callback gets it immediately
        conversationIdRef.current = conv.id;
        convId = conv.id;
      } catch { setPageError('Failed to create conversation'); return; }
    }

    // v5 API: pass conversationId explicitly in sendMessage options
    // Per v5 docs: request-level options take precedence over hook-level options
    sendMessage({ text }, { body: { conversationId: convId } });
  };

  // Combine historical + streaming messages
  const allMessages = useMemo(() => [...historicalMessages, ...streamMessages], [historicalMessages, streamMessages]);
  const lastIdx = allMessages.length - 1;
  const userName = user?.name || 'You';

  // Strip large code blocks from text when artifacts exist (prevents duplication)
  const deduplicateTextWithArtifacts = (text: string, parts: any[], isCurrentlyStreaming: boolean): string => {
    // Only deduplicate for completed messages (not during streaming)
    if (isCurrentlyStreaming) return text;
    
    // Check if there are artifact/data parts in this message
    const hasArtifacts = parts.some((p: any) => 
      p.type?.startsWith('data-') || 
      (p.type?.startsWith('tool-') && p.state === 'output-available' && 
       ['generate_afl_code', 'debug_afl_code'].includes(p.type.replace('tool-', '')))
    );
    
    if (!hasArtifacts) return text;
    
    // Strip the largest code block (```...```) from text if artifact covers the same content
    // This regex matches fenced code blocks with 10+ lines (substantial code)
    return text.replace(/```[\w]*\n([\s\S]{200,}?)```/g, (match) => {
      // Replace large code blocks with a note, since the artifact card shows them
      return '*(See the rendered component below)*';
    });
  };

  // Helper: Copy message text to clipboard
  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'));
  }, []);

  // Render a single message using AI Elements composable architecture
  const renderMessage = (message: any, idx: number) => {
    const parts = message.parts || [{ type: 'text', text: message.content || '' }];
    const isLast = idx === lastIdx;
    const msgIsStreaming = isStreaming && isLast && message.role === 'assistant';
    const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
    // Detect multi-tool sequences for ChainOfThought display
    const toolParts = parts.filter((p: any) => p.type?.startsWith('tool-') || p.type === 'dynamic-tool');
    const hasMultipleTools = toolParts.length >= 2;
    // Collect source-url parts for Sources component
    const sourceParts = parts.filter((p: any) => p.type === 'source-url');
    const hasSources = sourceParts.length > 0;

    return (
      <AIMessage key={message.id} from={message.role}>
        {/* Timestamp label */}
        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
          {message.role === 'user' ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg, #FEC00F 0%, #FFD740 100%)', color: '#212121' }}>
              {userName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <img src={logo} alt="AI" className="w-6 h-6 rounded" />
          )}
          <span>{message.role === 'user' ? userName : 'Assistant'}</span>
          {message.createdAt && <span className="text-muted-foreground">• {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          {msgIsStreaming && <Shimmer duration={1.5}>Streaming...</Shimmer>}
        </div>

        <MessageContent>
          {/* AI Elements: Sources collapsible list for source-url parts */}
          {hasSources && message.role === 'assistant' && !msgIsStreaming && (
            <Sources>
              <SourcesTrigger count={sourceParts.length} />
              <SourcesContent>
                {sourceParts.map((sourcePart: any, sIdx: number) => (
                  <Source
                    key={`source-${sIdx}`}
                    href={sourcePart.url}
                    title={sourcePart.title || new URL(sourcePart.url).hostname}
                  />
                ))}
              </SourcesContent>
            </Sources>
          )}

          {/* AI Elements: ChainOfThought summary for multi-tool sequences */}
          {hasMultipleTools && message.role === 'assistant' && !msgIsStreaming && (
            <ChainOfThought defaultOpen={false}>
              <ChainOfThoughtHeader>Used {toolParts.length} tools</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {toolParts.map((tp: any, tIdx: number) => {
                  const tName = tp.type === 'dynamic-tool' ? (tp.toolName || 'unknown') : (tp.type?.replace('tool-', '') || 'unknown');
                  const tStatus = tp.state === 'output-available' ? 'complete' : tp.state === 'output-error' ? 'complete' : 'active';
                  return (
                    <ChainOfThoughtStep
                      key={`cot-${tIdx}`}
                      label={tName.replace(/_/g, ' ')}
                      status={tStatus}
                      description={tp.state === 'output-available' ? 'Completed' : tp.state === 'output-error' ? 'Error' : 'Running...'}
                    />
                  );
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {/* Render parts per v5 docs */}
          {parts.map((part: any, pIdx: number) => {
            switch (part.type) {
              case 'text':
                if (!part.text) return null;
                if (message.role === 'assistant') {
                  const displayText = deduplicateTextWithArtifacts(part.text, parts, msgIsStreaming);
                  if (!displayText.trim()) return null;
                  // Use AI Elements MessageResponse (Streamdown) for assistant markdown
                  return <MessageResponse key={pIdx}>{displayText}</MessageResponse>;
                }
                return (
                  <p key={pIdx} className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {part.text}
                  </p>
                );

              case 'reasoning':
                return (
                  <Reasoning key={pIdx} isStreaming={msgIsStreaming} defaultOpen={msgIsStreaming}>
                    <ReasoningTrigger />
                    <ReasoningContent>{part.text || ''}</ReasoningContent>
                  </Reasoning>
                );

              case 'source-url':
                // Now handled by Sources component above - skip individual rendering
                return null;

              case 'file':
                if (part.mediaType?.startsWith('image/')) {
                  return <img key={pIdx} src={part.url} alt="Generated" className="max-w-full rounded-lg mt-2" />;
                }
                // Non-image files: display with AI Elements Attachments
                if (part.url || part.filename) {
                  return (
                    <Attachments key={pIdx} variant="inline">
                      <Attachment data={{ ...part, id: `file-${pIdx}`, type: 'file' as const }}>
                        <AttachmentPreview />
                        <AttachmentInfo showMediaType />
                      </Attachment>
                    </Attachments>
                  );
                }
                return null;

              // ===== GENERATIVE UI: Tool parts render as rich components =====
              // AI SDK v6: part.type === 'tool-${toolName}', part.state, part.output
              // States: input-streaming, input-available, output-available, output-error
              // Also handle dynamic-tool for tools without static types
              
              // Stock Data Tool
              case 'tool-get_stock_data':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_stock_data" input={part.input} />;
                  case 'output-available':
                    return <StockCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Stock data error: {part.errorText}</div>;
                  default: return null;
                }

              // Python Code Execution Tool
              case 'tool-execute_python':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="execute_python" input={part.input} />;
                  case 'output-available':
                    return <CodeExecution key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Code execution error: {part.errorText}</div>;
                  default: return null;
                }

              // Knowledge Base Search Tool
              case 'tool-search_knowledge_base':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="search_knowledge_base" input={part.input} />;
                  case 'output-available':
                    return <KnowledgeBaseResults key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>KB search error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Generate Tool
              case 'tool-generate_afl_code':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="generate_afl_code" input={part.input} />;
                  case 'output-available':
                    return <AFLGenerateCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL generation error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Validate Tool
              case 'tool-validate_afl':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="validate_afl" input={part.input} />;
                  case 'output-available':
                    return <AFLValidateCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL validation error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Debug Tool
              case 'tool-debug_afl_code':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="debug_afl_code" input={part.input} />;
                  case 'output-available':
                    return <AFLDebugCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL debug error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Explain Tool
              case 'tool-explain_afl_code':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="explain_afl_code" input={part.input} />;
                  case 'output-available':
                    return <AFLExplainCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL explain error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Sanity Check Tool
              case 'tool-sanity_check_afl':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="sanity_check_afl" input={part.input} />;
                  case 'output-available':
                    return <AFLSanityCheckCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL sanity check error: {part.errorText}</div>;
                  default: return null;
                }

              // Web Search Tool (Claude built-in)
              case 'tool-web_search':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="web_search" input={part.input} />;
                  case 'output-available':
                    return <WebSearchResults key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Web search error: {part.errorText}</div>;
                  default: return null;
                }

              // ===== NEW GENERATIVE UI TOOLS =====

              // Live Stock Chart Tool
              case 'tool-get_stock_chart':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_stock_chart" input={part.input} />;
                  case 'output-available':
                    return <LiveStockChart key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Chart error: {part.errorText}</div>;
                  default: return null;
                }

              // Technical Analysis Tool
              case 'tool-technical_analysis':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="technical_analysis" input={part.input} />;
                  case 'output-available':
                    return <TechnicalAnalysis key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Technical analysis error: {part.errorText}</div>;
                  default: return null;
                }

              // Weather Tool
              case 'tool-get_weather':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_weather" input={part.input} />;
                  case 'output-available':
                    return <WeatherCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Weather error: {part.errorText}</div>;
                  default: return null;
                }

              // News Headlines Tool
              case 'tool-get_news':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_news" input={part.input} />;
                  case 'output-available':
                    return <NewsHeadlines key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>News error: {part.errorText}</div>;
                  default: return null;
                }

              // Data Chart Tool
              case 'tool-create_chart':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="create_chart" input={part.input} />;
                  case 'output-available':
                    return <DataChart key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Chart error: {part.errorText}</div>;
                  default: return null;
                }

              // Code Sandbox Tool
              case 'tool-code_sandbox':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="code_sandbox" input={part.input} />;
                  case 'output-available':
                    return <CodeSandbox key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Sandbox error: {part.errorText}</div>;
                  default: return null;
                }

              // v6: Dynamic tools — use AI Elements Tool composable
              case 'dynamic-tool': {
                const dynToolName = part.toolName || 'unknown';
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName={dynToolName} input={part.input} />;
                  case 'output-available':
                    return (
                      <AITool key={pIdx}>
                        <ToolHeader type="dynamic-tool" state={part.state} toolName={dynToolName} />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput output={part.output} errorText={part.errorText} />
                        </ToolContent>
                      </AITool>
                    );
                  case 'output-error':
                    return (
                      <AITool key={pIdx}>
                        <ToolHeader type="dynamic-tool" state={part.state} toolName={dynToolName} />
                        <ToolContent>
                          <ToolOutput output={part.output} errorText={part.errorText} />
                        </ToolContent>
                      </AITool>
                    );
                  default: return null;
                }
              }

              // Fallback: Unknown tool types — use AI Elements Tool composable
              default:
                if (part.type?.startsWith('tool-')) {
                  const toolName = part.type.replace('tool-', '');
                  switch (part.state) {
                    case 'input-streaming':
                    case 'input-available':
                      return <ToolLoading key={pIdx} toolName={toolName} input={part.input} />;
                    case 'output-available':
                      return (
                        <AITool key={pIdx}>
                          <ToolHeader type={part.type} state={part.state} />
                          <ToolContent>
                            <ToolInput input={part.input} />
                            <ToolOutput output={part.output} errorText={part.errorText} />
                          </ToolContent>
                        </AITool>
                      );
                    case 'output-error':
                      return (
                        <AITool key={pIdx}>
                          <ToolHeader type={part.type} state={part.state} />
                          <ToolContent>
                            <ToolOutput output={part.output} errorText={part.errorText} />
                          </ToolContent>
                        </AITool>
                      );
                    default: return null;
                  }
                }
                // Data parts (artifacts from backend via type code 2:)
                if (part.type?.startsWith('data-') && part.data) {
                  if (part.data.content && part.data.artifactType) {
                    const artType = part.data.artifactType;
                    const isRenderable = ['html', 'svg', 'react', 'jsx', 'tsx'].includes(artType);
                    const artLang = part.data.language || artType;
                    const artCode = part.data.content;

                    // For HTML/SVG: use WebPreview with live iframe + source code
                    if (isRenderable && artCode) {
                      const blobUrl = (() => {
                        try {
                          const htmlContent = artType === 'svg'
                            ? `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:transparent">${artCode}</body></html>`
                            : artCode;
                          const blob = new Blob([htmlContent], { type: 'text/html' });
                          return URL.createObjectURL(blob);
                        } catch { return ''; }
                      })();

                      return (
                        <div key={pIdx} className="space-y-2">
                          {/* Live WebPreview */}
                          <WebPreview defaultUrl={blobUrl} className="h-[400px]">
                            <WebPreviewNavigation>
                              <span className="text-xs text-muted-foreground px-2 truncate flex-1">
                                {part.data.title || `${artType.toUpperCase()} Preview`}
                              </span>
                            </WebPreviewNavigation>
                            <WebPreviewBody />
                            <WebPreviewConsole />
                          </WebPreview>
                          {/* Source code with CodeBlock */}
                          <CodeBlock code={artCode} language={artLang as any} showLineNumbers>
                            <CodeBlockHeader>
                              <CodeBlockTitle>{part.data.title || artType}</CodeBlockTitle>
                              <CodeBlockActions>
                                <CodeBlockCopyButton />
                              </CodeBlockActions>
                            </CodeBlockHeader>
                          </CodeBlock>
                        </div>
                      );
                    }

                    // Non-renderable artifacts: Artifact card + ArtifactRenderer
                    return (
                      <Artifact key={pIdx}>
                        <ArtifactHeader>
                          <ArtifactTitle>{part.data.title || artType}</ArtifactTitle>
                        </ArtifactHeader>
                        <ArtifactContent>
                          <ArtifactRenderer artifact={{
                            id: part.data.id || `data-${pIdx}`,
                            type: artType,
                            language: artLang,
                            code: artCode,
                            complete: true,
                          }} />
                        </ArtifactContent>
                      </Artifact>
                    );
                  }
                }
                return null;
            }
          })}

          {/* Shimmer loading for submitted state */}
          {status === 'submitted' && isLast && message.role === 'assistant' && parts.every((p: any) => !p.text) && (
            <Shimmer duration={1.5}>Thinking...</Shimmer>
          )}
        </MessageContent>

        {/* Message actions toolbar for assistant messages (copy, thumbs up/down) */}
        {message.role === 'assistant' && !msgIsStreaming && fullText && (
          <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction tooltip="Copy" onClick={() => handleCopyMessage(fullText)}>
              <CopyIcon className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Helpful" onClick={() => toast.success('Thanks for the feedback!')}>
              <ThumbsUpIcon className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Not helpful" onClick={() => toast.info('Feedback noted')}>
              <ThumbsDownIcon className="size-3.5" />
            </MessageAction>
          </MessageActions>
        )}
      </AIMessage>
    );
  };

  return (
    <div style={{ height: '100vh', backgroundColor: colors.background, display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? '0px' : '280px', backgroundColor: colors.sidebar, borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', transition: 'width 0.3s ease' }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} />
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: colors.text, margin: 0 }}>CHATS</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Connection status indicator */}
            <div onClick={() => recheckConnection()} title={connStatus === 'connected' ? 'API Connected' : connStatus === 'disconnected' ? 'API Disconnected — click to retry' : 'Checking...'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {connStatus === 'connected' ? (
                <Wifi size={14} color="#22c55e" />
              ) : connStatus === 'disconnected' ? (
                <WifiOff size={14} color="#ef4444" />
              ) : (
                <Wifi size={14} color={colors.textMuted} style={{ opacity: 0.5 }} />
              )}
            </div>
            <button onClick={() => setSidebarCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <ChevronLeft size={16} color={colors.textMuted} />
            </button>
          </div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleNewConversation} style={{ width: '100%', padding: '12px', backgroundColor: '#FEC00F', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, color: '#212121' }}>
            <Plus size={18} /> New Chat
          </button>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              style={{ width: '100%', padding: '8px 10px 8px 32px', backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <X size={12} color={colors.textMuted} />
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          {loadingConversations ? (
            <div className="space-y-3 px-2 py-4">
              {/* AI Elements: Shimmer skeleton for conversation list loading */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <Shimmer duration={2 + i * 0.3} className="text-xs">Loading conversations...</Shimmer>
                </div>
              ))}
            </div>
          ) : (() => {
            const filtered = searchQuery.trim()
              ? conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              : conversations;
            if (filtered.length === 0 && searchQuery.trim()) {
              return <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted, fontSize: '12px' }}>No chats matching "{searchQuery}"</div>;
            }
            return filtered.map(conv => (
              <div key={conv.id} onClick={() => { if (renamingId !== conv.id) setSelectedConversation(conv); }} style={{ padding: '10px 12px', marginBottom: '4px', backgroundColor: selectedConversation?.id === conv.id ? 'rgba(254, 192, 15, 0.1)' : 'transparent', border: selectedConversation?.id === conv.id ? '1px solid rgba(254, 192, 15, 0.4)' : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', color: colors.text, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={14} style={{ flexShrink: 0 }} />
                {renamingId === conv.id ? (
                  /* Inline rename input */
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newTitle = renameValue || conv.title;
                        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: newTitle } : c));
                        if (selectedConversation?.id === conv.id) setSelectedConversation({ ...conv, title: newTitle });
                        setRenamingId(null);
                        // Persist to backend
                        apiClient.renameConversation(conv.id, newTitle).then(() => {
                          toast.success('Chat renamed');
                        }).catch(() => {
                          toast.error('Failed to save rename');
                        });
                      }
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => {
                      const newTitle = renameValue || conv.title;
                      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: newTitle } : c));
                      if (selectedConversation?.id === conv.id) setSelectedConversation({ ...conv, title: newTitle });
                      setRenamingId(null);
                      // Persist to backend
                      apiClient.renameConversation(conv.id, newTitle).catch(() => {});
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1, background: colors.inputBg, border: `1px solid #FEC00F`, borderRadius: '4px', color: colors.text, fontSize: '13px', padding: '2px 6px', outline: 'none', minWidth: 0 }}
                  />
                ) : (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.title}</span>
                )}
                {renamingId !== conv.id && (
                  <div style={{ display: 'flex', gap: '2px', opacity: 0.5 }}>
                    <button onClick={(e) => { e.stopPropagation(); setRenamingId(conv.id); setRenameValue(conv.title || ''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Rename">
                      <Pencil size={12} color={colors.textMuted} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Delete">
                      <Trash2 size={12} color={colors.textMuted} />
                    </button>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100, background: 'rgba(254, 192, 15, 0.3)', border: '1px solid rgba(254, 192, 15, 0.5)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
            <ChevronRight size={18} color="#FEC00F" />
          </button>
        )}

        {/* AI Elements: Conversation with auto-scroll */}
        <AIConversation className="flex-1">
          <ConversationContent className="max-w-[900px] mx-auto px-6 py-8">
            {allMessages.length === 0 ? (
              <ConversationEmptyState
                icon={<img src={logo} alt="Logo" className="w-20 opacity-30" />}
                title="Welcome to Analyst Chat"
                description="Ask me about AFL code, trading strategies, backtesting, or anything else."
              >
                <div className="flex flex-col items-center gap-4">
                  <img src={logo} alt="Logo" className="w-20 opacity-30" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Welcome to Analyst Chat</h3>
                    <p className="text-muted-foreground text-sm">Ask me about AFL code, trading strategies, backtesting, or anything else.</p>
                  </div>
                  {/* AI Elements: Quick Suggestions */}
                  <Suggestions className="justify-center mt-4">
                    <Suggestion suggestion="Generate a moving average crossover AFL" onClick={(s) => { setInput(s); }} />
                    <Suggestion suggestion="Explain RSI divergence strategy" onClick={(s) => { setInput(s); }} />
                    <Suggestion suggestion="Show me AAPL stock data" onClick={(s) => { setInput(s); }} />
                    <Suggestion suggestion="Search knowledge base for Bollinger Bands" onClick={(s) => { setInput(s); }} />
                  </Suggestions>
                  <p className="text-xs text-muted-foreground mt-2">Click a suggestion or type your own message below</p>
                </div>
              </ConversationEmptyState>
            ) : (
              <>
                {allMessages.map((msg, idx) => renderMessage(msg, idx))}

                {/* Submitted state — waiting for first token */}
                {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                  <AIMessage from="assistant">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                      <img src={logo} alt="AI" className="w-6 h-6 rounded" />
                      <span>Assistant</span>
                    </div>
                    <MessageContent>
                      <Shimmer duration={1.5}>Thinking...</Shimmer>
                    </MessageContent>
                  </AIMessage>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </ConversationContent>
          <ConversationScrollButton />
        </AIConversation>

        {/* Error banner */}
        {(pageError || chatError) && (
          <div className="px-6 py-3 bg-destructive/10 border-t border-destructive text-destructive text-sm flex justify-between items-center">
            <span>{pageError || chatError?.message || 'An error occurred'}</span>
            <div className="flex gap-2">
              <button onClick={() => regenerate()} className="border border-destructive rounded-md text-destructive cursor-pointer px-3 py-1 text-xs flex items-center gap-1 bg-transparent">
                <RefreshCw size={12} /> Retry
              </button>
              <button onClick={() => setPageError('')} className="bg-transparent border-none text-destructive cursor-pointer text-lg">×</button>
            </div>
          </div>
        )}

        {/* AI Elements: PromptInput with file upload */}
        <div className="border-t px-6 py-5">
          <div className="max-w-[900px] mx-auto">
            <TooltipProvider>
            <PromptInput
              accept=".pdf,.csv,.json,.txt,.afl,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              multiple
              onSubmit={async ({ text, files }) => {
                if ((!text.trim() && files.length === 0) || isStreaming) return;
                setInput('');
                setPageError('');

                let convId = selectedConversation?.id || conversationIdRef.current;
                if (!convId) {
                  try {
                    skipNextLoadRef.current = true;
                    const conv = await apiClient.createConversation();
                    setConversations(prev => [conv, ...prev]);
                    setSelectedConversation(conv);
                    conversationIdRef.current = conv.id;
                    convId = conv.id;
                  } catch { setPageError('Failed to create conversation'); return; }
                }

                // Upload files first if any
                let messageText = text;
                if (files.length > 0) {
                  const token = getAuthToken();
                  const uploaded: string[] = [];

                  for (const file of files) {
                    const fileName = file.filename || 'upload';
                    try {
                      // Convert blob URL to actual File if needed
                      let actualFile: File;
                      if (file.url?.startsWith('blob:')) {
                        const blob = await fetch(file.url).then(r => r.blob());
                        actualFile = new File([blob], fileName, { type: file.mediaType || 'application/octet-stream' });
                      } else {
                        // This shouldn't happen with PromptInput but handle it
                        throw new Error('No blob URL found');
                      }

                      const toastId = toast.loading(`Uploading ${fileName}...`);
                      const formData = new FormData();
                      formData.append('file', actualFile);
                      
                      const resp = await fetch(`/api/upload?conversationId=${convId}`, { 
                        method: 'POST', 
                        headers: { 'Authorization': token ? `Bearer ${token}` : '' }, 
                        body: formData 
                      });
                      
                      if (resp.ok) {
                        uploaded.push(fileName);
                        toast.success(`Uploaded ${fileName}`, { id: toastId });
                      } else {
                        throw new Error(`Upload failed: ${resp.status}`);
                      }
                    } catch (err) {
                      toast.error(`Failed to upload ${fileName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    }
                  }

                  // Add file references to message text
                  if (uploaded.length > 0) {
                    const fileList = uploaded.map(f => `📎 ${f}`).join('\n');
                    messageText = text.trim() ? `${text}\n\n${fileList}` : fileList;
                  }
                }

                sendMessage({ text: messageText }, { body: { conversationId: convId } });
              }}
            >
              {/* AI Elements: File attachment previews */}
              <AttachmentsDisplay />
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isStreaming ? "Yang is responding..." : "Type a message to start chatting..."}
                disabled={status !== 'ready' && status !== 'error'}
              />
              <PromptInputFooter>
                <PromptInputTools>
                  {/* AI Elements: File attachment button */}
                  <AttachmentButton disabled={isStreaming} />

                  {/* AI Elements: Voice dictation via Web Speech API / MediaRecorder fallback */}
                  <SpeechInput
                    size="icon-sm"
                    variant="ghost"
                    onTranscriptionChange={(text) => {
                      setInput(prev => {
                        const base = prev.trim();
                        return base ? `${base} ${text}` : text;
                      });
                    }}
                    onAudioRecorded={async (audioBlob) => {
                      // Fallback for Firefox/Safari: send audio to backend transcription
                      try {
                        const token = getAuthToken();
                        const formData = new FormData();
                        formData.append('audio', audioBlob, 'recording.webm');
                        const resp = await fetch('/api/upload', {
                          method: 'POST',
                          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                          body: formData,
                        });
                        if (resp.ok) {
                          const data = await resp.json();
                          return data.transcript || '';
                        }
                      } catch {
                        toast.error('Voice transcription failed');
                      }
                      return '';
                    }}
                    lang="en-US"
                    disabled={isStreaming}
                  />
                </PromptInputTools>
                <PromptInputSubmit
                  status={status}
                  onStop={() => stop()}
                  disabled={!input.trim() && !isStreaming}
                />
              </PromptInputFooter>
            </PromptInput>
            </TooltipProvider>
          </div>
        </div>

        {/* Note: PromptInput handles file attachments internally — no manual file input needed */}
        {/* The AI Elements PromptInput component automatically manages file attachments with proper preview */}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
      `}</style>
    </div>
  );
}

export default ChatPage;
