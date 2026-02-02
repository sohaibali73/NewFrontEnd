# Frontend Integration Guide

Complete documentation for integrating AFL Generator, Reverse Engineer, and Chat pages with the backend API.

---

## Table of Contents
1. [API Client Setup](#api-client-setup)
2. [Error Handling Pattern](#error-handling-pattern)
3. [AFL Generator Page](#afl-generator-page)
4. [Reverse Engineer Page](#reverse-engineer-page)
5. [Chat Page (Streaming)](#chat-page-streaming)

---

## API Client Setup

### Base Configuration
```typescript
// lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api.railway.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

---

## Error Handling Pattern

**CRITICAL: All pages must use this error handling helper to avoid `[object Object]` errors.**

```typescript
// Helper to format error messages properly
const formatErrorMessage = (err: unknown): string => {
  // Standard Error object
  if (err instanceof Error) {
    return err.message;
  }
  
  // Plain string
  if (typeof err === 'string') {
    return err;
  }
  
  // Axios error response or API error object
  if (err && typeof err === 'object') {
    const errorObj = err as Record<string, any>;
    
    // Axios wraps errors in response.data
    if (errorObj.response?.data) {
      const data = errorObj.response.data;
      if (typeof data === 'string') return data;
      if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      if (data.message) return String(data.message);
      if (data.error) return String(data.error);
    }
    
    // Direct error object from API
    if (errorObj.detail) {
      return typeof errorObj.detail === 'string' ? errorObj.detail : JSON.stringify(errorObj.detail);
    }
    if (errorObj.message) return String(errorObj.message);
    if (errorObj.error) return String(errorObj.error);
    
    // Last resort
    try {
      return JSON.stringify(err);
    } catch {
      return 'An unknown error occurred';
    }
  }
  
  return 'An unexpected error occurred';
};
```

---

## AFL Generator Page

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/afl/generate` | Generate AFL code |
| POST | `/afl/optimize` | Optimize existing code |
| POST | `/afl/debug` | Debug code with error |
| POST | `/afl/explain` | Explain code |
| POST | `/afl/validate` | Validate syntax |
| POST | `/afl/upload` | Upload reference file |
| GET | `/afl/files` | List uploaded files |
| GET | `/afl/history` | Get generation history |

### Generate AFL Request

```typescript
interface BacktestSettings {
  initial_equity: number;        // Default: 100000
  position_size: string;         // Default: "100"
  position_size_type: string;    // "spsPercentOfEquity" | "spsShares" | "spsValue"
  max_positions: number;         // Default: 10
  commission: number;            // Default: 0.001 (0.1%)
  trade_delays: [number, number, number, number];  // [buy, sell, short, cover]
  margin_requirement: number;    // Default: 100
}

interface GenerateRequest {
  prompt: string;                          // Strategy description (10-1000 chars)
  strategy_type: 'standalone' | 'composite';
  backtest_settings?: BacktestSettings;
  uploaded_file_ids?: string[];            // IDs from /afl/upload
  stream?: boolean;                        // Enable SSE streaming
}

// API Call
const generateAFL = async (request: GenerateRequest) => {
  try {
    const response = await apiClient.post('/afl/generate', request);
    return response.data;
  } catch (err) {
    throw new Error(formatErrorMessage(err));
  }
};
```

### Generate AFL Response

```typescript
interface GenerateResponse {
  code: string;           // The generated AFL code (use this!)
  afl_code: string;       // Same as code (backward compat)
  explanation: string;    // Strategy explanation
  stats: {
    quality_score: number;
    line_count: number;
    has_buy_sell: boolean;
    has_position_sizing: boolean;
    has_stops: boolean;
  };
}
```

### Complete AFL Generator Component

```tsx
import React, { useState } from 'react';
import apiClient from '@/lib/api';

export function AFLGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [strategyType, setStrategyType] = useState<'standalone' | 'composite'>('standalone');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  
  const [backtestSettings, setBacktestSettings] = useState({
    initial_equity: 100000,
    position_size: "100",
    position_size_type: "spsPercentOfEquity",
    max_positions: 10,
    commission: 0.001,
    trade_delays: [0, 0, 0, 0] as [number, number, number, number],
    margin_requirement: 100,
  });

  // CRITICAL: Use this helper for all error handling
  const formatErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const e = err as any;
      if (e.response?.data?.detail) return String(e.response.data.detail);
      if (e.response?.data?.message) return String(e.response.data.message);
      if (e.detail) return String(e.detail);
      if (e.message) return String(e.message);
      try { return JSON.stringify(err); } catch { return 'Unknown error'; }
    }
    return 'Failed to generate code';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your strategy');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post('/afl/generate', {
        prompt: prompt,
        strategy_type: strategyType,
        backtest_settings: backtestSettings,
      });
      
      // Use 'code' field (or 'afl_code' for backward compat)
      setGeneratedCode(response.data.code || response.data.afl_code || '');
      
    } catch (err) {
      // ALWAYS use formatErrorMessage - never display raw error objects
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your trading strategy..."
      />
      
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate AFL'}
      </button>
      
      {generatedCode && (
        <pre><code>{generatedCode}</code></pre>
      )}
    </div>
  );
}
```

---

## Reverse Engineer Page

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reverse-engineer/start` | Start new RE session |
| POST | `/reverse-engineer/continue` | Continue conversation |
| POST | `/reverse-engineer/research/{id}` | Conduct web research |
| POST | `/reverse-engineer/schematic/{id}` | Generate schematic |
| POST | `/reverse-engineer/generate-code/{id}` | Generate final AFL |
| GET | `/reverse-engineer/strategy/{id}` | Get strategy details |
| GET | `/reverse-engineer/history` | Get RE history |

### Workflow Phases

```
1. clarification → User describes strategy, AI asks clarifying questions
2. findings      → AI researches and presents findings
3. schematic     → AI generates visual schematic (Mermaid diagram)
4. coding        → AI generates final AFL code
```

### Start Request/Response

```typescript
// Request - Use ONE of these fields
interface StartRequest {
  query?: string;        // Preferred
  message?: string;      // Alternative
  description?: string;  // Alternative
}

// Response
interface StartResponse {
  strategy_id: string;       // IMPORTANT: Save this!
  conversation_id: string;
  phase: 'clarification';
  response: string;          // AI's clarifying questions
}
```

### Continue Request/Response

```typescript
// Request - Use strategy_id from start response
interface ContinueRequest {
  strategy_id: string;   // Required
  message: string;       // User's answer/message
}

// Response
interface ContinueResponse {
  strategy_id: string;
  phase: string;         // Current phase
  response: string;      // AI response
}
```

### Schematic Response (with Mermaid)

```typescript
interface SchematicResponse {
  strategy_id: string;
  phase: 'schematic';
  schematic: {
    strategy_name: string;
    strategy_type: string;
    timeframe: string;
    mermaid_diagram: string;  // Mermaid code for rendering
  };
  mermaid_diagram: string;    // Also at top level
  response: string;
}
```

### Complete Reverse Engineer Component

```tsx
import React, { useState } from 'react';
import apiClient from '@/lib/api';
import mermaid from 'mermaid';

type Phase = 'idle' | 'clarification' | 'findings' | 'schematic' | 'coding';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  mermaid?: string;
}

export function ReverseEngineerPage() {
  const [query, setQuery] = useState('');
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [mermaidDiagram, setMermaidDiagram] = useState('');

  const formatErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const e = err as any;
      if (e.response?.data?.detail) return String(e.response.data.detail);
      if (e.detail) return String(e.detail);
      if (e.message) return String(e.message);
    }
    return 'An error occurred';
  };

  // Start new reverse engineering session
  const handleStart = async () => {
    if (!query.trim()) {
      setError('Please describe the strategy you want to reverse engineer');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post('/reverse-engineer/start', {
        query: query  // Use 'query' field
      });
      
      setStrategyId(response.data.strategy_id);  // Save this!
      setPhase(response.data.phase);
      setMessages([
        { role: 'user', content: query },
        { role: 'assistant', content: response.data.response }
      ]);
      
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Continue conversation
  const handleContinue = async (userMessage: string) => {
    if (!strategyId) {
      setError('No active session. Please start a new one.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post('/reverse-engineer/continue', {
        strategy_id: strategyId,  // Required!
        message: userMessage
      });
      
      setPhase(response.data.phase);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.data.response }
      ]);
      
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Generate schematic with Mermaid diagram
  const handleGenerateSchematic = async () => {
    if (!strategyId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post(`/reverse-engineer/schematic/${strategyId}`);
      
      setPhase('schematic');
      setMermaidDiagram(response.data.mermaid_diagram);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: response.data.response,
          mermaid: response.data.mermaid_diagram
        }
      ]);
      
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Generate final AFL code
  const handleGenerateCode = async () => {
    if (!strategyId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post(`/reverse-engineer/generate-code/${strategyId}`);
      
      setPhase('coding');
      setGeneratedCode(response.data.code);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Generated AFL Code:\n\n\`\`\`afl\n${response.data.code}\n\`\`\`` }
      ]);
      
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      
      {phase === 'idle' && (
        <div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the strategy to reverse engineer (e.g., 'Turtle Trading System')"
          />
          <button onClick={handleStart} disabled={loading}>
            {loading ? 'Starting...' : 'Start Analysis'}
          </button>
        </div>
      )}
      
      {/* Chat messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div>{msg.content}</div>
            {msg.mermaid && <MermaidDiagram code={msg.mermaid} />}
          </div>
        ))}
      </div>
      
      {/* Phase-specific actions */}
      {phase === 'clarification' && (
        <button onClick={handleGenerateSchematic} disabled={loading}>
          Generate Schematic
        </button>
      )}
      
      {phase === 'schematic' && (
        <button onClick={handleGenerateCode} disabled={loading}>
          Generate AFL Code
        </button>
      )}
      
      {generatedCode && (
        <pre><code>{generatedCode}</code></pre>
      )}
    </div>
  );
}

// Mermaid diagram component
function MermaidDiagram({ code }: { code: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (ref.current && code) {
      mermaid.render(`mermaid-${Date.now()}`, code).then(({ svg }) => {
        ref.current!.innerHTML = svg;
      }).catch(console.error);
    }
  }, [code]);
  
  return <div ref={ref} className="mermaid-diagram" />;
}
```

---

## Chat Page (Streaming)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/stream` | **Streaming chat** (preferred) |
| POST | `/chat/message` | Non-streaming chat |
| GET | `/chat/conversations` | List conversations |
| POST | `/chat/conversations` | Create conversation |
| GET | `/chat/conversations/{id}/messages` | Get messages |
| DELETE | `/chat/conversations/{id}` | Delete conversation |

### Streaming Protocol (Vercel AI SDK Data Stream)

The `/chat/stream` endpoint uses the **Vercel AI SDK Data Stream Protocol**:

```
0:"text chunk"              # Text content
9:{"tool":"name","args":{}} # Tool call
a:{"id":"...","result":"..."}  # Tool result
e:{"finishReason":"stop","usage":{...}}  # Finish
d:{"conversation_id":"..."}    # Custom data
```

### Stream Request

```typescript
interface StreamRequest {
  content: string;           // User message
  conversation_id?: string;  // Optional - creates new if not provided
}
```

### Complete Chat Component with Streaming

```tsx
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'complete';
  result?: string;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const e = err as any;
      if (e.message) return e.message;
    }
    return 'An error occurred';
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMessage = input.trim();
    setInput('');
    setError('');
    
    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userMessage
    }]);
    
    // Add placeholder for assistant
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true
    }]);
    
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: userMessage,
          conversation_id: conversationId
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      // Get conversation ID from header
      const newConvId = response.headers.get('X-Conversation-Id');
      if (newConvId) setConversationId(newConvId);
      
      // Process the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Parse Vercel AI SDK format: type:data
          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) continue;
          
          const type = line.substring(0, colonIndex);
          const data = line.substring(colonIndex + 1);
          
          switch (type) {
            case '0': // Text chunk
              try {
                const text = JSON.parse(data);
                accumulatedContent += text;
                // Update the streaming message
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              } catch {}
              break;
              
            case '9': // Tool call
              try {
                const toolData = JSON.parse(data);
                setToolCalls(prev => [...prev, {
                  id: toolData.toolCallId,
                  name: toolData.toolName,
                  status: 'pending'
                }]);
              } catch {}
              break;
              
            case 'a': // Tool result
              try {
                const resultData = JSON.parse(data);
                setToolCalls(prev => prev.map(tc =>
                  tc.id === resultData.toolCallId
                    ? { ...tc, status: 'complete', result: resultData.result }
                    : tc
                ));
              } catch {}
              break;
              
            case 'd': // Custom data (includes conversation_id)
              try {
                const customData = JSON.parse(data);
                if (customData.conversation_id) {
                  setConversationId(customData.conversation_id);
                }
              } catch {}
              break;
              
            case 'e': // Finish
              // Stream complete
              break;
              
            case '3': // Error
              try {
                const errorMsg = JSON.parse(data);
                setError(errorMsg);
              } catch {}
              break;
          }
        }
      }
      
      // Mark streaming complete
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId
          ? { ...msg, isStreaming: false }
          : msg
      ));
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, content: msg.content + '\n\n(Cancelled)', isStreaming: false }
            : msg
        ));
      } else {
        setError(formatErrorMessage(err));
        // Remove failed assistant message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="chat-container">
      {error && <div className="error-banner">{error}</div>}
      
      {/* Messages */}
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="content">
              {msg.content}
              {msg.isStreaming && <span className="cursor">▌</span>}
            </div>
          </div>
        ))}
      </div>
      
      {/* Tool calls indicator */}
      {toolCalls.length > 0 && (
        <div className="tool-calls">
          {toolCalls.map(tc => (
            <div key={tc.id} className={`tool-call ${tc.status}`}>
              🔧 {tc.name}: {tc.status === 'pending' ? 'Running...' : 'Complete'}
            </div>
          ))}
        </div>
      )}
      
      {/* Input */}
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about trading strategies, AFL code, markets..."
          disabled={isStreaming}
        />
        
        {isStreaming ? (
          <button onClick={handleCancel} className="cancel-btn">
            Cancel
          </button>
        ) : (
          <button onClick={handleSend} disabled={!input.trim()}>
            Send
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Summary of Critical Patterns

### 1. Always Use Error Formatter
```typescript
// WRONG - will show [object Object]
catch (err) {
  setError(err);
}

// CORRECT
catch (err) {
  setError(formatErrorMessage(err));
}
```

### 2. AFL Generator Response Fields
```typescript
// Use 'code' field (primary)
const afl = response.data.code;

// Or 'afl_code' for backward compatibility
const afl = response.data.code || response.data.afl_code;
```

### 3. Reverse Engineer - Save strategy_id
```typescript
// From /start response
const strategyId = response.data.strategy_id;

// Use in ALL subsequent calls
await api.post('/reverse-engineer/continue', {
  strategy_id: strategyId,  // Required!
  message: userInput
});
```

### 4. Chat Streaming - Handle All Types
```
0: text         → Update message content
9: tool_call    → Show tool indicator
a: tool_result  → Mark tool complete
d: custom_data  → Get conversation_id
e: finish       → Mark complete
3: error        → Show error
```

### 5. Conversation ID Header
```typescript
const convId = response.headers.get('X-Conversation-Id');
```
