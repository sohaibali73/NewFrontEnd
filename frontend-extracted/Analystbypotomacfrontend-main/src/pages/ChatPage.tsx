import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, MessageSquare, Paperclip, Copy, Check, Trash2, Clock, X, ChevronLeft, ChevronRight, Sparkles, Code, TrendingUp, Lightbulb, Maximize2, Minimize2, Play, Square, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api';
import { Conversation, Message, MessagePart, TextPart, ToolPart, Artifact } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import mermaid from 'mermaid';
import { ReactComponent } from '@/components/generative-ui/ReactComponent';
import { Weather } from '@/components/Weather';

// Import logo from assets
import logo from '@/assets/yellowlogo.png';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

export function ChatPage() {
  const { resolvedTheme, accentColor } = useTheme();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const isDark = resolvedTheme === 'dark';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [showBackendError, setShowBackendError] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true); // Enable streaming by default
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    sidebar: isDark ? '#1E1E1E' : '#f8f9fa',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    codeBg: isDark ? '#0D1117' : '#f5f5f5',
    userBubble: accentColor,
    assistantBubble: isDark ? '#2A2A2A' : '#f0f0f0',
  };

  // Suggested prompts for empty state
  const suggestedPrompts = [
    { icon: <Sparkles size={20} />, text: "Generate an AFL for a moving average crossover strategy", color: "#FEC00F" },
    { icon: <Code size={20} />, text: "Help me debug my AFL code", color: "#60A5FA" },
    { icon: <TrendingUp size={20} />, text: "Explain RSI divergence trading", color: "#22C55E" },
    { icon: <Lightbulb size={20} />, text: "What's the best way to backtest a strategy?", color: "#A78BFA" },
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [input]);

  const loadConversations = async () => {
    try {
      const data = await apiClient.getConversations();
      setConversations(data);
      if (data.length > 0) setSelectedConversation(data[0]);
      setBackendAvailable(true);
    } catch (err) {
      // Silently handle backend unavailable - work with local state
      // This catches NetworkError, SecurityError, and other fetch issues
      setBackendAvailable(false);
      setShowBackendError(true);
      setTimeout(() => setShowBackendError(false), 5000);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await apiClient.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      // Silently handle error - messages will stay empty
      setBackendAvailable(false);
    }
  };

  // Stop streaming
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  // Streaming message handler
  const handleSendStreaming = async (userMessage: string) => {
    const tempUserId = `user-${Date.now()}`;
    const tempAssistantId = `assistant-${Date.now()}`;
    
    // Add user message
    setMessages(prev => [...prev, {
      id: tempUserId,
      conversation_id: selectedConversation?.id || 'pending',
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }]);
    
    // Add streaming placeholder for assistant
    setMessages(prev => [...prev, {
      id: tempAssistantId,
      conversation_id: selectedConversation?.id || 'pending',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      metadata: { parts: [], isStreaming: true },
    }]);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    let accumulatedText = '';
    let currentParts: MessagePart[] = [];
    let newConversationId = selectedConversation?.id;
    
    try {
      await apiClient.sendMessageStream(userMessage, selectedConversation?.id, {
        signal: abortControllerRef.current.signal,
        
        onText: (text) => {
          accumulatedText += text;
          // Update message with streaming text
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].id === tempAssistantId) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: accumulatedText,
                metadata: {
                  ...updated[lastIdx].metadata,
                  parts: [...currentParts, { type: 'text' as const, text: accumulatedText }],
                },
              };
            }
            return updated;
          });
        },
        
        onToolCall: (toolCallId, toolName, args) => {
          // Show loading state for tool
          if (toolName.startsWith('render_')) {
            const componentType = toolName.replace('render_', '');
            currentParts.push({
              type: `tool-${componentType}` as any,
              state: 'input-available',
            } as ToolPart);
            
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].id === tempAssistantId) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  metadata: {
                    ...updated[lastIdx].metadata,
                    parts: [...currentParts],
                  },
                };
              }
              return updated;
            });
          }
        },
        
        onToolResult: (toolCallId, result) => {
          // Update with tool result (Generative UI component)
          if (result && result.type && result.type.startsWith('tool-')) {
            // Remove loading state
            currentParts = currentParts.filter(p => p.state !== 'input-available');
            
            currentParts.push({
              type: result.type as any,
              state: result.state || 'output-available',
              output: result.output,
            } as ToolPart);
            
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].id === tempAssistantId) {
                const artifacts = (updated[lastIdx].metadata as any)?.artifacts || [];
                if (result.output) {
                  artifacts.push({
                    type: result.type.replace('tool-', ''),
                    code: result.output.code,
                    language: result.output.language,
                    id: result.output.id,
                  });
                }
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  metadata: {
                    ...updated[lastIdx].metadata,
                    parts: [...currentParts],
                    artifacts,
                  },
                };
              }
              return updated;
            });
          }
        },
        
        onData: (data) => {
          if (data.conversation_id) {
            newConversationId = data.conversation_id;
          }
          
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].id === tempAssistantId) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                conversation_id: data.conversation_id || updated[lastIdx].conversation_id,
                tools_used: data.tools_used,
                metadata: {
                  ...updated[lastIdx].metadata,
                  has_artifacts: data.has_artifacts,
                },
              };
            }
            // Update user message conversation_id too
            const userMsgIdx = updated.findIndex(m => m.id === tempUserId);
            if (userMsgIdx >= 0 && data.conversation_id) {
              updated[userMsgIdx] = {
                ...updated[userMsgIdx],
                conversation_id: data.conversation_id,
              };
            }
            return updated;
          });
        },
        
        onError: (error) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].id === tempAssistantId) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: `⚠️ Error: ${error}`,
                metadata: { error: true },
              };
            }
            return updated;
          });
        },
        
        onFinish: (finishReason, usage) => {
          // Final update - mark streaming as complete
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].id === tempAssistantId) {
              const metadata = updated[lastIdx].metadata || {};
              delete (metadata as any).isStreaming;
              updated[lastIdx] = {
                ...updated[lastIdx],
                metadata,
              };
            }
            return updated;
          });
        },
      });
      
      // Update conversation if new
      if (newConversationId && newConversationId !== selectedConversation?.id) {
        setSelectedConversation(prev => prev 
          ? { ...prev, id: newConversationId! } 
          : { id: newConversationId!, title: userMessage.slice(0, 50), user_id: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        );
        await loadConversations();
      }
      
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Streaming error:', err);
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].id === tempAssistantId) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: `⚠️ Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
              metadata: { error: true },
            };
          }
          return updated;
        });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Non-streaming message handler (fallback)
  const handleSendNonStreaming = async (userMessage: string) => {
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update for user message
    const optimisticUserMsg: Message = {
      id: tempId,
      conversation_id: selectedConversation?.id || 'pending',
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const apiResponse = await apiClient.sendMessage(userMessage, selectedConversation?.id);
      
      // Remove optimistic message and add real messages with AI SDK style parts
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        return [
          ...filtered,
          {
            id: `user-${apiResponse.conversation_id}-${Date.now()}`,
            conversation_id: apiResponse.conversation_id,
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
          },
          {
            id: `assistant-${apiResponse.conversation_id}-${Date.now()}`,
            conversation_id: apiResponse.conversation_id,
            role: 'assistant',
            content: apiResponse.response,
            created_at: new Date().toISOString(),
            tools_used: apiResponse.tools_used || undefined,
            metadata: {
              parts: apiResponse.parts || [],
              artifacts: apiResponse.all_artifacts || [],
              has_artifacts: (apiResponse.all_artifacts || []).length > 0,
            },
          }
        ];
      });

      // Update conversation state
      if (!selectedConversation?.id || selectedConversation.id !== apiResponse.conversation_id) {
        setSelectedConversation(prev => prev 
          ? { ...prev, id: apiResponse.conversation_id } 
          : { id: apiResponse.conversation_id, title: userMessage.slice(0, 50), user_id: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        );
        await loadConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Replace optimistic message with error state
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        return [
          ...filtered,
          {
            id: `user-${Date.now()}`,
            conversation_id: selectedConversation?.id || '',
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
          },
          {
            id: `error-${Date.now()}`,
            conversation_id: selectedConversation?.id || '',
            role: 'assistant',
            content: `⚠️ Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
            created_at: new Date().toISOString(),
            metadata: { error: true }
          }
        ];
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      if (useStreaming) {
        await handleSendStreaming(userMessage);
      } else {
        await handleSendNonStreaming(userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (!backendAvailable) {
      // Create conversation locally
      const localConv: Conversation = {
        id: `local-${Date.now()}`,
        title: 'New Conversation',
        user_id: user?.id || 'local-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations(prev => [localConv, ...prev]);
      setSelectedConversation(localConv);
      setMessages([]);
      return;
    }

    try {
      const newConv = await apiClient.createConversation();
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setMessages([]);
      setBackendAvailable(true);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setBackendAvailable(false);
      setShowBackendError(true);
      setTimeout(() => setShowBackendError(false), 5000);
      
      // Fallback to local conversation
      const localConv: Conversation = {
        id: `local-${Date.now()}`,
        title: 'New Conversation',
        user_id: user?.id || 'local-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations(prev => [localConv, ...prev]);
      setSelectedConversation(localConv);
      setMessages([]);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await apiClient.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!selectedConversation?.id) {
      alert('Please start a conversation first');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await apiClient.uploadFile(selectedConversation.id, formData);
      setInput(prev => prev + `\n📎 Attached: ${file.name}`);
      
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  // Mermaid diagram component
  const MermaidDiagram: React.FC<{ code: string; id: string }> = ({ code, id }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
      const renderDiagram = async () => {
        if (containerRef.current && !rendered) {
          try {
            // Update mermaid theme based on current theme
            mermaid.initialize({
              startOnLoad: false,
              theme: isDark ? 'dark' : 'default',
              securityLevel: 'loose',
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
              },
            });
            
            const { svg } = await mermaid.render(`mermaid-${id}`, code);
            if (containerRef.current) {
              containerRef.current.innerHTML = svg;
              setRendered(true);
            }
          } catch (err) {
            console.error('Mermaid render error:', err);
            setError(err instanceof Error ? err.message : 'Failed to render diagram');
          }
        }
      };
      
      renderDiagram();
    }, [code, id, rendered, isDark]);

    if (error) {
      return (
        <div style={{
          backgroundColor: colors.codeBg,
          borderRadius: '12px',
          margin: '16px 0',
          padding: '16px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ color: '#EF4444', marginBottom: '8px', fontWeight: 600 }}>
            Failed to render diagram
          </div>
          <pre style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: '12px',
            color: colors.textMuted,
            whiteSpace: 'pre-wrap',
          }}>
            {code}
          </pre>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: colors.codeBg,
        borderRadius: '12px',
        margin: '16px 0',
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: isDark ? '#161B22' : '#e8e8e8',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#22C55E',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: "'Rajdhani', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <TrendingUp size={14} /> DIAGRAM
          </span>
          <button
            onClick={() => handleCopyCode(code, `mermaid-${id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: copiedId === `mermaid-${id}` ? '#22C55E' : 'transparent',
              border: `1px solid ${copiedId === `mermaid-${id}` ? '#22C55E' : colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: copiedId === `mermaid-${id}` ? '#fff' : colors.textMuted,
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            {copiedId === `mermaid-${id}` ? <Check size={14} /> : <Copy size={14} />}
            {copiedId === `mermaid-${id}` ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <div 
          ref={containerRef}
          style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            backgroundColor: isDark ? '#1a1a2e' : '#f8f9fa',
          }}
        >
          {!rendered && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: colors.textMuted,
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: `2px solid ${colors.border}`,
                borderTopColor: '#FEC00F',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              Rendering diagram...
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMessageContent = (content: string | undefined | null, messageId: string, artifacts?: Artifact[]) => {
    if (!content) {
      return <span>No content</span>;
    }
    
    // Create a map of artifact types to their code for quick lookup
    const artifactMap: { [key: string]: Artifact[] } = {};
    if (artifacts && artifacts.length > 0) {
      artifacts.forEach(artifact => {
        if (!artifactMap[artifact.type]) {
          artifactMap[artifact.type] = [];
        }
        artifactMap[artifact.type].push(artifact);
      });
    }
    
    // Track which artifact index we're on for each type
    const artifactCounters: { [key: string]: number } = {};
    
    // Combined regex for both code blocks and artifact placeholders
    const combinedRegex = /```(\w+)?\n([\s\S]*?)```|\[Artifact:\s*(\w+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(content)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`} style={{ whiteSpace: 'pre-wrap' }}>
            {renderFormattedText(textContent)}
          </span>
        );
      }

      // Check if it's a code block (match[1] and match[2]) or artifact placeholder (match[3])
      if (match[3]) {
        // This is an artifact placeholder like [Artifact: mermaid]
        const artifactType = match[3].toLowerCase();
        const artifactIndex = artifactCounters[artifactType] || 0;
        artifactCounters[artifactType] = artifactIndex + 1;
        
        // Look up the artifact code
        const artifactList = artifactMap[artifactType];
        if (artifactList && artifactList[artifactIndex]) {
          const artifact = artifactList[artifactIndex];
          const codeId = `${messageId}-artifact-${artifactIndex}`;
          
          if (artifactType === 'mermaid') {
            parts.push(
              <MermaidDiagram key={`mermaid-artifact-${match.index}`} code={artifact.code} id={codeId} />
            );
          } else {
            // Render other artifact types as code blocks
            parts.push(
              <div
                key={`artifact-${match.index}`}
                style={{
                  backgroundColor: colors.codeBg,
                  borderRadius: '12px',
                  margin: '16px 0',
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: isDark ? '#161B22' : '#e8e8e8',
                  borderBottom: `1px solid ${colors.border}`,
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#FEC00F',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: "'Rajdhani', sans-serif",
                  }}>
                    {artifact.language || artifactType}
                  </span>
                  <button
                    onClick={() => handleCopyCode(artifact.code, codeId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: copiedId === codeId ? '#22C55E' : 'transparent',
                      border: `1px solid ${copiedId === codeId ? '#22C55E' : colors.border}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: copiedId === codeId ? '#fff' : colors.textMuted,
                      fontSize: '12px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedId === codeId ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === codeId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  fontFamily: "'Fira Code', 'Monaco', monospace",
                  fontSize: '13px',
                  color: isDark ? '#e0e0e0' : '#333',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                }}>
                  {artifact.code}
                </pre>
              </div>
            );
          }
        } else {
          // Artifact not found, show placeholder as text
          parts.push(
            <span key={`placeholder-${match.index}`} style={{ 
              color: colors.textMuted, 
              fontStyle: 'italic',
              backgroundColor: colors.inputBg,
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              [{artifactType} diagram]
            </span>
          );
        }
      } else {
        // This is a code block
        const language = match[1] || 'code';
        const code = match[2];
        const codeId = `${messageId}-${match.index}`;
        
        // Render Mermaid diagrams specially
        if (language.toLowerCase() === 'mermaid') {
          parts.push(
            <MermaidDiagram key={`mermaid-${match.index}`} code={code} id={codeId} />
          );
        } else {
          parts.push(
            <div
              key={`code-${match.index}`}
              style={{
                backgroundColor: colors.codeBg,
                borderRadius: '12px',
                margin: '16px 0',
                overflow: 'hidden',
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                backgroundColor: isDark ? '#161B22' : '#e8e8e8',
                borderBottom: `1px solid ${colors.border}`,
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#FEC00F',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: "'Rajdhani', sans-serif",
                }}>
                  {language}
                </span>
                <button
                  onClick={() => handleCopyCode(code, codeId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: copiedId === codeId ? '#22C55E' : 'transparent',
                    border: `1px solid ${copiedId === codeId ? '#22C55E' : colors.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: copiedId === codeId ? '#fff' : colors.textMuted,
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copiedId === codeId ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === codeId ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: '16px',
                fontFamily: "'Fira Code', 'Monaco', monospace",
                fontSize: '13px',
                color: isDark ? '#e0e0e0' : '#333',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
                overflowX: 'auto',
              }}>
                {code}
              </pre>
            </div>
          );
        }
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} style={{ whiteSpace: 'pre-wrap' }}>
          {renderFormattedText(content.slice(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : renderFormattedText(content);
  };

  const renderFormattedText = (text: unknown) => {
    if (!text || typeof text !== 'string') {
      return <span>{String(text || '')}</span>;
    }
    let processedText = text;
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processedText = processedText.replace(/`([^`]+)`/g, '<code style="background-color: rgba(254,192,15,0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
    processedText = processedText.replace(/\n/g, '<br/>');
    
    return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
  };

  // AI SDK style parts-based rendering (Generative UI pattern)
  const renderMessageParts = (parts: MessagePart[], messageId: string) => {
    return parts.map((part, index) => {
      // Handle text parts
      if (part.type === 'text') {
        return (
          <span key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
            {renderFormattedText(part.text)}
          </span>
        );
      }

      // Handle tool parts (Generative UI components)
      if (part.type.startsWith('tool-')) {
        const toolType = part.type.replace('tool-', '');
        const toolPart = part as ToolPart;
        
        switch (toolPart.state) {
          case 'input-available':
            // Show loading state while tool is executing
            return (
              <div key={`tool-loading-${index}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                backgroundColor: colors.inputBg,
                borderRadius: '12px',
                margin: '16px 0',
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${colors.border}`,
                  borderTopColor: '#FEC00F',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{ color: colors.textMuted }}>
                  Generating {toolType}...
                </span>
              </div>
            );
          
          case 'output-available':
            // Render the appropriate component based on tool type
            if (toolPart.output) {
              const codeId = toolPart.output.id || `${messageId}-${index}`;
              
              // Mermaid diagrams
              if (toolType === 'mermaid') {
                return (
                  <MermaidDiagram 
                    key={`mermaid-${index}`} 
                    code={toolPart.output.code} 
                    id={codeId} 
                  />
                );
              }
              
              // Weather component
              if (toolType === 'displayWeather') {
                return (
                  <Weather
                    key={`weather-${index}`}
                    {...toolPart.output}
                  />
                );
              }
              
              // React/JSX components - render as interactive components
              if (toolType === 'react' || toolType === 'jsx' || toolType === 'chart') {
                return (
                  <ReactComponent
                    key={`react-${index}`}
                    code={toolPart.output.code}
                    id={codeId}
                  />
                );
              }
              
              // Code blocks (AFL, HTML, SVG, etc.)
              return (
                <div
                  key={`code-${index}`}
                  style={{
                    backgroundColor: colors.codeBg,
                    borderRadius: '12px',
                    margin: '16px 0',
                    overflow: 'hidden',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    backgroundColor: isDark ? '#161B22' : '#e8e8e8',
                    borderBottom: `1px solid ${colors.border}`,
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: toolType === 'afl' ? '#FEC00F' : '#60A5FA',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontFamily: "'Rajdhani', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <Code size={14} /> {toolPart.output.language || toolType}
                    </span>
                    <button
                      onClick={() => handleCopyCode(toolPart.output!.code, codeId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: copiedId === codeId ? '#22C55E' : 'transparent',
                        border: `1px solid ${copiedId === codeId ? '#22C55E' : colors.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: copiedId === codeId ? '#fff' : colors.textMuted,
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {copiedId === codeId ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === codeId ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    fontFamily: "'Fira Code', 'Monaco', monospace",
                    fontSize: '13px',
                    color: isDark ? '#e0e0e0' : '#333',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                    overflowX: 'auto',
                  }}>
                    {toolPart.output.code}
                  </pre>
                </div>
              );
            }
            return null;
          
          case 'output-error':
            // Show error state
            return (
              <div key={`tool-error-${index}`} style={{
                padding: '16px',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                borderRadius: '12px',
                margin: '16px 0',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                <div style={{ 
                  color: '#EF4444', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  ⚠️ Failed to generate {toolType}
                </div>
                {toolPart.errorText && (
                  <div style={{ color: colors.textMuted, fontSize: '13px' }}>
                    {toolPart.errorText}
                  </div>
                )}
              </div>
            );
          
          default:
            return null;
        }
      }

      return null;
    });
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: colors.background,
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
      transition: 'background-color 0.3s ease',
      position: 'relative',
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="*/*"
      />

      {/* Re-open button when sidebar is collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            background: 'rgba(254, 192, 15, 0.3)',
            border: '1px solid rgba(254, 192, 15, 0.5)',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(254, 192, 15, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(254, 192, 15, 0.3)';
          }}
        >
          <ChevronRight size={20} color="#FEC00F" />
        </button>
      )}

      {/* Conversations Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0px' : (isMobile ? '280px' : '240px'),
        backgroundColor: colors.sidebar,
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, border 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? 0 : 'auto',
        top: isMobile ? 0 : 'auto',
        bottom: isMobile ? 0 : 'auto',
        zIndex: isMobile ? 100 : 'auto',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="Analyst" style={{ width: '32px', height: '32px' }} />
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                margin: 0,
                textTransform: 'uppercase',
              }}>
                ANALYST
              </h2>
              <p style={{
                fontSize: '11px',
                color: colors.textMuted,
                margin: 0,
              }}>
                by Potomac
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed(true)}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.inputBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>

        {/* New Conversation Button */}
        <div style={{ padding: '16px 20px' }}>
          <button
            onClick={handleNewConversation}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#FEC00F',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#212121',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 8px rgba(254,192,15,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254,192,15,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(254,192,15,0.3)';
            }}
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '0 12px 12px',
        }}>
          {loadingConversations ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 0',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                border: `3px solid ${colors.border}`,
                borderTopColor: '#FEC00F',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
          ) : conversations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
            }}>
              <MessageSquare size={40} color={colors.textMuted} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ 
                color: colors.textMuted, 
                fontSize: '13px', 
                margin: 0,
                lineHeight: 1.6,
              }}>
                No conversations yet.<br />Start a new one!
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  position: 'relative',
                  marginBottom: '6px',
                }}
              >
                <button
                  onClick={() => setSelectedConversation(conv)}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 14px',
                    backgroundColor: selectedConversation?.id === conv.id 
                      ? (isDark ? 'rgba(254,192,15,0.15)' : 'rgba(254,192,15,0.2)')
                      : 'transparent',
                    border: selectedConversation?.id === conv.id 
                      ? '1px solid rgba(254,192,15,0.4)' 
                      : '1px solid transparent',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.id !== conv.id) {
                      e.currentTarget.style.backgroundColor = colors.inputBg;
                      e.currentTarget.style.borderColor = colors.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.id !== conv.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={14} color={selectedConversation?.id === conv.id ? '#FEC00F' : colors.textMuted} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: selectedConversation?.id === conv.id ? 600 : 400,
                      color: selectedConversation?.id === conv.id ? colors.text : colors.textMuted,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {conv.title || 'New Conversation'}
                    </span>
                  </div>
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '26px',
                    height: '26px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: 0.5,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '0.5';
                  }}
                >
                  <Trash2 size={13} color="#EF4444" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background,
        minWidth: 0,
      }}>
        {messages.length === 0 && !selectedConversation ? (
          /* Welcome Screen */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            maxWidth: '900px',
            margin: '0 auto',
            width: '100%',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              marginBottom: '24px',
            }}>
              <img src={logo} alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '48px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              ANALYST
            </h1>
            <p style={{
              fontSize: '18px',
              color: colors.textMuted,
              margin: '0 0 48px 0',
              textAlign: 'center',
            }}>
              Your AI-powered trading strategy assistant
            </p>

            {/* Suggested Prompts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              width: '100%',
              maxWidth: '900px',
            }}>
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleNewConversation();
                    setTimeout(() => handleSuggestedPrompt(prompt.text), 100);
                  }}
                  style={{
                    padding: '20px',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FEC00F';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: `${prompt.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: prompt.color,
                    flexShrink: 0,
                  }}>
                    {prompt.icon}
                  </div>
                  <span style={{
                    fontSize: '14px',
                    color: colors.text,
                    lineHeight: 1.6,
                    flex: 1,
                  }}>
                    {prompt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                maxWidth: '900px',
                width: '100%',
                margin: '0 auto',
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    color: colors.textMuted,
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      marginBottom: '20px',
                    }}>
                      <img src={logo} alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.3 }} />
                    </div>
                    <p style={{ 
                      fontSize: '18px', 
                      color: colors.text,
                      fontWeight: 600,
                      margin: '0 0 8px 0',
                    }}>
                      How can I help you today?
                    </p>
                    <p style={{ fontSize: '14px', margin: 0 }}>
                      Ask me anything about AFL strategies, backtesting, or technical analysis
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          gap: '16px',
                          marginBottom: '32px',
                          alignItems: 'flex-start',
                        }}
                      >
                        {message.role === 'assistant' && (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                          }}>
                            <img src={logo} alt="AI" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FEC00F 0%, #FFD740 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700,
                            color: '#212121',
                            fontSize: '16px',
                            flexShrink: 0,
                          }}>
                            {user?.name?.charAt(0).toUpperCase() || 'Y'}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                          }}>
                            <span style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '14px',
                              fontWeight: 700,
                              color: colors.text,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              {message.role === 'user' ? (user?.name || 'You') : 'Analyst'}
                            </span>
                            <span style={{
                              fontSize: '12px',
                              color: colors.textMuted,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              <Clock size={12} />
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <div style={{
                            color: colors.text,
                            fontSize: '15px',
                            lineHeight: 1.7,
                          }}>
                            {/* AI SDK Generative UI: Use parts-based rendering when available */}
                            {(message.metadata as { parts?: MessagePart[]; isStreaming?: boolean })?.isStreaming && !message.content ? (
                              // Show loading dots ONLY while streaming AND no content yet
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    style={{
                                      width: '10px',
                                      height: '10px',
                                      borderRadius: '50%',
                                      backgroundColor: '#FEC00F',
                                      animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (message.metadata as { parts?: MessagePart[] })?.parts?.length ? (
                              renderMessageParts(
                                (message.metadata as { parts: MessagePart[] }).parts,
                                message.id
                              )
                            ) : message.content ? (
                              // Fallback to legacy content rendering
                              renderMessageContent(
                                message.content, 
                                message.id, 
                                (message.metadata as { artifacts?: Artifact[] })?.artifacts
                              )
                            ) : (
                              // If no content and not streaming, show nothing (not "No content")
                              null
                            )}
                          </div>
                          
                          {/* Tool Usage Badges */}
                          {message.role === 'assistant' && message.tools_used && message.tools_used.length > 0 && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: '16px',
                            }}>
                              <span style={{
                                fontSize: '11px',
                                color: colors.textMuted,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontFamily: "'Rajdhani', sans-serif",
                              }}>
                                Tools Used:
                              </span>
                              {message.tools_used.map((tool, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: colors.inputBg,
                                    border: `1px solid ${colors.border}`,
                                    color: '#FEC00F',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  🔧 {tool.tool.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        marginBottom: '32px',
                        alignItems: 'flex-start',
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.cardBg,
                          border: `1px solid ${colors.border}`,
                          flexShrink: 0,
                        }}>
                          <img src={logo} alt="AI" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        </div>
                        <div style={{
                          padding: '16px',
                        }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  backgroundColor: '#FEC00F',
                                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div style={{
              padding: '20px 24px 32px',
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
            }}>
              <div style={{
                maxWidth: '900px',
                width: '100%',
                margin: '0 auto',
              }}>
                <div style={{
                  position: 'relative',
                  backgroundColor: colors.cardBg,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '24px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FEC00F';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(254,192,15,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Message Analyst..."
                    style={{
                      width: '100%',
                      minHeight: '56px',
                      maxHeight: '200px',
                      padding: '18px 120px 18px 20px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: colors.text,
                      fontSize: '15px',
                      fontFamily: "'Quicksand', sans-serif",
                      outline: 'none',
                      resize: 'none',
                      lineHeight: 1.6,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                  }}>
                    <button
                      onClick={handleFileUpload}
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.inputBg;
                        e.currentTarget.style.borderColor = '#FEC00F';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                    >
                      <Paperclip size={16} color={colors.textMuted} />
                    </button>
                    {/* Stop button - shown when streaming */}
                    {loading && useStreaming ? (
                      <button
                        onClick={handleStop}
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: '#EF4444',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                        }}
                        title="Stop generating"
                      >
                        <Square size={14} color="#ffffff" fill="#ffffff" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: input.trim() && !loading ? '#FEC00F' : colors.inputBg,
                          border: 'none',
                          borderRadius: '10px',
                          cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: input.trim() && !loading ? '0 2px 8px rgba(254,192,15,0.3)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (input.trim() && !loading) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(254,192,15,0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = input.trim() && !loading ? '0 2px 8px rgba(254,192,15,0.3)' : 'none';
                        }}
                      >
                        <Send size={16} color={input.trim() && !loading ? '#212121' : colors.textMuted} />
                      </button>
                    )}
                  </div>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginTop: '12px',
                  textAlign: 'center',
                }}>
                  <kbd style={{ 
                    backgroundColor: colors.inputBg, 
                    padding: '3px 8px', 
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: "'Quicksand', sans-serif",
                    fontSize: '11px',
                  }}>Enter</kbd> to send · <kbd style={{ 
                    backgroundColor: colors.inputBg, 
                    padding: '3px 8px', 
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    fontFamily: "'Quicksand', sans-serif",
                    fontSize: '11px',
                  }}>Shift + Enter</kbd> for new line
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}