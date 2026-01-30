import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Paperclip, Copy, Check, Trash2, Clock, X} from 'lucide-react';
import apiClient from '@/lib/api';
import { Conversation, Message } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Import logo properly from assets
import yellowLogo from '@/assets/yellowlogo.png';

export function ChatPage() {
  const { resolvedTheme, accentColor } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme-aware colors
  // In ChatPage.tsx, replace the hardcoded userBubble color:

const colors = {
  background: isDark ? '#121212' : '#ffffff',
  sidebar: isDark ? '#1E1E1E' : '#f8f9fa',
  cardBg: isDark ? '#1E1E1E' : '#ffffff',
  inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
  border: isDark ? '#424242' : '#e0e0e0',
  text: isDark ? '#FFFFFF' : '#212121',
  textMuted: isDark ? '#9E9E9E' : '#757575',
  codeBg: isDark ? '#1a1a2e' : '#f5f5f5',
  userBubble: accentColor,  // ✅ Use accent color from theme context
  assistantBubble: isDark ? '#2A2A2A' : '#f0f0f0',
};
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

  const loadConversations = async () => {
    try {
      const data = await apiClient.getConversations();
      setConversations(data);
      if (data.length > 0) setSelectedConversation(data[0]);
    } catch (err) {
      console.error('Failed to load conversations:', err);
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
    }
  };

  const handleSend = async () => {
      if (!input.trim() || loading) return;
      
      const userMessage = input;
      const tempId = `temp-${Date.now()}`;
      setInput('');
      setLoading(true);

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
          
          // Remove optimistic message and add real messages
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
                      // Include tools_used from API response
                      tools_used: apiResponse.tools_used || undefined,
                  }
              ];
          });

          // Update conversation state - handle both new and existing conversations
          if (!selectedConversation?.id || selectedConversation.id !== apiResponse.conversation_id) {
              // New conversation was created or conversation changed
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
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await apiClient.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If deleted conversation was selected, clear selection
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleClearConversation = () => {
    if (!selectedConversation) return;
    
    if (!window.confirm('Are you sure you want to clear all messages in this conversation?')) return;
    
    setMessages([]);
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
        
        const response = await apiClient.uploadFile(selectedConversation.id, formData);
        
        // Add file reference to input
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

  const handleRetryMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Remove error message and retry
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setInput(message.content);
    await handleSend();
};
  const renderMessageContent = (content: string | undefined | null, messageId: string) => {
    if (!content) {
      return <span>No content</span>;
    }
    
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`} style={{ whiteSpace: 'pre-wrap' }}>
            {renderFormattedText(textContent)}
          </span>
        );
      }

      const language = match[1] || 'code';
      const code = match[2];
      const codeId = `${messageId}-${match.index}`;
      
      parts.push(
        <div
          key={`code-${match.index}`}
          style={{
            backgroundColor: colors.codeBg,
            borderRadius: '12px',
            margin: '16px 0',
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: isDark ? '#252540' : '#e8e8e8',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#FEC00F',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
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

  return (
    <div style={{
      height: '100vh',
      backgroundColor: colors.background,
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
      transition: 'background-color 0.3s ease',
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="*/*"
      />

      {/* Conversations Sidebar */}
      <div style={{
        width: '300px',
        backgroundColor: colors.sidebar,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.3s ease',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: colors.text,
              letterSpacing: '1px',
              margin: 0,
            }}>
              CONVERSATIONS
            </h2>
            <button
              onClick={handleNewConversation}
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#FEC00F',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(254,192,15,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(254,192,15,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(254,192,15,0.3)';
              }}
            >
              <Plus size={18} color="#212121" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {loadingConversations ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 0',
            }}>
              <div className="spinner" style={{
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
              <MessageSquare size={40} color={colors.textMuted} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>
                No conversations yet.<br />Start a new one!
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  position: 'relative',
                  marginBottom: '8px',
                }}
              >
                <button
                  onClick={() => setSelectedConversation(conv)}
                  style={{
                    width: '100%',
                    padding: '14px 40px 14px 16px',
                    backgroundColor: selectedConversation?.id === conv.id 
                      ? (isDark ? 'rgba(254,192,15,0.15)' : 'rgba(254,192,15,0.2)')
                      : 'transparent',
                    border: selectedConversation?.id === conv.id 
                      ? '1px solid #FEC00F' 
                      : `1px solid transparent`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.id !== conv.id) {
                      e.currentTarget.style.backgroundColor = colors.inputBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.id !== conv.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={16} color={selectedConversation?.id === conv.id ? '#FEC00F' : colors.textMuted} />
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: selectedConversation?.id === conv.id ? '#FEC00F' : colors.text,
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
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: 0.6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '0.6';
                  }}
                >
                  <Trash2 size={14} color="#EF4444" />
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
      }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img src={yellowLogo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: colors.text,
                    margin: 0,
                  }}>
                    {selectedConversation.title || 'AI Assistant'}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                    margin: 0,
                  }}>
                    Always here to help
                  </p>
                </div>
              </div>
              
              {/* Clear conversation button */}
              <button
                onClick={handleClearConversation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: colors.textMuted,
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = '#EF4444';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.color = colors.textMuted;
                }}
              >
                <X size={16} />
                Clear Chat
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '24px',
            }}>
              {messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: colors.textMuted,
                }}>
                  <MessageSquare size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', color: colors.text }}>Start a conversation</p>
                  <p style={{ fontSize: '14px' }}>Ask me anything about trading strategies</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                        flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
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
                        }}>
                          <img src={yellowLogo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, maxWidth: '70%' }}>
                        <div style={{
                          padding: '16px 20px',
                          borderRadius: message.role === 'user' 
                            ? '20px 20px 4px 20px' 
                            : '20px 20px 20px 4px',
                          backgroundColor: message.role === 'user' 
                            ? colors.userBubble 
                            : colors.assistantBubble,
                          color: message.role === 'user' ? '#212121' : colors.text,
                          fontSize: '14px',
                          lineHeight: 1.7,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}>
                         {renderMessageContent(message.content, message.id)}
                        
                        {/* Tool Usage Badges - ADD THIS SECTION */}
                        {message.role === 'assistant' && message.tools_used && message.tools_used.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: `1px solid ${colors.border}`,
                          }}>
                            <span style={{
                              fontSize: '10px',
                              color: colors.textMuted,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginRight: '4px',
                            }}>
                              Tools Used:
                            </span>
                            {message.tools_used.map((tool, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  backgroundColor: colors.inputBg,
                                  border: `1px solid ${colors.border}`,
                                  color: '#FEC00F',
                                  fontSize: '11px',
                                  fontWeight: 500,
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '6px',
                        fontSize: '11px',
                        color: colors.textMuted,
                      }}>
                        <Clock size={12} />
                        {formatTime(message.created_at)}
                      </div>

                      </div>
                      {message.role === 'user' && (
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FEC00F 0%, #FFD740 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#212121',
                          fontSize: '14px',
                          flexShrink: 0,
                        }}>
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <img src={yellowLogo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{
                        padding: '16px 20px',
                        borderRadius: '20px 20px 20px 4px',
                        backgroundColor: colors.assistantBubble,
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

            {/* Input Area */}
            <div style={{
              padding: '20px 24px',
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBg,
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end',
              }}>
                {/* File upload button */}
                <button
                  onClick={handleFileUpload}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEC00F';
                    e.currentTarget.style.borderColor = '#FEC00F';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.inputBg;
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <Paperclip size={18} color={colors.textMuted} />
                </button>

                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Describe your trading strategy or ask a question..."
                    style={{
                      width: '100%',
                      minHeight: '56px',
                      maxHeight: '200px',
                      padding: '16px 60px 16px 20px',
                      backgroundColor: colors.inputBg,
                      border: `2px solid ${colors.border}`,
                      borderRadius: '16px',
                      color: colors.text,
                      fontSize: '14px',
                      fontFamily: "'Quicksand', sans-serif",
                      outline: 'none',
                      resize: 'none',
                      lineHeight: 1.5,
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FEC00F';
                      e.target.style.boxShadow = '0 0 0 3px rgba(254,192,15,0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      bottom: '12px',
                      width: '40px',
                      height: '40px',
                      backgroundColor: input.trim() && !loading ? '#FEC00F' : colors.border,
                      border: 'none',
                      borderRadius: '12px',
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
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Send size={18} color={input.trim() && !loading ? '#212121' : colors.textMuted} />
                  </button>
                </div>
              </div>
              <p style={{
                fontSize: '11px',
                color: colors.textMuted,
                marginTop: '12px',
                textAlign: 'center',
              }}>
                Press <kbd style={{ 
                  backgroundColor: colors.inputBg, 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: `1px solid ${colors.border}`,
                }}>Enter</kbd> to send, <kbd style={{ 
                  backgroundColor: colors.inputBg, 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: `1px solid ${colors.border}`,
                }}>Shift + Enter</kbd> for new line
              </p>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textMuted,
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '24px',
              overflow: 'hidden',
              marginBottom: '24px',
              opacity: 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={yellowLogo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: '16px', color: colors.text, marginBottom: '8px' }}>
              Welcome to AI Chat
            </p>
            <p style={{ fontSize: '14px' }}>
              Select or create a conversation to start chatting
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}