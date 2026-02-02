/**
 * useStreamingChat Hook
 * 
 * A custom hook for streaming chat with Vercel AI SDK Data Stream Protocol support.
 * Provides real-time streaming of AI responses with Generative UI components.
 * 
 * Compatible with the Vercel AI SDK patterns but works with our custom backend.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, MessagePart, TextPart, ToolPart, Artifact } from '@/types/api';

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://potomac-analyst-workbench-production.up.railway.app';

interface StreamingMessage extends Message {
  isStreaming?: boolean;
}

interface UseStreamingChatOptions {
  conversationId?: string | null;
  onError?: (error: Error) => void;
  onFinish?: (message: Message) => void;
  onConversationCreated?: (conversationId: string) => void;
}

interface UseStreamingChatReturn {
  messages: StreamingMessage[];
  setMessages: React.Dispatch<React.SetStateAction<StreamingMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  reload: () => Promise<void>;
  conversationId: string | null;
}

/**
 * Parse Vercel AI SDK Data Stream Protocol
 */
function parseStreamChunk(chunk: string): { type: string; data: any } | null {
  // Format: "TYPE:JSON_DATA\n"
  const match = chunk.match(/^([0-9a-e]):(.+)$/);
  if (!match) return null;
  
  const [, typeCode, jsonData] = match;
  
  try {
    const data = JSON.parse(jsonData);
    
    // Map type codes to meaningful names
    const typeMap: Record<string, string> = {
      '0': 'text',
      '2': 'data',
      '3': 'error',
      '9': 'tool_call',
      'a': 'tool_result',
      'd': 'finish_message',
      'e': 'finish_step',
    };
    
    return {
      type: typeMap[typeCode] || 'unknown',
      data
    };
  } catch (e) {
    console.error('Failed to parse stream chunk:', chunk, e);
    return null;
  }
}

/**
 * Custom hook for streaming chat with Vercel AI SDK protocol support
 */
export function useStreamingChat(options: UseStreamingChatOptions = {}): UseStreamingChatReturn {
  const { onError, onFinish, onConversationCreated } = options;
  
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(options.conversationId || null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedTextRef = useRef<string>('');
  const partsRef = useRef<MessagePart[]>([]);
  
  // Update conversation ID when option changes
  useEffect(() => {
    if (options.conversationId !== undefined) {
      setConversationId(options.conversationId);
    }
  }, [options.conversationId]);
  
  /**
   * Stop the current streaming request
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);
  
  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    setError(null);
    setIsLoading(true);
    accumulatedTextRef.current = '';
    partsRef.current = [];
    
    // Create optimistic user message
    const userMessage: StreamingMessage = {
      id: `user-${Date.now()}`,
      conversation_id: conversationId || 'pending',
      role: 'user',
      content: content,
      created_at: new Date().toISOString(),
    };
    
    // Create streaming assistant message placeholder
    const assistantMessage: StreamingMessage = {
      id: `assistant-${Date.now()}`,
      conversation_id: conversationId || 'pending',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
      metadata: {
        parts: [],
      },
    };
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          content,
          conversation_id: conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      // Get conversation ID from header
      const newConversationId = response.headers.get('X-Conversation-Id');
      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId);
        onConversationCreated?.(newConversationId);
      }
      
      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      let currentToolCalls: Map<string, { name: string; args: any }> = new Map();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const parsed = parseStreamChunk(line);
          if (!parsed) continue;
          
          switch (parsed.type) {
            case 'text':
              // Append text
              accumulatedTextRef.current += parsed.data;
              
              // Update the streaming message
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: accumulatedTextRef.current,
                    metadata: {
                      ...updated[lastIdx].metadata,
                      parts: [
                        ...partsRef.current,
                        { type: 'text' as const, text: accumulatedTextRef.current }
                      ],
                    },
                  };
                }
                return updated;
              });
              break;
              
            case 'tool_call':
              // Tool call started
              const toolCallId = parsed.data.toolCallId;
              const toolName = parsed.data.toolName;
              const args = parsed.data.args;
              
              currentToolCalls.set(toolCallId, { name: toolName, args });
              
              // Add loading state for the tool
              if (toolName.startsWith('render_')) {
                const componentType = toolName.replace('render_', '');
                partsRef.current.push({
                  type: `tool-${componentType}` as any,
                  state: 'input-available',
                  output: undefined,
                });
                
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      metadata: {
                        ...updated[lastIdx].metadata,
                        parts: [...partsRef.current],
                      },
                    };
                  }
                  return updated;
                });
              }
              break;
              
            case 'tool_result':
              // Tool call completed
              const resultToolCallId = parsed.data.toolCallId;
              const result = parsed.data.result;
              
              // Check if this is a Generative UI component result
              if (result && result.type && result.type.startsWith('tool-')) {
                // Remove loading state and add completed component
                partsRef.current = partsRef.current.filter(
                  p => p.type !== 'text' || (p as TextPart).text
                );
                
                partsRef.current.push({
                  type: result.type as any,
                  state: result.state || 'output-available',
                  output: result.output,
                } as ToolPart);
                
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      metadata: {
                        ...updated[lastIdx].metadata,
                        parts: [...partsRef.current],
                        artifacts: [
                          ...((updated[lastIdx].metadata as any)?.artifacts || []),
                          result.output ? {
                            type: result.type.replace('tool-', ''),
                            code: result.output.code,
                            language: result.output.language,
                            id: result.output.id,
                          } : null,
                        ].filter(Boolean),
                      },
                    };
                  }
                  return updated;
                });
              }
              
              currentToolCalls.delete(resultToolCallId);
              break;
              
            case 'data':
              // Custom data (conversation info, tools used, etc.)
              const customData = Array.isArray(parsed.data) ? parsed.data[0] : parsed.data;
              
              if (customData.conversation_id) {
                setConversationId(customData.conversation_id);
              }
              
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    conversation_id: customData.conversation_id || updated[lastIdx].conversation_id,
                    tools_used: customData.tools_used,
                    metadata: {
                      ...updated[lastIdx].metadata,
                      has_artifacts: customData.has_artifacts,
                    },
                  };
                }
                return updated;
              });
              break;
              
            case 'error':
              throw new Error(parsed.data);
              
            case 'finish_message':
              // Stream finished
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  const finalMessage = {
                    ...updated[lastIdx],
                    isStreaming: false,
                  };
                  updated[lastIdx] = finalMessage;
                  onFinish?.(finalMessage);
                }
                return updated;
              });
              break;
          }
        }
      }
      
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Request was cancelled, update message state
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              isStreaming: false,
              content: updated[lastIdx].content || '[Message stopped]',
            };
          }
          return updated;
        });
      } else {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        
        // Update message with error state
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              isStreaming: false,
              content: `⚠️ Error: ${error.message}`,
              metadata: { error: true },
            };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, isLoading, onError, onFinish, onConversationCreated]);
  
  /**
   * Reload the last message
   */
  const reload = useCallback(async () => {
    if (messages.length < 2) return;
    
    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove messages after the last user message
    setMessages(prev => prev.slice(0, lastUserMessageIndex));
    
    // Resend the message
    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);
  
  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    stop,
    reload,
    conversationId,
  };
}

export default useStreamingChat;
