# Backend API Guide for SwiftUI Native Frontend

> **Purpose**: This document provides a comprehensive guide for an LLM building a SwiftUI native frontend to integrate with the Potomac Analyst Workbench backend.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Base URL & Configuration](#2-base-url--configuration)
3. [Authentication](#3-authentication)
4. [API Routes Reference](#4-api-routes-reference)
5. [Streaming Responses](#5-streaming-responses)
6. [Tool System](#6-tool-system)
7. [Data Models](#7-data-models)
8. [Error Handling](#8-error-handling)
9. [Swift Implementation Patterns](#9-swift-implementation-patterns)

---

## 1. Architecture Overview

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Framework** | FastAPI (Python) |
| **Database** | Supabase (PostgreSQL with REST API) |
| **AI Provider** | Anthropic Claude (claude-sonnet-4-20250514) |
| **Authentication** | JWT (self-managed, not Supabase Auth) |
| **Streaming** | Vercel AI SDK Data Stream Protocol |
| **File Storage** | Database (base64) + Supabase Storage |

### Key Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│                     SwiftUI Native App                          │
├─────────────────────────────────────────────────────────────────┤
│  - URLSession for HTTP requests                                 │
│  - Async/Await for non-blocking operations                      │
│  - URLSessionWebSocketTask for streaming (optional)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                              │
├─────────────────────────────────────────────────────────────────┤
│  Routers:                                                       │
│  ├── /auth     - Registration, Login, User Management          │
│  ├── /chat     - Conversations, Messages, Streaming            │
│  ├── /afl      - AFL Code Generation, History, Settings        │
│  ├── /brain    - Knowledge Base (Document Upload/Search)       │
│  ├── /backtest - Backtest Analysis                             │
│  ├── /researcher - Company Research                            │
│  └── /presentations - PowerPoint Generation                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ Supabase │    │  Claude  │    │  External│
     │   DB     │    │   API    │    │   APIs   │
     └──────────┘    └──────────┘    └──────────┘
```

---

## 2. Base URL & Configuration

### Environment Configuration

The backend runs on FastAPI with Uvicorn. Default port is `8000`.

```swift
enum APIConfiguration {
    // Development
    static let baseURL = "http://localhost:8000"
    
    // Production (example)
    static let baseURL = "https://api.potomac-analyst.com"
    
    // Headers
    static func defaultHeaders(token: String? = nil) -> [String: String] {
        var headers = ["Content-Type": "application/json"]
        if let token = token {
            headers["Authorization"] = "Bearer \(token)"
        }
        return headers
    }
}
```

### Root Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info, version, router status |
| `/health` | GET | Health check |
| `/routes` | GET | List all available routes |
| `/debug/routers` | GET | Router loading status |

---

## 3. Authentication

### Overview

- **Type**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Token Lifetime**: 7 days ( configurable via `access_token_expire_minutes`)
- **Storage**: Store securely in Keychain (Swift)

### Auth Endpoints

#### Register New User

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "nickname": "john",
  "claude_api_key": "sk-ant-...",  // Optional: user's own Claude key
  "tavily_api_key": "tvly-..."     // Optional: user's own Tavily key
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "uuid-here",
  "email": "user@example.com",
  "expires_in": 604800
}
```

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** Same as registration.

#### Get Current User

```
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "nickname": "john",
  "created_at": "2024-01-15T10:30:00",
  "last_active": "2024-01-20T15:45:00",
  "claude_api_key": "sk-ant-...",
  "tavily_api_key": "tvly-..."
}
```

#### Update User

```
PUT /auth/me
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "nickname": "johnny",
  "claude_api_key": "new-key"
}
```

#### Change Password

```
PUT /auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword456"
}
```

#### Forgot Password

```
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### Reset Password

```
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "newSecurePassword456"
}
```

#### Refresh Token

```
POST /auth/refresh-token
Authorization: Bearer <current_token>
```

#### Logout

```
POST /auth/logout
Authorization: Bearer <token>
```

> **Note**: Logout is client-side only (remove token from storage). The backend doesn't maintain a token blacklist.

### Swift Implementation

```swift
import Foundation

class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    private var token: String? {
        get { KeychainHelper.shared.get(key: "auth_token") }
        set { 
            if let value = newValue {
                KeychainHelper.shared.save(key: "auth_token", value: value)
            } else {
                KeychainHelper.shared.delete(key: "auth_token")
            }
        }
    }
    
    func login(email: String, password: String) async throws {
        let url = URL(string: "\(APIConfiguration.baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
            self.token = authResponse.access_token
            self.isAuthenticated = true
            await fetchCurrentUser()
        } else if httpResponse.statusCode == 401 {
            throw AuthError.invalidCredentials
        } else {
            throw AuthError.serverError(httpResponse.statusCode)
        }
    }
    
    func logout() {
        token = nil
        isAuthenticated = false
        currentUser = nil
    }
}
```

---

## 4. API Routes Reference

### 4.1 Chat Routes (`/chat`)

The chat system is the core interaction point with the AI.

#### Get Conversations

```
GET /chat/conversations
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "conv-uuid",
    "user_id": "user-uuid",
    "title": "AFL Strategy Discussion",
    "conversation_type": "agent",
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T11:45:00"
  }
]
```

#### Create Conversation

```
POST /chat/conversations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My New Chat",
  "conversation_type": "agent"
}
```

#### Get Messages

```
GET /chat/conversations/{conversation_id}/messages
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "msg-uuid",
    "conversation_id": "conv-uuid",
    "role": "user",
    "content": "Write me a moving average crossover strategy",
    "created_at": "2024-01-15T10:30:00"
  },
  {
    "id": "msg-uuid-2",
    "conversation_id": "conv-uuid",
    "role": "assistant",
    "content": "Here's an AFL moving average crossover strategy...",
    "metadata": {
      "parts": [
        {"type": "text", "text": "Here's the strategy:"},
        {"type": "tool-code", "state": "output-available", "output": {...}}
      ],
      "artifacts": [...],
      "has_artifacts": true,
      "tools_used": [...]
    },
    "created_at": "2024-01-15T10:30:05"
  }
]
```

#### Send Message (Non-Streaming)

```
POST /chat/message
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Explain RSI indicator in AFL",
  "conversation_id": "conv-uuid"  // Optional: creates new if omitted
}
```

**Response:**
```json
{
  "conversation_id": "conv-uuid",
  "response": "The RSI (Relative Strength Index) is a momentum oscillator...",
  "parts": [
    {"type": "text", "text": "The RSI..."},
    {"type": "tool-code", "state": "output-available", "output": {"code": "...", "language": "afl"}}
  ],
  "tools_used": [
    {
      "tool": "generate_afl_code",
      "input": {"description": "RSI indicator"},
      "result": {...}
    }
  ],
  "all_artifacts": [...]
}
```

#### Stream Message (Recommended)

```
POST /chat/stream
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Generate a MACD strategy",
  "conversation_id": "conv-uuid"  // Optional
}
```

**Response:** Streaming response using Vercel AI SDK Data Stream Protocol. See Section 5 for details.

#### Upload File to Conversation

```
POST /chat/conversations/{conversation_id}/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
- `file`: The file to upload

**Supported File Types:**
- Text files (.txt, .afl, .csv)
- Images (.png, .jpg, .jpeg)
- Documents (.pdf)
- Office files (.pptx, .xlsx, .docx)

**Response:**
```json
{
  "file_id": "file-uuid",
  "filename": "strategy.afl",
  "template_id": "tmpl-uuid",  // Only for .pptx files
  "template_layouts": 5,
  "is_template": true
}
```

#### Update Conversation Title

```
PATCH /chat/conversations/{conversation_id}
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Title"
}
```

#### Delete Conversation

```
DELETE /chat/conversations/{conversation_id}
Authorization: Bearer <token>
```

#### Text-to-Speech

```
POST /chat/tts
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "Text to convert to speech",
  "voice": "en-US-AriaNeural"
}
```

**Response:** MP3 audio stream

**Available Voices:**
- `en-US-AriaNeural` (female, default)
- `en-US-GuyNeural` (male)
- `en-US-JennyNeural` (female)
- `en-GB-SoniaNeural` (British female)
- `en-AU-NatashaNeural` (Australian female)

---

### 4.2 AFL Routes (`/afl`)

#### Generate AFL Code

```
POST /afl/generate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prompt": "Create a moving average crossover strategy with 20 and 50 period SMAs",
  "strategy_type": "standalone",  // or "composite"
  "stream": false,  // Set true for streaming
  "backtest_settings": {
    "initial_equity": 100000,
    "position_size": "100",
    "position_size_type": "spsPercentOfEquity",
    "max_positions": 10,
    "commission": 0.001,
    "trade_delays": [0, 0, 0, 0],
    "margin_requirement": 100
  },
  "uploaded_file_ids": ["file-uuid"],  // Optional: reference uploaded files
  "kb_context": "Additional context from knowledge base"  // Optional
}
```

**Response:**
```json
{
  "code": "// AFL code here...",
  "afl_code": "// Same as code field (backward compatibility)",
  "explanation": "This strategy uses two moving averages...",
  "stats": {
    "quality_score": 85,
    "line_count": 120,
    "has_buy_sell": true,
    "has_plot": true
  }
}
```

#### Streaming AFL Generation

Set `stream: true` in the request. The response will be a Server-Sent Events stream.

#### Optimize AFL Code

```
POST /afl/optimize
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "// Your AFL code here"
}
```

#### Debug AFL Code

```
POST /afl/debug
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "// AFL code with errors",
  "error_message": "Line 15: Undefined variable 'MA'"
}
```

#### Explain AFL Code

```
POST /afl/explain
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "// AFL code to explain"
}
```

#### Validate AFL Code

```
POST /afl/validate
```

> **Note**: No auth required for validation (local operation)

**Request Body:**
```json
{
  "code": "// AFL code to validate"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": ["Consider using SetOption for position sizing"],
  "line_count": 45,
  "has_buy_sell": true,
  "has_plot": false
}
```

#### Get AFL Codes (Saved)

```
GET /afl/codes
Authorization: Bearer <token>
```

#### Get Single AFL Code

```
GET /afl/codes/{code_id}
Authorization: Bearer <token>
```

#### Delete AFL Code

```
DELETE /afl/codes/{code_id}
Authorization: Bearer <token>
```

#### AFL History

```
GET /afl/history
Authorization: Bearer <token>
```

```
POST /afl/history
Authorization: Bearer <token>
```

```
DELETE /afl/history/{history_id}
Authorization: Bearer <token>
```

#### Upload File for AFL Context

```
POST /afl/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Supported Types:** CSV, TXT, PDF, AFL files

#### Settings Presets

```
GET /afl/settings/presets
POST /afl/settings/presets
GET /afl/settings/presets/{preset_id}
PUT /afl/settings/presets/{preset_id}
DELETE /afl/settings/presets/{preset_id}
POST /afl/settings/presets/{preset_id}/set-default
```

---

### 4.3 Brain/Knowledge Base Routes (`/brain`)

#### Upload Document

```
POST /brain/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
- `file`: File to upload
- `title`: Optional title
- `category`: Optional category (default: "general")

**Response:**
```json
{
  "status": "success",
  "document_id": "doc-uuid",
  "classification": {
    "category": "strategy",
    "confidence": 0.85,
    "summary": "This document describes a momentum strategy..."
  },
  "chunks_created": 25
}
```

#### Batch Upload

```
POST /brain/upload-batch
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
- `files`: Multiple files
- `category`: Optional category

#### Upload Text Directly

```
POST /brain/upload-text
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My Strategy Notes",
  "content": "Long text content here...",
  "category": "strategy"
}
```

#### Search Knowledge Base

```
POST /brain/search
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "query": "moving average crossover",
  "category": "strategy",  // Optional
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-uuid",
      "title": "MA Crossover Strategy",
      "category": "strategy",
      "summary": "Description...",
      "created_at": "2024-01-15T10:30:00"
    }
  ],
  "count": 1
}
```

#### List Documents

```
GET /brain/documents?category=strategy&limit=50
Authorization: Bearer <token>
```

#### Get Stats

```
GET /brain/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_documents": 45,
  "total_size": 1250000,
  "total_chunks": 1250,
  "total_learnings": 15,
  "categories": {
    "strategy": 20,
    "indicator": 15,
    "general": 10
  }
}
```

#### Delete Document

```
DELETE /brain/documents/{document_id}
Authorization: Bearer <token>
```

---

### 4.4 Backtest Routes (`/backtest`)

#### Upload Backtest Results

```
POST /backtest/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
- `file`: Backtest results file (CSV, TXT)
- `strategy_id`: Optional strategy ID

**Response:**
```json
{
  "backtest_id": "bt-uuid",
  "metrics": {
    "cagr": 15.5,
    "sharpe_ratio": 1.8,
    "max_drawdown": -22.5,
    "win_rate": 58.2,
    "profit_factor": 1.65,
    "total_trades": 245
  },
  "analysis": "The strategy shows strong risk-adjusted returns...",
  "recommendations": [
    {
      "priority": 1,
      "recommendation": "Add volatility filter",
      "expected_impact": "Reduce drawdown by 15%",
      "implementation": "Add ATR-based filter"
    }
  ]
}
```

#### Get Backtest

```
GET /backtest/{backtest_id}
Authorization: Bearer <token>
```

#### Get Strategy Backtests

```
GET /backtest/strategy/{strategy_id}
Authorization: Bearer <token>
```

---

### 4.5 Researcher Routes (`/researcher`)

#### Company Research

```
POST /researcher/company
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "ticker": "AAPL",
  "include_news": true,
  "include_filings": true,
  "include_technicals": true
}
```

---

### 4.6 Presentation Routes (`/presentations`)

#### Generate Presentation

```
POST /presentations/generate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Q4 Investment Thesis",
  "subtitle": "Portfolio Analysis",
  "slides": [
    {
      "title": "Executive Summary",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "notes": "Speaker notes here"
    },
    {
      "title": "Market Overview",
      "bullets": ["S&P 500 up 15%", "Tech sector leads"],
      "layout": "bullets"
    }
  ],
  "theme": "potomac",  // dark, light, corporate, potomac
  "template_id": "tmpl-uuid"  // Optional: brand template
}
```

**Response:**
```json
{
  "success": true,
  "presentation_id": "pres-uuid",
  "filename": "Q4_Investment_Thesis.pptx",
  "download_url": "/api/presentation/pres-uuid"
}
```

#### Download Presentation

```
GET /presentation/{presentation_id}
```

Returns: `.pptx` file binary

---

## 5. Streaming Responses

### Overview

The backend uses the **Vercel AI SDK Data Stream Protocol** for streaming responses. This is essential for real-time chat and code generation.

### Protocol Format

The stream consists of lines in the format:
```
{type_code}:{JSON_payload}\n
```

### Type Codes

| Code | Type | Description |
|------|------|-------------|
| `0` | Text Delta | Streaming text content |
| `2` | Data | Custom data (JSON array) |
| `3` | Error | Error message |
| `7` | Tool Call Start | Beginning of tool call |
| `8` | Tool Call Delta | Streaming tool arguments |
| `9` | Tool Call Complete | Full tool call with args |
| `a` | Tool Result | Tool execution result |
| `d` | Finish Message | End of response with usage |
| `e` | Finish Step | End of a step (multi-step) |
| `f` | Start Step | Beginning of a step |

### Example Stream

```
0:"Hello,"\n
0:" I can help"\n
0:" with your"\n
0:" AFL strategy."\n
9:{"toolCallId":"tool_123","toolName":"generate_afl_code","args":{"description":"MA crossover"}}\n
a:{"toolCallId":"tool_123","result":"{\\"afl_code\\":\\"...\\",\\"success\\":true}"}\n
0:"Here's your strategy:"\n
d:{"finishReason":"stop","usage":{"promptTokens":150,"completionTokens":200}}\n
```

### Swift Implementation

```swift
import Foundation

actor StreamParser {
    private var buffer = ""
    
    func parse(_ chunk: String) -> [StreamEvent] {
        buffer += chunk
        var events: [StreamEvent] = []
        
        while let newlineIndex = buffer.firstIndex(of: "\n") {
            let line = String(buffer[..<newlineIndex])
            buffer = String(buffer[buffer.index(after: newlineIndex)...])
            
            if let event = parseLine(line) {
                events.append(event)
            }
        }
        
        return events
    }
    
    private func parseLine(_ line: String) -> StreamEvent? {
        guard let colonIndex = line.firstIndex(of: ":") else { return nil }
        
        let typeCode = String(line[..<colonIndex])
        let jsonPart = String(line[line.index(after: colonIndex)...])
        
        switch typeCode {
        case "0":
            // Text delta - the JSON is the actual text
            if let text = try? JSONDecoder().decode(String.self, from: jsonPart.data(using: .utf8)!) {
                return .textDelta(text)
            }
            
        case "2":
            // Data
            if let data = try? JSONDecoder().decode([Any].self, from: jsonPart.data(using: .utf8)!) {
                return .data(data)
            }
            
        case "3":
            // Error
            if let error = try? JSONDecoder().decode(String.self, from: jsonPart.data(using: .utf8)!) {
                return .error(error)
            }
            
        case "9":
            // Tool call complete
            if let toolCall = try? JSONDecoder().decode(ToolCall.self, from: jsonPart.data(using: .utf8)!) {
                return .toolCall(toolCall)
            }
            
        case "a":
            // Tool result
            if let toolResult = try? JSONDecoder().decode(ToolResult.self, from: jsonPart.data(using: .utf8)!) {
                return .toolResult(toolResult)
            }
            
        case "d":
            // Finish message
            if let finish = try? JSONDecoder().decode(FinishMessage.self, from: jsonPart.data(using: .utf8)!) {
                return .finish(finish)
            }
            
        default:
            break
        }
        
        return nil
    }
}

enum StreamEvent {
    case textDelta(String)
    case data([Any])
    case error(String)
    case toolCall(ToolCall)
    case toolResult(ToolResult)
    case finish(FinishMessage)
}

struct ToolCall: Codable {
    let toolCallId: String
    let toolName: String
    let args: [String: AnyCodable]
}

struct ToolResult: Codable {
    let toolCallId: String
    let result: String
}

struct FinishMessage: Codable {
    let finishReason: String
    let usage: Usage
}

struct Usage: Codable {
    let promptTokens: Int
    let completionTokens: Int
}
```

### Streaming Request Example

```swift
func streamMessage(content: String, conversationId: String?) async throws -> AsyncThrowingStream<StreamEvent, Error> {
    var urlComponents = URLComponents(string: "\(APIConfiguration.baseURL)/chat/stream")!
    
    var request = URLRequest(url: urlComponents.url!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    
    var body: [String: Any] = ["content": content]
    if let conversationId = conversationId {
        body["conversation_id"] = conversationId
    }
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    return AsyncThrowingStream { continuation in
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }
        task.resume()
    }
}
```

For actual streaming with URLSession, use `URLSessionDataDelegate`:

```swift
class StreamingClient: NSObject, URLSessionDataDelegate {
    private var parser = StreamParser()
    private var continuation: AsyncThrowingStream<StreamEvent, Error>.Continuation?
    
    func stream(request: URLRequest) async throws -> AsyncThrowingStream<StreamEvent, Error> {
        AsyncThrowingStream { continuation in
            self.continuation = continuation
            let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
            let task = session.dataTask(with: request)
            task.resume()
        }
    }
    
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        guard let chunk = String(data: data, encoding: .utf8) else { return }
        
        Task {
            let events = await parser.parse(chunk)
            for event in events {
                continuation?.yield(event)
            }
        }
    }
    
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            continuation?.finish(throwing: error)
        } else {
            continuation?.finish()
        }
    }
}
```

---

## 6. Tool System

### Overview

The backend has 50+ tools that the AI can use. Tools are invoked automatically during chat interactions, but you can also call them directly for specific functionality.

### Tool Categories

#### Financial Tools
- `get_stock_data` - Real-time stock prices
- `get_stock_chart` - OHLCV chart data
- `technical_analysis` - RSI, MACD, Bollinger Bands, etc.
- `screen_stocks` - Filter stocks by criteria
- `compare_stocks` - Side-by-side comparison
- `get_sector_performance` - Sector ETF performance
- `get_market_overview` - Market indices, VIX, commodities
- `get_options_snapshot` - Options data
- `get_options_chain` - Full options chain
- `calculate_position_size` - Risk-based position sizing
- `calculate_correlation` - Correlation matrix
- `get_dividend_info` - Dividend data
- `calculate_risk_metrics` - Sharpe, Sortino, VaR
- `generate_trade_signal` - Buy/sell signals
- `backtest_quick` - Quick strategy backtest

#### AFL Tools
- `generate_afl_code` - Generate AFL from description
- `validate_afl` - Syntax validation
- `debug_afl_code` - Fix errors
- `explain_afl_code` - Plain English explanation
- `sanity_check_afl` - Comprehensive check with auto-fix

#### Data & Charts
- `create_chart` - Generate charts (bar, line, pie, etc.)
- `execute_python` - Run Python code
- `code_sandbox` - Interactive code editor

#### Knowledge & Search
- `search_knowledge_base` - Search user documents
- `web_search` - Internet search (built-in)
- `get_news` - News headlines
- `get_search_trends` - Trending topics

#### Utilities
- `get_weather` - Weather data
- `track_flight` - Flight status
- `search_flights` - Find flights
- `create_presentation` - Generate PPTX
- `create_linkedin_post` - LinkedIn post generator
- `preview_website` - Website metadata

### Tool Response Format

All tools return JSON with this structure:

```json
{
  "success": true,
  "tool": "tool_name",
  "data": { ... },
  "fetch_time_ms": 123.45
}
```

On error:
```json
{
  "success": false,
  "error": "Error description"
}
```

### Caching

Tools implement intelligent caching:
- Stock data: 5-minute cache
- Knowledge base search: 10-minute cache
- Chart data: Per-request caching

---

## 7. Data Models

### Swift Model Definitions

```swift
// MARK: - Auth Models

struct AuthResponse: Codable {
    let access_token: String
    let token_type: String
    let user_id: String
    let email: String
    let expires_in: Int
}

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String?
    let nickname: String?
    let created_at: String?
    let last_active: String?
    let claude_api_key: String?
    let tavily_api_key: String?
}

// MARK: - Conversation Models

struct Conversation: Codable, Identifiable {
    let id: String
    let user_id: String
    let title: String
    let conversation_type: String
    let created_at: String
    let updated_at: String?
}

struct Message: Codable, Identifiable {
    let id: String
    let conversation_id: String
    let role: String  // "user" or "assistant"
    let content: String
    let metadata: MessageMetadata?
    let created_at: String
}

struct MessageMetadata: Codable {
    let parts: [MessagePart]?
    let artifacts: [Artifact]?
    let has_artifacts: Bool?
    let tools_used: [ToolUsage]?
}

struct MessagePart: Codable {
    let type: String
    let text: String?
    let state: String?
    let output: ArtifactOutput?
}

struct Artifact: Codable {
    let id: String
    let type: String  // "code", "react", "mermaid"
    let language: String?
    let code: String
    let start: Int?
    let end: Int?
}

struct ArtifactOutput: Codable {
    let code: String
    let language: String?
    let id: String?
}

struct ToolUsage: Codable {
    let tool: String
    let input: [String: AnyCodable]?
    let result: [String: AnyCodable]?
}

// MARK: - AFL Models

struct AFLGenerationRequest: Codable {
    let prompt: String
    let strategy_type: String?
    let stream: Bool?
    let backtest_settings: BacktestSettings?
    let uploaded_file_ids: [String]?
    let kb_context: String?
}

struct BacktestSettings: Codable {
    let initial_equity: Double?
    let position_size: String?
    let position_size_type: String?
    let max_positions: Int?
    let commission: Double?
    let trade_delays: [Int]?
    let margin_requirement: Double?
}

struct AFLCode: Codable, Identifiable {
    let id: String
    let user_id: String
    let name: String
    let description: String?
    let code: String
    let strategy_type: String?
    let quality_score: Int?
    let created_at: String?
}

struct AFLValidationResult: Codable {
    let success: Bool
    let valid: Bool
    let errors: [String]
    let warnings: [String]
    let line_count: Int
    let has_buy_sell: Bool
    let has_plot: Bool
}

// MARK: - Brain Models

struct BrainDocument: Codable, Identifiable {
    let id: String
    let title: String
    let filename: String?
    let category: String?
    let tags: [String]?
    let summary: String?
    let file_size: Int?
    let created_at: String?
    let chunk_count: Int?
}

struct BrainStats: Codable {
    let total_documents: Int
    let total_size: Int
    let total_chunks: Int
    let total_learnings: Int?
    let categories: [String: Int]
}

// MARK: - Backtest Models

struct BacktestResult: Codable, Identifiable {
    let id: String
    let user_id: String?
    let strategy_id: String?
    let filename: String?
    let metrics: BacktestMetrics?
    let ai_analysis: String?
    let recommendations: [Recommendation]?
    let created_at: String?
}

struct BacktestMetrics: Codable {
    let cagr: Double?
    let sharpe_ratio: Double?
    let max_drawdown: Double?
    let win_rate: Double?
    let profit_factor: Double?
    let total_trades: Int?
}

struct Recommendation: Codable {
    let priority: Int
    let recommendation: String
    let expected_impact: String
    let implementation: String
}

// MARK: - Presentation Models

struct PresentationRequest: Codable {
    let title: String
    let subtitle: String?
    let slides: [SlideRequest]
    let theme: String?
    let template_id: String?
    let author: String?
}

struct SlideRequest: Codable {
    let title: String
    let bullets: [String]?
    let notes: String?
    let layout: String?
    let layout_index: Int?
}

struct PresentationResponse: Codable {
    let success: Bool
    let presentation_id: String
    let filename: String
    let download_url: String
}

// MARK: - Helper for Any JSON

struct AnyCodable: Codable {
    let value: Any
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let string = try? container.decode(String.self) {
            value = string
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = ""
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try (value as? Encodable)?.encode(to: encoder)
    }
}
```

---

## 8. Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Token missing or invalid |
| `403` | Forbidden - No permission |
| `404` | Not Found - Resource doesn't exist |
| `413` | Payload Too Large - File > 10MB |
| `500` | Internal Server Error |

### Error Response Format

```json
{
  "detail": "Error description here",
  "type": "HTTPException"
}
```

### Swift Error Handling

```swift
enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case forbidden
    case notFound
    case serverError(Int)
    case decodingError(Error)
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid server response"
        case .unauthorized:
            return "Please log in again"
        case .forbidden:
            return "You don't have permission"
        case .notFound:
            return "Resource not found"
        case .serverError(let code):
            return "Server error (\(code))"
        case .decodingError(let error):
            return "Data error: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}

extension HTTPURLResponse {
    func validate() throws {
        switch statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        default:
            throw APIError.serverError(statusCode)
        }
    }
}
```

---

## 9. Swift Implementation Patterns

### Network Client

```swift
import Foundation

class APIClient {
    static let shared = APIClient()
    
    private let baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder
    
    init() {
        self.baseURL = APIConfiguration.baseURL
        self.session = URLSession.shared
        self.decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
    }
    
    private func token() -> String? {
        KeychainHelper.shared.get(key: "auth_token")
    }
    
    func request<T: Codable>(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if requiresAuth, let token = token() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        try httpResponse.validate()
        
        return try decoder.decode(T.self, from: data)
    }
    
    func upload(
        _ endpoint: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        additionalFields: [String: String]? = nil
    ) async throws -> [String: Any] {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        if let token = token() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        
        // Add file
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add additional fields
        if let fields = additionalFields {
            for (key, value) in fields {
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
                body.append(value.data(using: .utf8)!)
                body.append("\r\n".data(using: .utf8)!)
            }
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        try httpResponse.validate()
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw APIError.decodingError(DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "Invalid JSON")))
        }
        
        return json
    }
}
```

### Usage Examples

```swift
// MARK: - Auth
let authResponse = try await APIClient.shared.request(
    "/auth/login",
    method: "POST",
    body: ["email": email, "password": password]
) as AuthResponse

// MARK: - Get Conversations
let conversations = try await APIClient.shared.request("/chat/conversations") as [Conversation]

// MARK: - Send Message
let response = try await APIClient.shared.request(
    "/chat/message",
    method: "POST",
    body: ["content": "Hello", "conversation_id": convId]
) as MessageResponse

// MARK: - Upload File
let uploadResult = try await APIClient.shared.upload(
    "/brain/upload",
    fileData: fileData,
    fileName: "strategy.pdf",
    mimeType: "application/pdf",
    additionalFields: ["category": "strategy"]
)

// MARK: - Generate AFL
let aflResult = try await APIClient.shared.request(
    "/afl/generate",
    method: "POST",
    body: AFLGenerationRequest(
        prompt: "Create MA crossover",
        strategy_type: "standalone",
        stream: false
    )
) as AFLGenerationResponse
```

### Keychain Helper

```swift
import Security

class KeychainHelper {
    static let shared = KeychainHelper()
    
    private let service = "com.potomac.analyst"
    
    func save(key: String, value: String) {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    func get(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return value
    }
    
    func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}
```

---

## Summary

This backend is a comprehensive AI-powered platform for:
1. **AFL Code Generation** - Generate, validate, debug, and explain AmiBroker code
2. **Knowledge Management** - Upload and search documents for context
3. **Financial Analysis** - Real-time stock data, technical analysis, backtesting
4. **Content Generation** - Presentations, articles, LinkedIn posts

The SwiftUI frontend should:
- Store JWT tokens in Keychain
- Use async/await for all network calls
- Implement streaming for chat/code generation
- Handle tool results and artifacts in the UI
- Support file uploads for knowledge base and AFL context

For questions or issues, refer to the source code in `C:\Users\SohaibAli\PycharmProjects\Potomac-Analyst-Workbench\`.