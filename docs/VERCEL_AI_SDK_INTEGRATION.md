# Vercel AI SDK Integration Guide

This guide explains how to integrate your Next.js frontend with the Potomac Analyst Workbench backend using the Vercel AI SDK.

## Table of Contents

1. [Overview](#overview)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Frontend Setup](#frontend-setup)
4. [Basic Chat Integration](#basic-chat-integration)
5. [Tool Calling](#tool-calling)
6. [Generative UI Components](#generative-ui-components)
7. [Streaming Protocol](#streaming-protocol)
8. [Error Handling](#error-handling)
9. [Advanced Patterns](#advanced-patterns)

---

## Overview

The backend implements the **Vercel AI SDK Data Stream Protocol** natively, making it fully compatible with:

- `useChat()` hook from `@ai-sdk/react`
- `useCompletion()` hook
- `streamUI()` from `ai/rsc`
- Custom streaming implementations

### Key Features

- ✅ Native AI SDK Data Stream Protocol
- ✅ Tool calling with streaming
- ✅ Generative UI artifacts (React, Mermaid, charts)
- ✅ Conversation persistence
- ✅ Knowledge base integration
- ✅ Multi-step tool use

---

## Backend API Endpoints

### Primary Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Main chat endpoint (AI SDK compatible) |
| `/api/ai/completion` | POST | Text completion endpoint |
| `/api/ai/generate-ui` | POST | Generate UI components |
| `/api/ai/tools` | GET | List available tools |

### Legacy Endpoints (still functional)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat/stream` | POST | Legacy streaming chat |
| `/chat/message` | POST | Legacy non-streaming chat |

---

## Frontend Setup

### 1. Install Dependencies

```bash
npm install ai @ai-sdk/react
# or
pnpm add ai @ai-sdk/react
# or
yarn add ai @ai-sdk/react
```

### 2. Configure API Client

Create a utility file for API configuration:

```typescript
// lib/api-config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});
```

### 3. Create Auth Context (if not already)

```typescript
// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) setToken(savedToken);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setToken(data.access_token);
    localStorage.setItem('auth_token', data.access_token);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

---

## Basic Chat Integration

### Using `useChat()` Hook

The simplest way to integrate with the backend:

```typescript
// components/Chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api-config';

export default function Chat() {
  const { token } = useAuth();
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `${API_BASE_URL}/api/ai/chat`,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: {
      // Optional: pass conversation_id to continue existing conversation
      // conversation_id: 'existing-conversation-id',
      include_kb: true, // Include knowledge base context
    },
    onFinish: (message) => {
      console.log('Message complete:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-auto max-w-[80%]' 
                : 'bg-gray-100 max-w-[80%]'
            }`}
          >
            <div className="font-medium mb-1">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything about trading or AFL..."
            className="flex-1 p-2 border rounded-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-100 text-red-700">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
```

### Accessing Conversation ID

The backend returns the conversation ID in the response header:

```typescript
const { messages, ... } = useChat({
  api: `${API_BASE_URL}/api/ai/chat`,
  onResponse: (response) => {
    const conversationId = response.headers.get('X-Conversation-Id');
    if (conversationId) {
      // Store for later use
      setConversationId(conversationId);
    }
  },
});
```

---

## Tool Calling

The backend supports various tools that the AI can use. Tool calls are streamed in real-time.

### Handling Tool Invocations

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { ToolInvocation } from 'ai';

export default function ChatWithTools() {
  const { messages, input, handleSubmit, ... } = useChat({
    api: `${API_BASE_URL}/api/ai/chat`,
    maxSteps: 5, // Allow up to 5 tool use steps
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {/* Regular content */}
          {message.content && <p>{message.content}</p>}
          
          {/* Tool invocations */}
          {message.toolInvocations?.map((tool: ToolInvocation) => (
            <ToolInvocationDisplay key={tool.toolCallId} tool={tool} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ToolInvocationDisplay({ tool }: { tool: ToolInvocation }) {
  // Tool states: 'call' | 'partial-call' | 'result'
  
  if (tool.state === 'call' || tool.state === 'partial-call') {
    return (
      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
        <div className="font-medium">🔧 Using: {tool.toolName}</div>
        <pre className="text-xs mt-1 overflow-x-auto">
          {JSON.stringify(tool.args, null, 2)}
        </pre>
        {tool.state === 'call' && <div className="animate-pulse">Executing...</div>}
      </div>
    );
  }
  
  if (tool.state === 'result') {
    return (
      <div className="p-3 bg-green-50 rounded border border-green-200">
        <div className="font-medium">✅ {tool.toolName} Result</div>
        <pre className="text-xs mt-1 overflow-x-auto">
          {typeof tool.result === 'string' 
            ? tool.result 
            : JSON.stringify(tool.result, null, 2)}
        </pre>
      </div>
    );
  }
  
  return null;
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the internet for information |
| `get_stock_data` | Get real-time stock prices and history |
| `search_knowledge_base` | Search user's uploaded documents |
| `generate_afl_code` | Generate AmiBroker AFL code |
| `validate_afl` | Validate AFL syntax |
| `debug_afl_code` | Debug and fix AFL code |
| `explain_afl_code` | Explain AFL code in plain English |
| `execute_python` | Run Python calculations |

---

## Generative UI Components

The backend can generate and stream UI artifacts (React components, charts, diagrams).

### Detecting and Rendering Artifacts

Artifacts are sent via the data stream protocol as custom data:

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for artifact renderers
const MermaidRenderer = dynamic(() => import('./MermaidRenderer'), { ssr: false });
const ReactComponentRenderer = dynamic(() => import('./ReactComponentRenderer'), { ssr: false });

interface Artifact {
  type: 'artifact';
  artifactType: string;
  id: string;
  language: string;
  content: string;
}

export default function ChatWithArtifacts() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  
  const { messages, data, ... } = useChat({
    api: `${API_BASE_URL}/api/ai/chat`,
    onFinish: (message, { finishReason }) => {
      // Data contains streamed artifacts
      if (data) {
        const newArtifacts = data
          .flat()
          .filter((item: any) => item?.type === 'artifact');
        setArtifacts(prev => [...prev, ...newArtifacts]);
      }
    },
  });

  return (
    <div className="flex">
      {/* Chat panel */}
      <div className="flex-1">
        {messages.map(msg => (
          <MessageDisplay key={msg.id} message={msg} />
        ))}
      </div>
      
      {/* Artifacts panel */}
      {artifacts.length > 0 && (
        <div className="w-1/2 border-l p-4">
          <h3 className="font-bold mb-4">Generated Components</h3>
          {artifacts.map((artifact) => (
            <ArtifactRenderer key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  switch (artifact.artifactType) {
    case 'react':
      return <ReactComponentRenderer code={artifact.content} />;
    case 'mermaid':
      return <MermaidRenderer code={artifact.content} />;
    case 'html':
      return <HTMLRenderer code={artifact.content} />;
    case 'code':
      return <CodeBlock code={artifact.content} language={artifact.language} />;
    default:
      return <pre>{artifact.content}</pre>;
  }
}
```

### React Component Renderer

For rendering generated React components safely:

```typescript
// components/ReactComponentRenderer.tsx
'use client';

import { useEffect, useRef } from 'react';

interface Props {
  code: string;
}

export default function ReactComponentRenderer({ code }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    // Try to find the default export
    if (typeof App !== 'undefined') {
      root.render(<App />);
    } else if (typeof Component !== 'undefined') {
      root.render(<Component />);
    }
  </script>
</body>
</html>`;

    iframeRef.current.srcdoc = html;
  }, [code]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 text-sm font-medium">
        React Component Preview
      </div>
      <iframe
        ref={iframeRef}
        className="w-full min-h-[300px] bg-white"
        sandbox="allow-scripts"
        title="React Component Preview"
      />
    </div>
  );
}
```

### Mermaid Diagram Renderer

```typescript
// components/MermaidRenderer.tsx
'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface Props {
  code: string;
}

export default function MermaidRenderer({ code }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    
    if (containerRef.current) {
      mermaid.render(`mermaid-${Date.now()}`, code).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      });
    }
  }, [code]);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
```

---

## Streaming Protocol

The backend uses the AI SDK Data Stream Protocol. Here's how the data is formatted:

### Protocol Format

```
{type}:{JSON value}\n
```

### Type Codes

| Code | Type | Description |
|------|------|-------------|
| `0` | Text | Text content delta |
| `2` | Data | Custom data array (artifacts, metadata) |
| `3` | Error | Error message |
| `7` | Tool Call Start | Tool call streaming begins |
| `8` | Tool Call Delta | Tool argument chunk |
| `9` | Tool Call | Complete tool call |
| `a` | Tool Result | Tool execution result |
| `d` | Finish Message | Stream complete with usage |
| `e` | Finish Step | Step complete (for multi-step) |
| `f` | Start Step | New step begins |

### Example Stream

```
f:{"messageId":"msg_123"}
0:"Hello"
0:", I'll help you "
0:"create an AFL strategy."
7:{"toolCallId":"tc_1","toolName":"generate_afl_code"}
8:{"toolCallId":"tc_1","argsTextDelta":"{\\"description\\":"}
8:{"toolCallId":"tc_1","argsTextDelta":"\\"RSI strategy\\"}"}
9:{"toolCallId":"tc_1","toolName":"generate_afl_code","args":{"description":"RSI strategy"}}
a:{"toolCallId":"tc_1","result":"...AFL code..."}
0:"Here's your AFL code..."
2:[{"type":"artifact","artifactType":"code","content":"...","language":"afl"}]
d:{"finishReason":"stop","usage":{"promptTokens":150,"completionTokens":500}}
```

---

## Error Handling

### Backend Errors

```typescript
const { messages, error, reload } = useChat({
  api: `${API_BASE_URL}/api/ai/chat`,
  onError: (error) => {
    console.error('Chat error:', error);
    
    // Handle specific errors
    if (error.message.includes('401')) {
      // Token expired - redirect to login
      router.push('/login');
    } else if (error.message.includes('429')) {
      // Rate limited
      toast.error('Rate limited. Please wait a moment.');
    }
  },
});

// Retry failed message
if (error) {
  return (
    <button onClick={() => reload()}>
      Retry
    </button>
  );
}
```

### Network Errors

```typescript
// Wrap chat in error boundary
import { ErrorBoundary } from 'react-error-boundary';

function ChatErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-50 text-red-700 rounded-lg">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ErrorBoundary FallbackComponent={ChatErrorFallback}>
      <Chat />
    </ErrorBoundary>
  );
}
```

---

## Advanced Patterns

### Custom Fetch for Authentication Refresh

```typescript
const { messages, ... } = useChat({
  api: `${API_BASE_URL}/api/ai/chat`,
  fetch: async (url, options) => {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Handle token refresh
    if (response.status === 401) {
      const newToken = await refreshToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }
    
    return response;
  },
});
```

### Streaming with Server Actions (App Router)

```typescript
// app/actions/chat.ts
'use server';

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function chat(messages: any[]) {
  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
    system: 'You are a helpful trading assistant...',
  });
  
  return result.toDataStreamResponse();
}
```

### Using with React Server Components

```typescript
// app/chat/page.tsx
import { Suspense } from 'react';
import ChatClient from './ChatClient';

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatClient />
    </Suspense>
  );
}
```

### Persisting Conversations

```typescript
function usePersistedChat(conversationId?: string) {
  const [convId, setConvId] = useState(conversationId);
  
  const chat = useChat({
    api: `${API_BASE_URL}/api/ai/chat`,
    body: {
      conversation_id: convId,
    },
    onResponse: (response) => {
      const newConvId = response.headers.get('X-Conversation-Id');
      if (newConvId && !convId) {
        setConvId(newConvId);
        // Update URL without reload
        window.history.replaceState({}, '', `/chat/${newConvId}`);
      }
    },
  });
  
  return { ...chat, conversationId: convId };
}
```

---

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
# or for production
NEXT_PUBLIC_API_URL=https://your-api-domain.railway.app
```

### Backend (.env)

```env
# Optional: Use Vercel AI Gateway
VERCEL_AI_GATEWAY_URL=https://gateway.ai.vercel.app/v1

# Anthropic API Key (if not using user-provided keys)
ANTHROPIC_API_KEY=sk-ant-...

# Default model
DEFAULT_AI_MODEL=claude-sonnet-4-20250514
```

---

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend CORS is configured for your frontend domain
2. **401 Unauthorized**: Check that the auth token is being sent correctly
3. **Stream Not Working**: Verify `Content-Type: text/plain` header is present
4. **Tools Not Executing**: Check that tool names match backend definitions

### Debug Mode

Enable verbose logging:

```typescript
const { messages, ... } = useChat({
  api: `${API_BASE_URL}/api/ai/chat`,
  onResponse: (response) => {
    console.log('Response headers:', Object.fromEntries(response.headers));
  },
  onFinish: (message, { finishReason, usage }) => {
    console.log('Finish:', { finishReason, usage });
  },
  experimental_onToolCall: async ({ toolCall }) => {
    console.log('Tool call:', toolCall);
  },
});
```

---

## Migration from Legacy Endpoints

If migrating from the old `/chat/stream` endpoint:

```typescript
// Old way
const response = await fetch('/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ content: message, conversation_id: convId }),
});

// New way with AI SDK
const { messages, handleSubmit } = useChat({
  api: '/api/ai/chat',
  body: { conversation_id: convId },
});
```

The new endpoint:
- Uses standard AI SDK message format
- Supports proper tool calling protocol
- Streams artifacts as structured data
- Returns conversation ID in headers
