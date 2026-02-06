'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, MessageSquare, Paperclip, Trash2, ChevronLeft, ChevronRight, Loader2, Square, RefreshCw } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import apiClient from '@/lib/api';
import { Conversation } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { ArtifactRenderer } from '@/components/artifacts';
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

export function ChatPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [pageError, setPageError] = useState('');
  const [historicalMessages, setHistoricalMessages] = useState<any[]>([]);
  
  // Local input state - per the v5 docs pattern
  const [input, setInput] = useState('');

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
      setPageError(error.message || 'An error occurred');
    },
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
  useEffect(() => { if (selectedConversation) loadPreviousMessages(selectedConversation.id); }, [selectedConversation]);
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

  const handleNewConversation = async () => {
    try {
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

  // Render a single message using the v5 parts API
  const renderMessage = (message: any, idx: number) => {
    const parts = message.parts || [{ type: 'text', text: message.content || '' }];
    const isLast = idx === lastIdx;
    const msgIsStreaming = isStreaming && isLast && message.role === 'assistant';

    return (
      <div key={message.id} style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {/* Avatar */}
        <div style={{ width: '36px', height: '36px', borderRadius: message.role === 'user' ? '50%' : '10px', background: message.role === 'user' ? 'linear-gradient(135deg, #FEC00F 0%, #FFD740 100%)' : colors.cardBg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {message.role === 'user' ? <span style={{ fontWeight: 700, color: '#212121' }}>{userName.charAt(0).toUpperCase()}</span> : <img src={logo} alt="AI" style={{ width: '24px' }} />}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>
            {message.role === 'user' ? userName : 'Assistant'}
            {message.createdAt && ` • ${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            {msgIsStreaming && <span style={{ marginLeft: '8px', color: '#FEC00F', animation: 'pulse 1.5s ease-in-out infinite' }}>● Streaming...</span>}
          </div>

          {/* Render parts per v5 docs */}
          {parts.map((part: any, pIdx: number) => {
            switch (part.type) {
              case 'text':
                return part.text ? (
                  <div key={pIdx} style={{ color: colors.text, fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {part.text}
                  </div>
                ) : null;

              case 'reasoning':
                return (
                  <pre key={pIdx} style={{ color: colors.textMuted, fontSize: '13px', backgroundColor: colors.inputBg, padding: '12px', borderRadius: '8px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                    {part.text}
                  </pre>
                );

              case 'source-url':
                return (
                  <a key={pIdx} href={part.url} target="_blank" rel="noopener" style={{ color: '#FEC00F', fontSize: '13px' }}>
                    [{part.title || 'Source'}]
                  </a>
                );

              case 'file':
                if (part.mediaType?.startsWith('image/')) {
                  return <img key={pIdx} src={part.url} alt="Generated" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px' }} />;
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

              // v6: Dynamic tools (tools without static type definitions)
              case 'dynamic-tool': {
                const dynToolName = part.toolName || 'unknown';
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName={dynToolName} input={part.input} />;
                  case 'output-available':
                    return (
                      <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(45, 127, 62, 0.1)', border: '1px solid rgba(45, 127, 62, 0.3)', borderRadius: '12px', marginTop: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#2D7F3E', fontWeight: 600 }}>✓ {dynToolName}</span>
                        <pre style={{ margin: '8px 0 0', fontSize: '12px', color: colors.text, whiteSpace: 'pre-wrap' }}>
                          {typeof part.output === 'string' ? part.output : JSON.stringify(part.output, null, 2)}
                        </pre>
                      </div>
                    );
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Error: {part.errorText}</div>;
                  default: return null;
                }
              }

              // Fallback: Unknown tool types or data parts
              default:
                if (part.type?.startsWith('tool-')) {
                  // Generic tool rendering for any unknown tools (v6 states)
                  const toolName = part.type.replace('tool-', '');
                  switch (part.state) {
                    case 'input-streaming':
                    case 'input-available':
                      return <ToolLoading key={pIdx} toolName={toolName} input={part.input} />;
                    case 'output-available':
                      return (
                        <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(45, 127, 62, 0.1)', border: '1px solid rgba(45, 127, 62, 0.3)', borderRadius: '12px', marginTop: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#2D7F3E', fontWeight: 600 }}>✓ {toolName}</span>
                          <pre style={{ margin: '8px 0 0', fontSize: '12px', color: colors.text, whiteSpace: 'pre-wrap' }}>
                            {typeof part.output === 'string' ? part.output : JSON.stringify(part.output, null, 2)}
                          </pre>
                        </div>
                      );
                    case 'output-error':
                      return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Error: {part.errorText}</div>;
                    default: return null;
                  }
                }
                // Data parts (artifacts from backend via type code 2:)
                if (part.type?.startsWith('data-') && part.data) {
                  if (part.data.content && part.data.artifactType) {
                    return <ArtifactRenderer key={pIdx} artifact={{
                      id: part.data.id || `data-${pIdx}`,
                      type: part.data.artifactType,
                      language: part.data.language || part.data.artifactType,
                      code: part.data.content,
                      complete: true,
                    }} />;
                  }
                }
                return null;
            }
          })}

          {/* Streaming dots for submitted state */}
          {status === 'submitted' && isLast && message.role === 'assistant' && parts.every((p: any) => !p.text) && (
            <div style={{ display: 'flex', gap: '4px', padding: '12px 0' }}>
              {[0, 0.2, 0.4].map((delay, i) => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FEC00F', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: `${delay}s` }} />)}
            </div>
          )}
        </div>
      </div>
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
          <button onClick={() => setSidebarCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          <button onClick={handleNewConversation} style={{ width: '100%', padding: '12px', backgroundColor: '#FEC00F', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, color: '#212121' }}>
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loadingConversations ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color={colors.textMuted} /></div>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => setSelectedConversation(conv)} style={{ padding: '12px', marginBottom: '8px', backgroundColor: selectedConversation?.id === conv.id ? 'rgba(254, 192, 15, 0.1)' : 'transparent', border: selectedConversation?.id === conv.id ? '1px solid rgba(254, 192, 15, 0.4)' : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', color: colors.text, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.title}</span>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.5 }}>
                <Trash2 size={14} color={colors.textMuted} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100, background: 'rgba(254, 192, 15, 0.3)', border: '1px solid rgba(254, 192, 15, 0.5)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
            <ChevronRight size={18} color="#FEC00F" />
          </button>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
            {allMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: '40px' }}>
                <img src={logo} alt="Logo" style={{ width: '80px', opacity: 0.3, marginBottom: '20px' }} />
                <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: colors.text }}>Welcome to Analyst Chat</p>
                <p style={{ fontSize: '14px', color: colors.textMuted }}>Ask me about AFL code, trading strategies, backtesting, or anything else.</p>
                <p style={{ fontSize: '13px', color: '#FEC00F', marginTop: '16px' }}>Just type a message below to start chatting.</p>
              </div>
            ) : (
              allMessages.map((msg, idx) => renderMessage(msg, idx))
            )}

            {/* Submitted state - waiting for first token */}
            {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={logo} alt="AI" style={{ width: '24px' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', padding: '16px 0' }}>
                  {[0, 0.2, 0.4].map((delay, i) => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FEC00F', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: `${delay}s` }} />)}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error */}
        {(pageError || chatError) && (
          <div style={{ padding: '12px 24px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderTop: '1px solid #DC2626', color: '#DC2626', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{pageError || chatError?.message || 'An error occurred'}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => regenerate()} style={{ background: 'none', border: '1px solid #DC2626', borderRadius: '6px', color: '#DC2626', cursor: 'pointer', padding: '4px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={12} /> Retry
              </button>
              <button onClick={() => setPageError('')} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '20px 24px 32px', borderTop: `1px solid ${colors.border}` }}>
          <form onSubmit={(e) => { e.preventDefault(); doSend(); }} style={{ maxWidth: '900px', width: '100%', margin: '0 auto', position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } }}
              placeholder={isStreaming ? "Yang is responding..." : "Type a message to start chatting..."}
              disabled={status !== 'ready' && status !== 'error'}
              style={{ width: '100%', minHeight: '56px', maxHeight: '200px', padding: '18px 120px 18px 20px', backgroundColor: colors.cardBg, border: `2px solid ${isStreaming ? '#FEC00F' : colors.border}`, borderRadius: '24px', color: colors.text, fontSize: '15px', fontFamily: "'Quicksand', sans-serif", outline: 'none', resize: 'none', transition: 'border-color 0.3s ease', boxSizing: 'border-box' }}
            />
            <div style={{ position: 'absolute', right: '12px', bottom: '12px', display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!selectedConversation || isStreaming} style={{ width: '36px', height: '36px', background: 'none', border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: selectedConversation && !isStreaming ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedConversation && !isStreaming ? 1 : 0.5 }}>
                <Paperclip size={16} color={colors.textMuted} />
              </button>
              {isStreaming ? (
                <button type="button" onClick={() => stop()} style={{ width: '36px', height: '36px', backgroundColor: '#DC2626', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Stop">
                  <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} style={{ width: '36px', height: '36px', backgroundColor: input.trim() ? '#FEC00F' : colors.inputBg, border: 'none', borderRadius: '10px', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={16} color={input.trim() ? '#212121' : colors.textMuted} />
                </button>
              )}
            </div>
          </form>
        </div>
        <input ref={fileInputRef} type="file" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !selectedConversation) return;
          try {
            const formData = new FormData();
            formData.append('file', file);
            const token = getAuthToken();
            await fetch(`/api/upload?conversationId=${selectedConversation.id}`, { method: 'POST', headers: { 'Authorization': token ? `Bearer ${token}` : '' }, body: formData });
            setInput(prev => prev + `\n📎 ${file.name}`);
          } catch { setPageError('Upload failed'); }
          if (fileInputRef.current) fileInputRef.current.value = '';
        }} style={{ display: 'none' }} />
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
