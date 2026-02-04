'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, MessageSquare, Paperclip, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';
import { Conversation, Message, Artifact } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { ArtifactRenderer } from '@/components/artifacts';

const logo = '/yellowlogo.png';

// Helper function to extract artifacts from message content
function extractArtifactsFromContent(content: string, messageId: string): Artifact[] {
  const artifacts: Artifact[] = [];
  
  if (!content || !content.includes('```')) {
    return artifacts;
  }
  
  // Match code blocks with optional language specifier
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'code';
    const code = match[2].trim();
    
    // Skip empty code blocks
    if (!code) continue;
    
    // Determine artifact type based on language
    let type: Artifact['type'] = 'code';
    const langLower = language.toLowerCase();
    
    if (['jsx', 'tsx', 'react'].includes(langLower)) {
      type = 'react';
    } else if (['javascript', 'js'].includes(langLower)) {
      type = 'react'; // Treat JavaScript as React for artifact rendering
    } else if (langLower === 'html') {
      type = 'html';
    } else if (langLower === 'svg') {
      type = 'svg';
    } else if (langLower === 'mermaid') {
      type = 'mermaid';
    }
    
    artifacts.push({
      id: `${messageId}-artifact-${index}`,
      type,
      language,
      code,
      title: `${language.toUpperCase()} Code`,
    });
    
    index++;
  }
  
  return artifacts;
}

// Helper function to get text before first code block
function getTextBeforeCode(content: string): string {
  if (!content) return '';
  
  const codeBlockStart = content.indexOf('```');
  if (codeBlockStart === -1) {
    return content;
  }
  
  return content.substring(0, codeBlockStart).trim();
}

// Message component for rendering individual messages
function ChatMessage({ 
  message, 
  colors, 
  isDark, 
  userName 
}: { 
  message: Message; 
  colors: any; 
  isDark: boolean;
  userName: string;
}) {
  // Extract artifacts from content or use metadata artifacts
  const artifacts = useMemo(() => {
    // First check if artifacts are in metadata
    if (message.metadata?.artifacts && message.metadata.artifacts.length > 0) {
      console.log('Using metadata artifacts:', message.metadata.artifacts);
      return message.metadata.artifacts;
    }
    
    // Otherwise extract from content
    const extracted = extractArtifactsFromContent(message.content, message.id);
    if (extracted.length > 0) {
      console.log('Extracted artifacts from content:', extracted);
    }
    return extracted;
  }, [message.content, message.id, message.metadata?.artifacts]);
  
  const textContent = useMemo(() => {
    if (artifacts.length > 0) {
      return getTextBeforeCode(message.content);
    }
    return message.content;
  }, [message.content, artifacts.length]);
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
      {/* Avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: message.role === 'user' ? '50%' : '10px',
        background: message.role === 'user' 
          ? 'linear-gradient(135deg, #FEC00F 0%, #FFD740 100%)' 
          : colors.cardBg,
        border: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {message.role === 'user' ? (
          <span style={{ fontWeight: 700, color: '#212121' }}>
            {userName.charAt(0).toUpperCase()}
          </span>
        ) : (
          <img src={logo} alt="AI" style={{ width: '24px' }} />
        )}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>
          {message.role === 'user' ? userName : 'Assistant'} • {formatTime(message.created_at)}
        </div>
        
        {/* Text content */}
        {textContent && (
          <div style={{ 
            color: colors.text, 
            fontSize: '15px', 
            lineHeight: 1.7,
            marginBottom: artifacts.length > 0 ? '16px' : 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {textContent}
          </div>
        )}
        
        {/* Artifacts - IMPORTANT: Check if artifacts exist before mapping */}
        {artifacts && artifacts.length > 0 && artifacts.map((artifact, idx) => (
          <ArtifactRenderer key={artifact.id || `artifact-${idx}`} artifact={artifact} />
        ))}
      </div>
    </div>
  );
}

export function ChatPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    sidebar: isDark ? '#1E1E1E' : '#f8f9fa',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    codeBg: isDark ? '#0D1117' : '#f5f5f5',
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
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
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await apiClient.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !selectedConversation) return;

    const userMessage = input;
    setInput('');
    setError('');
    setLoading(true);

    // Add user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      conversation_id: selectedConversation.id,
      content: userMessage,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await apiClient.sendMessage(userMessage, selectedConversation.id);
      
      // DEBUG: Log the full API response
      console.log('=== API RESPONSE DEBUG ===');
      console.log('Full response:', response);
      console.log('response.all_artifacts:', response.all_artifacts);
      console.log('response.response:', response.response);
      console.log('response.parts:', response.parts);
      console.log('========================');
      
      // Extract artifacts from response with priority order
      let artifacts: Artifact[] = [];
      
      // Priority 1: Check for all_artifacts array (backend uses this name)
      if (response.all_artifacts && Array.isArray(response.all_artifacts) && response.all_artifacts.length > 0) {
        artifacts = response.all_artifacts;
        console.log('Using all_artifacts from API:', artifacts);
      }
      // Priority 2: Extract from parts array (AI SDK Generative UI format)
      else if (response.parts && Array.isArray(response.parts)) {
        artifacts = response.parts
          .filter((part: any) => part.type?.startsWith('tool-'))
          .map((part: any) => ({
            id: part.output?.id || `artifact-${Date.now()}-${Math.random()}`,
            type: part.type.replace('tool-', '') as any,
            language: part.output?.language || part.type.replace('tool-', ''),
            code: part.output?.code || '',
            complete: true,
          }));
        console.log('Extracted artifacts from parts:', artifacts);
      }
      // Priority 3: Extract from response text (fallback)
      else if (response.response && response.response.includes('```')) {
        artifacts = extractArtifactsFromContent(response.response, `assistant-${Date.now()}`);
        console.log('Extracted artifacts from response text:', artifacts);
      }
      
      // DEBUG: Final artifacts
      console.log('Final artifacts to be stored:', artifacts);

      // Add assistant message with artifacts in metadata
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        conversation_id: response.conversation_id,
        content: response.response || '',  // Backend uses 'response' not 'content'
        role: 'assistant',
        created_at: new Date().toISOString(),
        // Convert tools_used to proper format if present
        tools_used: response.tools_used?.map((tool: any) => ({
          tool: typeof tool === 'string' ? tool : tool.tool,
          input: typeof tool === 'string' ? {} : (tool.input || {}),
        })),
        metadata: {
          artifacts: artifacts,
          has_artifacts: artifacts.length > 0,
          parts: response.parts,  // Store parts for reference
        },
      };
      
      console.log('Adding assistant message with metadata:', assistantMsg.metadata);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await apiClient.createConversation();
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setMessages([]);
      setError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error('Create conversation error:', err);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await apiClient.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      setError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMsg);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.uploadFile(selectedConversation.id, formData);
      setInput(prev => prev + `\n📎 ${file.name}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMsg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const userName = user?.name || 'You';

  return (
    <div style={{
      height: '100vh',
      backgroundColor: colors.background,
      display: 'flex',
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0px' : '280px',
        backgroundColor: colors.sidebar,
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
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
            <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} />
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              color: colors.text,
              margin: 0,
            }}>
              CHATS
            </h2>
          </div>
          <button
            onClick={() => setSidebarCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '16px' }}>
          <button
            onClick={handleNewConversation}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#FEC00F',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              color: '#212121',
            }}
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loadingConversations ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color={colors.textMuted} />
            </div>
          ) : conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: selectedConversation?.id === conv.id ? 'rgba(254, 192, 15, 0.1)' : 'transparent',
                border: selectedConversation?.id === conv.id ? '1px solid rgba(254, 192, 15, 0.4)' : '1px solid transparent',
                borderRadius: '10px',
                cursor: 'pointer',
                color: colors.text,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MessageSquare size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {conv.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conv.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  opacity: 0.5,
                }}
              >
                <Trash2 size={14} color={colors.textMuted} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Sidebar Toggle */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              zIndex: 100,
              background: 'rgba(254, 192, 15, 0.3)',
              border: '1px solid rgba(254, 192, 15, 0.5)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={18} color="#FEC00F" />
          </button>
        )}

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: '40px' }}>
                <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: '20px' }} />
                <p>Start a conversation</p>
              </div>
            ) : (
              messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  colors={colors}
                  isDark={isDark}
                  userName={userName}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderTop: '1px solid #DC2626',
            color: '#DC2626',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: '20px 24px 32px', borderTop: `1px solid ${colors.border}` }}>
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={!selectedConversation || loading}
              style={{
                width: '100%',
                minHeight: '56px',
                maxHeight: '200px',
                padding: '18px 120px 18px 20px',
                backgroundColor: colors.cardBg,
                border: `2px solid ${colors.border}`,
                borderRadius: '24px',
                color: colors.text,
                fontSize: '15px',
                fontFamily: "'Quicksand', sans-serif",
                outline: 'none',
                resize: 'none',
              }}
            />
            <div style={{ position: 'absolute', right: '12px', bottom: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedConversation}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'none',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  cursor: selectedConversation ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: selectedConversation ? 1 : 0.5,
                }}
              >
                <Paperclip size={16} color={colors.textMuted} />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || !selectedConversation}
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: input.trim() && !loading && selectedConversation ? '#FEC00F' : colors.inputBg,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: input.trim() && !loading && selectedConversation ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Send size={16} color={input.trim() && selectedConversation ? '#212121' : colors.textMuted} />
                )}
              </button>
            </div>
          </div>
        </div>

        <input 
          ref={fileInputRef} 
          type="file" 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ChatPage;
