# Potomac Analyst Workbench - Complete API Reference Guide

**Version:** 1.0.0  
**Last Updated:** January 25, 2026  
**Deployment URL:** `https://potomac-analyst-workbench.up.railway.app`

## Table of Contents

- [Overview](#overview)
- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Auth Routes](#auth-routes)
  - [Admin Routes](#admin-routes)
  - [Train Routes](#train-routes)
  - [AFL Routes](#afl-routes)
  - [Brain Routes](#brain-routes)
  - [Chat Routes](#chat-routes)
  - [Reverse Engineer Routes](#reverse-engineer-routes)
  - [Backtest Routes](#backtest-routes)
- [Frontend Implementation](#frontend-implementation)
  - [React Implementation](#react-implementation)
  - [Swift UI Implementation](#swift-ui-implementation)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

The Potomac Analyst Workbench is an AI-powered AmiBroker AFL development platform that provides:

- **AI Code Generation**: Generate AFL trading strategies using Claude AI
- **Knowledge Management**: Upload and search documents in the "Brain"
- **Chat Interface**: Conversational AI with web search capabilities
- **Reverse Engineering**: Convert strategy descriptions into working code
- **Backtest Analysis**: Analyze and optimize trading strategies
- **Training System**: Continuous learning from user feedback

## Base URLs

### Production (Railway)
```
Base URL: https://potomac-analyst-workbench.up.railway.app
Health Check: https://potomac-analyst-workbench.up.railway.app/health
API Docs: https://potomac-analyst-workbench.up.railway.app/docs
```

### Development
```
Base URL: http://localhost:8000
Health Check: http://localhost:8000/health
API Docs: http://localhost:8000/docs
```

## Authentication

### JWT Bearer Token

Most endpoints require authentication via JWT Bearer token.

**Header Format:**
```
Authorization: Bearer <jwt-token>
```

**Token Acquisition:**
1. Register: `POST /auth/register`
2. Login: `POST /auth/login`
3. Get current user: `GET /auth/me`

**Token Structure:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "is_admin": false,
  "exp": 1642675200
}
```

### Admin Authentication

Admin endpoints require:
- Valid JWT token
- `is_admin: true` in token payload
- OR email in `ADMIN_EMAILS` environment variable

---

## API Endpoints

### Auth Routes

#### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "nickname": "john",
  "claude_api_key": "sk-ant-...",
  "tavily_api_key": "tvly-..."
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

#### POST `/auth/login`
Login and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

#### GET `/auth/me`
Get current user info.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "nickname": "john",
  "is_admin": false,
  "created_at": "2026-01-25T15:30:00Z"
}
```

---

### Admin Routes

**Base Path:** `/admin`  
**Authentication:** Admin-only

#### GET `/admin/status`
Get admin status and system overview.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "status": "admin",
  "admin_id": "550e8400-e29b-41d4-a716-446655440000",
  "stats": {
    "total_users": 100,
    "total_documents": 50,
    "training": {
      "total": 25,
      "active": 20,
      "by_type": {
        "rule": 10,
        "example": 8,
        "correction": 5,
        "pattern": 2
      },
      "by_category": {
        "afl": 15,
        "general": 10
      }
    }
  }
}
```

#### POST `/admin/train`
Add a new training example.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "training_type": "rule",
  "title": "Always use SetTradeDelays",
  "input_prompt": "When generating trading strategies",
  "expected_output": "SetTradeDelays(0, 0, 0, 0);",
  "explanation": "Required to avoid look-ahead bias",
  "category": "afl",
  "tags": ["trading", "delays"],
  "priority": 9
}
```

**Response:**
```json
{
  "training_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Training example created successfully"
}
```

#### GET `/admin/training`
List all training examples.

**Query Parameters:**
- `training_type` (optional): Filter by type
- `category` (optional): Filter by category  
- `is_active` (optional): Filter by active status
- `limit` (optional): Max results (default: 100)

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "training_examples": [
    {
      "training_id": "550e8400-e29b-41d4-a716-446655440000",
      "training_type": "rule",
      "title": "Always use SetTradeDelays",
      "input_prompt": "When generating trading strategies",
      "expected_output": "SetTradeDelays(0, 0, 0, 0);",
      "explanation": "Required to avoid look-ahead bias",
      "category": "afl",
      "tags": ["trading", "delays"],
      "priority": 9,
      "is_active": true,
      "created_at": "2026-01-25T15:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 100
}
```

---

### Train Routes

**Base Path:** `/train`  
**Authentication:** Required

#### POST `/train/feedback`
Submit feedback on AI-generated code.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
  "original_prompt": "Create a moving average crossover",
  "generated_code": "/* AFL code */",
  "feedback_type": "correction",
  "feedback_text": "RSI syntax was wrong",
  "correct_code": "/* corrected code */",
  "rating": 4
}
```

**Response:**
```json
{
  "feedback_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Feedback submitted successfully",
  "training_suggestion_created": true
}
```

#### POST `/train/test`
Test how training affects code generation.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Create RSI indicator",
  "category": "afl",
  "include_training": true
}
```

**Response:**
```json
{
  "without_training": {
    "code": "/* AFL code without training */",
    "explanation": "Strategy explanation without training"
  },
  "with_training": {
    "code": "/* AFL code with training */",
    "explanation": "Strategy explanation with training"
  },
  "training_context_used": "Training context used in generation",
  "differences_detected": true
}
```

---

### AFL Routes

**Base Path:** `/afl`  
**Authentication:** Required

#### POST `/afl/generate`
Generate AFL code.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Create a moving average crossover strategy",
  "strategy_type": "standalone",
  "settings": {
    "trade_delays": [0, 0, 0, 0]
  },
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "answers": {
    "strategy_type": "standalone",
    "trade_timing": "close"
  }
}
```

**Response:**
```json
{
  "code": "/* Generated AFL code */",
  "explanation": "Strategy explanation",
  "stats": {
    "quality_score": 85,
    "complexity": "medium",
    "estimated_performance": "good"
  },
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### POST `/afl/optimize`
Optimize existing AFL code.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "/* Existing AFL code */",
  "optimization_goals": ["performance", "readability"],
  "constraints": ["maintain accuracy", "reduce complexity"]
}
```

**Response:**
```json
{
  "optimized_code": "/* Optimized AFL code */",
  "improvements": [
    "Improved performance by 15%",
    "Reduced complexity by 20%"
  ],
  "explanation": "Optimization explanation"
}
```

#### GET `/afl/codes`
List user's saved AFL codes.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "codes": [
    {
      "code_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Moving Average Crossover",
      "description": "Simple MA crossover strategy",
      "category": "afl",
      "created_at": "2026-01-25T15:30:00Z",
      "last_modified": "2026-01-25T16:00:00Z"
    }
  ],
  "total": 10
}
```

---

### Brain Routes

**Base Path:** `/brain`  
**Authentication:** Required

#### POST `/brain/upload`
Upload and process a document.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Document file (PDF, DOCX, TXT)
- `title` (optional): Document title
- `category` (optional): Document category

**Response:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Trading Strategies Guide",
  "category": "afl",
  "file_name": "strategies.pdf",
  "file_size": 1024000,
  "status": "processed",
  "created_at": "2026-01-25T15:30:00Z"
}
```

#### POST `/brain/search`
Search the knowledge base.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "trading strategies",
  "category": "afl",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Trading Strategies Guide",
      "category": "afl",
      "content_preview": "This document contains...",
      "similarity_score": 0.85,
      "created_at": "2026-01-25T15:30:00Z"
    }
  ],
  "total": 50,
  "query": "trading strategies"
}
```

---

### Chat Routes

**Base Path:** `/chat`  
**Authentication:** Required

#### POST `/chat/message`
Send a message and get AI response.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "How do I create a MACD indicator?",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "response": "AI response with MACD explanation...",
  "tools_used": [
    {
      "tool": "get_stock_data",
      "input": {"symbol": "AAPL"},
      "result_preview": "..."
    }
  ],
  "timestamp": "2026-01-25T15:30:00Z"
}
```

#### GET `/chat/conversations`
Get all conversations.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "conversations": [
    {
      "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "MACD Strategy Development",
      "created_at": "2026-01-25T15:30:00Z",
      "last_message_at": "2026-01-25T16:00:00Z",
      "message_count": 15
    }
  ],
  "total": 10
}
```

---

### Reverse Engineer Routes

**Base Path:** `/reverse-engineer`  
**Authentication:** Required

#### POST `/reverse-engineer/start`
Start reverse engineering session.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "Dual Momentum strategy"
}
```

**Response:**
```json
{
  "strategy_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Dual Momentum Strategy",
  "description": "Strategy description...",
  "status": "researching",
  "created_at": "2026-01-25T15:30:00Z"
}
```

#### POST `/reverse-engineer/generate-code/{strategy_id}`
Generate AFL code from research.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "strategy_id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "/* Generated AFL code */",
  "explanation": "Code explanation...",
  "status": "completed",
  "generated_at": "2026-01-25T16:00:00Z"
}
```

---

### Backtest Routes

**Base Path:** `/backtest`  
**Authentication:** Required

#### POST `/backtest/upload`
Upload and analyze backtest results.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Backtest results file (CSV, JSON)
- `strategy_id` (optional): Strategy ID

**Response:**
```json
{
  "backtest_id": "550e8400-e29b-41d4-a716-446655440000",
  "metrics": {
    "cagr": 15.5,
    "sharpe_ratio": 1.8,
    "max_drawdown": -12.3,
    "win_rate": 62.5,
    "profit_factor": 2.1,
    "total_trades": 150
  },
  "analysis": "AI analysis of backtest results...",
  "recommendations": [
    {
      "priority": 1,
      "recommendation": "Reduce position size during high volatility",
      "expected_impact": "Reduce drawdown by 30%",
      "implementation": "Add volatility filter"
    }
  ],
  "created_at": "2026-01-25T15:30:00Z"
}
```

---

## Frontend Implementation

### React Implementation

#### 1. API Client Setup

```javascript
// api/client.js
class ApiClient {
  constructor(baseURL = 'https://potomac-analyst-workbench.up.railway.app') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // AFL methods
  async generateAFL(prompt, options = {}) {
    return this.request('/afl/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        ...options,
      }),
    });
  }

  async getAFLCodes() {
    return this.request('/afl/codes');
  }

  // Brain methods
  async uploadDocument(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.category) formData.append('category', metadata.category);

    return this.request('/brain/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
  }

  async searchBrain(query, options = {}) {
    return this.request('/brain/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...options,
      }),
    });
  }

  // Chat methods
  async sendMessage(content, conversationId) {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        content,
        conversation_id: conversationId,
      }),
    });
  }

  async getConversations() {
    return this.request('/chat/conversations');
  }

  // Training methods
  async submitFeedback(feedbackData) {
    return this.request('/train/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }
}

export const api = new ApiClient();
```

#### 2. React Hooks

```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await api.login(credentials);
      api.setToken(response.access_token);
      setUser(response);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.register(userData);
      api.setToken(response.access_token);
      setUser(response);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    api.setToken(null);
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        api.setToken(token);
        const userData = await api.getMe();
        setUser(userData);
      }
    } catch (err) {
      localStorage.removeItem('auth_token');
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
  };
}
```

```javascript
// hooks/useAFL.js
import { useState, useCallback } from 'react';
import { api } from '../api/client';

export function useAFL() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateCode = useCallback(async (prompt, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.generateAFL(prompt, options);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getAFLCodes();
      setCodes(result.codes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCode = useCallback(async (codeId) => {
    try {
      setLoading(true);
      setError(null);
      await api.request(`/afl/codes/${codeId}`, { method: 'DELETE' });
      setCodes(codes.filter(code => code.code_id !== codeId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [codes]);

  return {
    codes,
    loading,
    error,
    generateCode,
    loadCodes,
    deleteCode,
  };
}
```

#### 3. React Components

```jsx
// components/AFLGenerator.jsx
import React, { useState } from 'react';
import { useAFL } from '../hooks/useAFL';

export function AFLGenerator() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const { generateCode, loading, error } = useAFL();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const response = await generateCode(prompt, {
        strategy_type: 'standalone',
        settings: {
          trade_delays: [0, 0, 0, 0]
        }
      });
      setResult(response);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  return (
    <div className="afl-generator">
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your trading strategy..."
          rows={4}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate AFL'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h3>Generated Code:</h3>
          <pre>{result.code}</pre>
          <p>{result.explanation}</p>
        </div>
      )}
    </div>
  );
}
```

```jsx
// components/BrainSearch.jsx
import React, { useState } from 'react';
import { useBrain } from '../hooks/useBrain';

export function BrainSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { search, loading, error } = useBrain();

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const searchResults = await search(query, { limit: 10 });
      setResults(searchResults.results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="brain-search">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge base..."
        />
        <button onClick={handleSearch} disabled={loading}>
          Search
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results">
        {results.map(result => (
          <div key={result.document_id} className="result-item">
            <h4>{result.title}</h4>
            <p>{result.content_preview}</p>
            <span className="similarity">
              Similarity: {(result.similarity_score * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Swift UI Implementation

#### 1. API Client

```swift
// APIClient.swift
import Foundation

struct APIError: Error, LocalizedError {
    let message: String
    
    var errorDescription: String? {
        return message
    }
}

class APIClient {
    private let baseURL = "https://potomac-analyst-workbench.up.railway.app"
    private let session = URLSession.shared
    private var authToken: String?
    
    init() {
        if let token = UserDefaults.standard.string(forKey: "authToken") {
            self.authToken = token
        }
    }
    
    private func makeRequest<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil,
        completion: @escaping (Result<T, APIError>) -> Void
    ) {
        guard let url = URL(string: baseURL + endpoint) else {
            completion(.failure(APIError(message: "Invalid URL")))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        let task = session.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.failure(APIError(message: error.localizedDescription)))
                    return
                }
                
                guard let data = data else {
                    completion(.failure(APIError(message: "No data received")))
                    return
                }
                
                do {
                    let decoder = JSONDecoder()
                    let result = try decoder.decode(T.self, from: data)
                    completion(.success(result))
                } catch {
                    completion(.failure(APIError(message: "Failed to decode response: \(error)")))
                }
            }
        }
        
        task.resume()
    }
    
    // Auth methods
    func register(
        email: String,
        password: String,
        name: String,
        completion: @escaping (Result<AuthResponse, APIError>) -> Void
    ) {
        let body = RegisterRequest(
            email: email,
            password: password,
            name: name,
            nickname: name.lowercased()
        )
        
        guard let data = try? JSONEncoder().encode(body) else {
            completion(.failure(APIError(message: "Failed to encode request")))
            return
        }
        
        makeRequest(endpoint: "/auth/register", method: "POST", body: data, completion: completion)
    }
    
    func login(
        email: String,
        password: String,
        completion: @escaping (Result<AuthResponse, APIError>) -> Void
    ) {
        let body = LoginRequest(email: email, password: password)
        
        guard let data = try? JSONEncoder().encode(body) else {
            completion(.failure(APIError(message: "Failed to encode request")))
            return
        }
        
        makeRequest(endpoint: "/auth/login", method: "POST", body: data) { result in
            switch result {
            case .success(let authResponse):
                self.authToken = authResponse.accessToken
                UserDefaults.standard.set(authToken, forKey: "authToken")
                completion(.success(authResponse))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    // AFL methods
    func generateAFL(
        prompt: String,
        strategyType: String = "standalone",
        completion: @escaping (Result<AFLResponse, APIError>) -> Void
    ) {
        let body = AFLGenerateRequest(
            prompt: prompt,
            strategyType: strategyType,
            settings: [
                "trade_delays": [0, 0, 0, 0]
            ]
        )
        
        guard let data = try? JSONEncoder().encode(body) else {
            completion(.failure(APIError(message: "Failed to encode request")))
            return
        }
        
        makeRequest(endpoint: "/afl/generate", method: "POST", body: data, completion: completion)
    }
    
    func getAFLCodes(completion: @escaping (Result<AFLCodesResponse, APIError>) -> Void) {
        makeRequest(endpoint: "/afl/codes", completion: completion)
    }
    
    // Brain methods
    func searchBrain(
        query: String,
        limit: Int = 10,
        completion: @escaping (Result<BrainSearchResponse, APIError>) -> Void
    ) {
        let body = BrainSearchRequest(query: query, limit: limit)
        
        guard let data = try? JSONEncoder().encode(body) else {
            completion(.failure(APIError(message: "Failed to encode request")))
            return
        }
        
        makeRequest(endpoint: "/brain/search", method: "POST", body: data, completion: completion)
    }
}

// Request/Response Models
struct RegisterRequest: Codable {
    let email: String
    let password: String
    let name: String
    let nickname: String
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String
    let userId: String
    let email: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case userId = "user_id"
        case email
    }
}

struct AFLGenerateRequest: Codable {
    let prompt: String
    let strategyType: String
    let settings: [String: Any]
    
    enum CodingKeys: String, CodingKey {
        case prompt
        case strategyType = "strategy_type"
        case settings
    }
}

struct AFLResponse: Codable {
    let code: String
    let explanation: String
    let stats: AFLStats
    let conversationId: String
    
    enum CodingKeys: String, CodingKey {
        case code
        case explanation
        case stats
        case conversationId = "conversation_id"
    }
}

struct AFLStats: Codable {
    let qualityScore: Int
    let complexity: String
    let estimatedPerformance: String
    
    enum CodingKeys: String, CodingKey {
        case qualityScore = "quality_score"
        case complexity
        case estimatedPerformance = "estimated_performance"
    }
}

struct AFLCodesResponse: Codable {
    let codes: [AFLCode]
    let total: Int
}

struct AFLCode: Codable {
    let codeId: String
    let title: String
    let description: String
    let category: String
    let createdAt: String
    let lastModified: String
    
    enum CodingKeys: String, CodingKey {
        case codeId = "code_id"
        case title
        case description
        case category
        case createdAt = "created_at"
        case lastModified = "last_modified"
    }
}

struct BrainSearchRequest: Codable {
    let query: String
    let limit: Int
}

struct BrainSearchResponse: Codable {
    let results: [BrainResult]
    let total: Int
    let query: String
}

struct BrainResult: Codable {
    let documentId: String
    let title: String
    let category: String
    let contentPreview: String
    let similarityScore: Double
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case documentId = "document_id"
        case title
        case category
        case contentPreview = "content_preview"
        case similarityScore = "similarity_score"
        case createdAt = "created_at"
    }
}
```

#### 2. SwiftUI Views

```swift
// AFLGeneratorView.swift
import SwiftUI

struct AFLGeneratorView: View {
    @StateObject private var viewModel = AFLGeneratorViewModel()
    @State private var prompt = ""
    
    var body: some View {
        VStack {
            Text("AFL Code Generator")
                .font(.title)
                .padding()
            
            TextField("Describe your trading strategy...", text: $prompt, axis: .vertical)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
                .lineLimit(4...10)
            
            Button("Generate AFL") {
                viewModel.generateCode(prompt: prompt)
            }
            .buttonStyle(.borderedProminent)
            .disabled(prompt.isEmpty || viewModel.isLoading)
            
            if viewModel.isLoading {
                ProgressView("Generating...")
                    .padding()
            }
            
            if let error = viewModel.error {
                Text(error)
                    .foregroundColor(.red)
                    .padding()
            }
            
            if let result = viewModel.result {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Generated Code:")
                        .font(.headline)
                    
                    ScrollView {
                        Text(result.code)
                            .font(.system(.body, design: .monospace))
                            .padding()
                    }
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                    
                    Text("Explanation:")
                        .font(.headline)
                    
                    Text(result.explanation)
                        .padding()
                }
                .padding()
            }
        }
        .padding()
    }
}

class AFLGeneratorViewModel: ObservableObject {
    @Published var result: AFLResponse?
    @Published var isLoading = false
    @Published var error: String?
    
    private let apiClient = APIClient()
    
    func generateCode(prompt: String) {
        isLoading = true
        error = nil
        result = nil
        
        apiClient.generateAFL(prompt: prompt) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let response):
                    self?.result = response
                case .failure(let apiError):
                    self?.error = apiError.localizedDescription
                }
            }
        }
    }
}
```

```swift
// BrainSearchView.swift
import SwiftUI

struct BrainSearchView: View {
    @StateObject private var viewModel = BrainSearchViewModel()
    @State private var query = ""
    
    var body: some View {
        VStack {
            Text("Knowledge Base Search")
                .font(.title)
                .padding()
            
            HStack {
                TextField("Search documents...", text: $query)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button("Search") {
                    viewModel.search(query: query)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            
            if viewModel.isLoading {
                ProgressView("Searching...")
                    .padding()
            }
            
            if let error = viewModel.error {
                Text(error)
                    .foregroundColor(.red)
                    .padding()
            }
            
            List(viewModel.results) { result in
                VStack(alignment: .leading, spacing: 5) {
                    Text(result.title)
                        .font(.headline)
                    
                    Text(result.contentPreview)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Text("Category: \(result.category)")
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.2))
                            .cornerRadius(4)
                        
                        Spacer()
                        
                        Text("Similarity: \(Int(result.similarityScore * 100))%")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding()
    }
}

class BrainSearchViewModel: ObservableObject {
    @Published var results: [BrainResult] = []
    @Published var isLoading = false
    @Published var error: String?
    
    private let apiClient = APIClient()
    
    func search(query: String) {
        guard !query.isEmpty else { return }
        
        isLoading = true
        error = nil
        
        apiClient.searchBrain(query: query) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let response):
                    self?.results = response.results
                case .failure(let apiError):
                    self?.error = apiError.localizedDescription
                }
            }
        }
    }
}
```

```swift
// ContentView.swift
import SwiftUI

@main
struct PotomacAnalystApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .environmentObject(authViewModel)
    }
}

struct AuthView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var isRegistering = false
    
    var body: some View {
        VStack {
            Text("Potomac Analyst Workbench")
                .font(.largeTitle)
                .fontWeight(.bold)
                .padding()
            
            VStack(spacing: 20) {
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                if isRegistering {
                    TextField("Name", text: $name)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                Button(isRegistering ? "Register" : "Login") {
                    if isRegistering {
                        authViewModel.register(email: email, password: password, name: name)
                    } else {
                        authViewModel.login(email: email, password: password)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(email.isEmpty || password.isEmpty)
                
                Button(isRegistering ? "Already have an account? Login" : "Don't have an account? Register") {
                    isRegistering.toggle()
                }
            }
            .padding()
            
            if let error = authViewModel.error {
                Text(error)
                    .foregroundColor(.red)
                    .padding()
            }
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            AFLGeneratorView()
                .tabItem {
                    Image(systemName: "code")
                    Text("AFL Generator")
                }
            
            BrainSearchView()
                .tabItem {
                    Image(systemName: "magnifyingglass")
                    Text("Knowledge Base")
                }
            
            ChatView()
                .tabItem {
                    Image(systemName: "bubble.left")
                    Text("Chat")
                }
        }
    }
}
```

---

## Error Handling

### HTTP Status Codes

| Status | Error Type | Description |
|--------|------------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Admin access required |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Request validation failed |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "detail": "Error description"
}
```

### Client-Side Error Handling

```javascript
// React error handling
try {
  const result = await api.generateAFL(prompt);
  // Handle success
} catch (error) {
  if (error.message.includes('401')) {
    // Redirect to login
    navigate('/login');
  } else if (error.message.includes('403')) {
    // Show permission error
    setError('Admin access required');
  } else {
    // Show generic error
    setError('Something went wrong. Please try again.');
  }
}
```

```swift
// Swift error handling
apiClient.generateAFL(prompt: prompt) { result in
    DispatchQueue.main.async {
        switch result {
        case .success(let response):
            self.result = response
        case .failure(let error):
            if error.localizedDescription.contains("401") {
                // Handle unauthorized
                self.showError = "Please login again"
            } else if error.localizedDescription.contains("403") {
                // Handle forbidden
                self.showError = "Admin access required"
            } else {
                // Handle other errors
                self.showError = error.localizedDescription
            }
        }
    }
}
```

---

## Rate Limiting

Currently, the API does not implement rate limiting. For production use, consider implementing:

### Recommended Rate Limits

- **General API**: 100 requests/minute per user
- **AI Generation**: 10 requests/minute per user
- **File Uploads**: 5 uploads/minute per user
- **Admin Operations**: 50 requests/minute per admin

### Client-Side Rate Limiting

```javascript
// React rate limiting
const useRateLimitedAPI = () => {
  const [lastRequestTime, setLastRequestTime] = useState(0);
  
  const makeRequest = useCallback(async (requestFn) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    
    setLastRequestTime(Date.now());
    return requestFn();
  }, [lastRequestTime]);
  
  return { makeRequest };
};
```

---

## Best Practices

### 1. Authentication

- Store tokens securely (localStorage for web, Keychain for iOS)
- Implement token refresh logic
- Always check authentication status on app startup
- Handle token expiration gracefully

### 2. Error Handling

- Provide user-friendly error messages
- Implement retry logic for network errors
- Log errors for debugging
- Handle different error types appropriately

### 3. Performance

- Cache frequently accessed data
- Implement pagination for large datasets
- Use loading states to improve UX
- Optimize image/document uploads

### 4. Security

- Never expose API keys in client code
- Use HTTPS for all requests
- Validate all user inputs
- Implement proper CORS policies

### 5. User Experience

- Provide clear loading states
- Implement proper form validation
- Use appropriate feedback for user actions
- Maintain consistent UI patterns

---

## Examples

### Complete React Application

```jsx
// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AFLGenerator from './pages/AFLGenerator';
import BrainSearch from './pages/BrainSearch';
import Chat from './pages/Chat';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/afl" element={<ProtectedRoute><AFLGenerator /></ProtectedRoute>} />
          <Route path="/brain" element={<ProtectedRoute><BrainSearch /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

export default App;
```

### Complete Swift Application

```swift
// AuthViewModel.swift
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: AuthResponse?
    @Published var error: String?
    @Published var isLoading = false
    
    private let apiClient = APIClient()
    
    init() {
        checkAuth()
    }
    
    func login(email: String, password: String) {
        isLoading = true
        error = nil
        
        apiClient.login(email: email, password: password) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let authResponse):
                    self?.user = authResponse
                    self?.isAuthenticated = true
                case .failure(let apiError):
                    self?.error = apiError.localizedDescription
                }
            }
        }
    }
    
    func register(email: String, password: String, name: String) {
        isLoading = true
        error = nil
        
        apiClient.register(email: email, password: password, name: name) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let authResponse):
                    self?.user = authResponse
                    self?.isAuthenticated = true
                case .failure(let apiError):
                    self?.error = apiError.localizedDescription
                }
            }
        }
    }
    
    func logout() {
        UserDefaults.standard.removeObject(forKey: "authToken")
        apiClient.authToken = nil
        isAuthenticated = false
        user = nil
    }
    
    private func checkAuth() {
        if let token = UserDefaults.standard.string(forKey: "authToken") {
            apiClient.authToken = token
            apiClient.getMe { [weak self] result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let userData):
                        self?.user = userData
                        self?.isAuthenticated = true
                    case .failure:
                        self?.logout()
                    }
                }
            }
        }
    }
}
```

---

## Support

For API support and questions:

- **Documentation**: This guide and inline API docs
- **Email**: support@potomac.com
- **GitHub Issues**: [Repository Issues](https://github.com/sohaibali73/Potomac-Analyst-Workbench/issues)

---

## Changelog

### Version 1.0.0 (2026-01-25)
- Initial API release
- Complete endpoint documentation
- React and Swift UI implementation examples
- Production deployment configuration

---

**Note**: This API reference is automatically generated and maintained. For the most up-to-date information, always refer to the live API documentation at `https://potomac-analyst-workbench.up.railway.app/docs`.