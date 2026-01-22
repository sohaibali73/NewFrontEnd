# Potomac Analyst Workbench - API Reference

Complete API documentation for all endpoints in the Analyst by Potomac platform.

## Table of Contents

- [Admin Routes](#admin-routes)
- [Train Routes](#train-routes)
- [AFL Routes](#afl-routes)
- [Brain Routes](#brain-routes)
- [Chat Routes](#chat-routes)
- [Reverse Engineer Routes](#reverse-engineer-routes)
- [Backtest Routes](#backtest-routes)
- [Auth Routes](#auth-routes)

---

## Admin Routes

**Base Path:** `/admin`  
**Authentication:** Admin-only (requires `is_admin=true` or email in `ADMIN_EMAILS`)

### Status & Overview

#### GET `/admin/status`
Get admin status and system overview.

**Response:**
```json
{
  "status": "admin",
  "admin_id": "uuid",
  "stats": {
    "total_users": 100,
    "total_documents": 50,
    "training": {
      "total": 25,
      "active": 20,
      "by_type": {},
      "by_category": {}
    }
  }
}
```

### Admin Management

#### POST `/admin/make-admin/{target_user_id}`
Grant admin privileges to a user.

#### POST `/admin/revoke-admin/{target_user_id}`
Revoke admin privileges from a user.

### Training Management

#### POST `/admin/train`
Add a new training example.

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

**Training Types:**
- `example` - Input/output example pairs
- `rule` - Mandatory rules
- `pattern` - Recommended code patterns
- `anti_pattern` - Patterns to avoid
- `correction` - Corrections to mistakes
- `terminology` - Domain-specific terms

#### POST `/admin/train/quick`
Simplified training interface.

**Request Body:**
```json
{
  "what_to_learn": "Always use ExRem to clean duplicate signals",
  "example_input": "Buy/Sell signals",
  "example_output": "Buy = ExRem(Buy, Sell); Sell = ExRem(Sell, Buy);",
  "training_type": "rule"
}
```

#### POST `/admin/train/correction`
Add a correction from user feedback.

**Request Body:**
```json
{
  "original_prompt": "Create RSI indicator",
  "wrong_output": "rsi = RSI(Close, 14);",
  "correct_output": "rsi = RSI(14);",
  "feedback": "RSI only takes period as argument"
}
```

#### POST `/admin/train/batch`
Import multiple training examples at once.

#### GET `/admin/training`
List all training examples.

**Query Parameters:**
- `training_type` - Filter by type
- `category` - Filter by category
- `is_active` - Filter by active status
- `limit` - Max results (default: 100)

#### GET `/admin/training/{training_id}`
Get a single training example.

#### PUT `/admin/training/{training_id}`
Update a training example.

#### DELETE `/admin/training/{training_id}`
Delete a training example.

#### POST `/admin/training/{training_id}/toggle`
Toggle active status.

#### GET `/admin/training/stats/overview`
Get training statistics.

#### GET `/admin/training/export/all`
Export all training data.

#### GET `/admin/training/context/preview`
Preview the context injected into AI prompts.

### User Management

#### GET `/admin/users`
List all users.

#### GET `/admin/users/{user_id}`
Get user details.

#### DELETE `/admin/users/{user_id}`
Delete a user.

### Feedback Review

#### GET `/admin/feedback`
List all user feedback.

**Query Parameters:**
- `status` - Filter by status
- `feedback_type` - Filter by type
- `limit` - Max results

#### GET `/admin/feedback/{feedback_id}`
Get detailed feedback.

#### POST `/admin/feedback/{feedback_id}/review`
Review and process feedback.

**Request Body:**
```json
{
  "status": "reviewed",
  "admin_notes": "Fixed in training",
  "create_training": true
}
```

### Training Suggestions

#### GET `/admin/suggestions`
List training suggestions from users.

#### GET `/admin/suggestions/{suggestion_id}`
Get detailed suggestion.

#### POST `/admin/suggestions/{suggestion_id}/review`
Review a suggestion.

**Request Body:**
```json
{
  "status": "approved",
  "admin_notes": "Good suggestion",
  "priority": 8
}
```

#### POST `/admin/suggestions/{suggestion_id}/approve`
Quick approve with priority.

#### POST `/admin/suggestions/{suggestion_id}/reject`
Quick reject with reason.

### Analytics

#### GET `/admin/analytics/overview`
Get comprehensive analytics.

**Response:**
```json
{
  "users": {"total": 100},
  "code_generation": {"total_codes": 500},
  "feedback": {
    "total": 50,
    "average_rating": 4.5,
    "corrections": 10,
    "praise": 30,
    "pending_review": 5
  },
  "training": {
    "total_examples": 25,
    "active_examples": 20,
    "pending_suggestions": 3
  }
}
```

#### GET `/admin/analytics/trends`
Get usage trends over time.

### Configuration

#### GET `/admin/config`
Get system configuration.

#### POST `/admin/config/add-admin-email`
Add an admin email.

---

## Train Routes

**Base Path:** `/train`  
**Authentication:** Required

### Feedback Submission

#### POST `/train/feedback`
Submit feedback on AI-generated code.

**Request Body:**
```json
{
  "code_id": "uuid",
  "conversation_id": "uuid",
  "original_prompt": "Create a moving average crossover",
  "generated_code": "/* AFL code */",
  "feedback_type": "correction",
  "feedback_text": "RSI syntax was wrong",
  "correct_code": "/* corrected code */",
  "rating": 4
}
```

**Feedback Types:**
- `correction` - Code was wrong
- `improvement` - Suggestions for better code
- `bug` - Bug in generated code
- `praise` - Code was perfect

#### GET `/train/feedback/my`
Get user's feedback history.

#### GET `/train/feedback/{feedback_id}`
Get feedback details.

### Training Testing

#### POST `/train/test`
Test how training affects code generation.

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
  "without_training": {"code": "...", "explanation": "..."},
  "with_training": {"code": "...", "explanation": "..."},
  "training_context_used": "...",
  "differences_detected": true
}
```

#### GET `/train/effectiveness`
Get training effectiveness metrics.

### Training Suggestions

#### POST `/train/suggest`
Suggest a training example.

**Request Body:**
```json
{
  "title": "Better RSI pattern",
  "description": "Correct way to use RSI",
  "example_input": "RSI indicator",
  "example_output": "rsi = RSI(14);",
  "reason": "Common mistake in AI output"
}
```

#### GET `/train/suggestions/my`
Get user's suggestions and status.

### Learning Analytics

#### GET `/train/analytics/learning-curve`
Get user's learning curve over time.

#### GET `/train/analytics/popular-patterns`
Get most popular training patterns.

### Knowledge Base

#### GET `/train/knowledge/search`
Search training knowledge base.

**Query Parameters:**
- `query` - Search query
- `category` - Filter by category
- `limit` - Max results

#### GET `/train/knowledge/categories`
Get all categories with counts.

#### GET `/train/knowledge/types`
Get all training types with descriptions.

### Quick Learning

#### POST `/train/quick-learn`
Quick learn from an example.

**Request Body:**
```json
{
  "code": "/* good example code */",
  "explanation": "Why this is good"
}
```

#### GET `/train/stats`
Get comprehensive training statistics.

---

## AFL Routes

**Base Path:** `/afl`  
**Authentication:** Required

### Code Generation

#### POST `/afl/generate`
Generate AFL code.

**Request Body:**
```json
{
  "prompt": "Create a moving average crossover strategy",
  "strategy_type": "standalone",
  "settings": {
    "trade_delays": [0, 0, 0, 0]
  },
  "conversation_id": "uuid",
  "answers": {
    "strategy_type": "standalone",
    "trade_timing": "close"
  }
}
```

**Response:**
```json
{
  "code": "/* AFL code */",
  "explanation": "Strategy explanation",
  "stats": {"quality_score": 85}
}
```

### Code Operations

#### POST `/afl/optimize`
Optimize existing AFL code.

#### POST `/afl/debug`
Debug and fix AFL code errors.

#### POST `/afl/explain`
Explain AFL code in plain English.

#### POST `/afl/validate`
Validate AFL code syntax.

### Code Management

#### GET `/afl/codes`
List user's saved AFL codes.

#### GET `/afl/codes/{code_id}`
Get specific AFL code.

#### DELETE `/afl/codes/{code_id}`
Delete an AFL code.

---

## Brain Routes

**Base Path:** `/brain`  
**Authentication:** Required

### Document Upload

#### POST `/brain/upload`
Upload and process a document.

**Form Data:**
- `file` - Document file
- `title` - Optional title
- `category` - Optional category

#### POST `/brain/upload-batch`
Upload multiple documents.

#### POST `/brain/upload-text`
Upload text content directly.

### Search & Retrieval

#### POST `/brain/search`
Search the knowledge base.

**Request Body:**
```json
{
  "query": "trading strategies",
  "category": "afl",
  "limit": 10
}
```

#### GET `/brain/documents`
List all documents.

#### GET `/brain/stats`
Get brain statistics.

#### DELETE `/brain/documents/{document_id}`
Delete a document.

---

## Chat Routes

**Base Path:** `/chat`  
**Authentication:** Required

### Conversations

#### GET `/chat/conversations`
Get all conversations.

#### POST `/chat/conversations`
Create a new conversation.

#### GET `/chat/conversations/{conversation_id}/messages`
Get conversation messages.

#### DELETE `/chat/conversations/{conversation_id}`
Delete a conversation.

### Messaging

#### POST `/chat/message`
Send a message and get AI response.

**Request Body:**
```json
{
  "content": "How do I create a MACD indicator?",
  "conversation_id": "uuid"
}
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "response": "AI response...",
  "tools_used": [
    {
      "tool": "get_stock_data",
      "input": {"symbol": "AAPL"},
      "result_preview": "..."
    }
  ]
}
```

### Tools

#### GET `/chat/tools`
List available tools for the chat agent.

---

## Reverse Engineer Routes

**Base Path:** `/reverse-engineer`  
**Authentication:** Required

### Workflow

#### POST `/reverse-engineer/start`
Start reverse engineering session.

**Request Body:**
```json
{
  "query": "Dual Momentum strategy"
}
```

#### POST `/reverse-engineer/continue`
Continue conversation.

**Request Body:**
```json
{
  "strategy_id": "uuid",
  "message": "I want to trade monthly"
}
```

#### POST `/reverse-engineer/research/{strategy_id}`
Conduct web research on strategy.

#### POST `/reverse-engineer/schematic/{strategy_id}`
Generate strategy schematic.

#### POST `/reverse-engineer/generate-code/{strategy_id}`
Generate AFL code from research.

#### GET `/reverse-engineer/strategy/{strategy_id}`
Get strategy details.

---

## Backtest Routes

**Base Path:** `/backtest`  
**Authentication:** Required

### Analysis

#### POST `/backtest/upload`
Upload and analyze backtest results.

**Form Data:**
- `file` - Backtest results file
- `strategy_id` - Optional strategy ID

**Response:**
```json
{
  "backtest_id": "uuid",
  "metrics": {
    "cagr": 15.5,
    "sharpe_ratio": 1.8,
    "max_drawdown": -12.3,
    "win_rate": 62.5,
    "profit_factor": 2.1,
    "total_trades": 150
  },
  "analysis": "AI analysis...",
  "recommendations": [
    {
      "priority": 1,
      "recommendation": "...",
      "expected_impact": "...",
      "implementation": "..."
    }
  ]
}
```

#### GET `/backtest/{backtest_id}`
Get backtest analysis.

#### GET `/backtest/strategy/{strategy_id}`
Get all backtests for a strategy.

---

## Auth Routes

**Base Path:** `/auth`  
**Authentication:** None (public)

### Authentication

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
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user_id": "uuid",
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

#### GET `/auth/me`
Get current user info (requires authentication).

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "detail": "Admin access required"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error message"
}
```

---

## Authentication

Most endpoints require authentication via JWT Bearer token.

**Header:**
```
Authorization: Bearer <jwt-token>
```

Get your token from `/auth/login` or `/auth/register`.

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider adding rate limiting middleware.

---

## Webhooks

No webhooks are currently implemented. Future versions may include webhooks for:
- New feedback received
- Training suggestions submitted
- Code generation completed

---

## Changelog

### Version 1.0.0 (2026-01-22)
- Initial API release
- Admin routes for training management
- Train routes for user feedback and suggestions
- AFL code generation and management
- Brain knowledge base
- Chat with AI tools
- Reverse engineering workflow
- Backtest analysis

---

## Support

For API support:
- Email: support@potomac.com
- Documentation: Check `docs/ADMIN_TRAINING.md` for training details
- Database Migrations: Run migrations in `db/migrations/` folder

---

## Database Setup

1. Run migrations in order:
   - `001_training_data.sql` - Training data tables
   - `002_feedback_analytics.sql` - Feedback and analytics tables

2. Set environment variables:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   SECRET_KEY=your-secret-key
   ADMIN_EMAILS=admin@example.com,another@example.com
   ```

3. Create first admin user:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
   ```

---

## Best Practices

### For Training Data
- Start with high-priority rules (8-10)
- Add anti-patterns for common mistakes
- Use corrections to fix AI mistakes
- Keep examples focused and clear

### For Feedback
- Provide specific corrections, not just complaints
- Include correct code when possible
- Rate the overall output (1-5)
- Explain why the code was wrong

### For Code Generation
- Be specific in your prompts
- Answer mandatory questions (standalone vs composite, open vs close)
- Review generated code before using
- Submit feedback to improve future generations

---

## Examples

### Complete Training Workflow

1. **User generates code and finds issue:**
```bash
POST /afl/generate
{
  "prompt": "Create RSI indicator"
}
# Response has wrong syntax: RSI(Close, 14)
```

2. **User submits feedback:**
```bash
POST /train/feedback
{
  "feedback_type": "correction",
  "feedback_text": "RSI syntax is wrong",
  "generated_code": "rsi = RSI(Close, 14);",
  "correct_code": "rsi = RSI(14);",
  "rating": 3
}
# Creates training suggestion automatically
```

3. **Admin reviews suggestion:**
```bash
GET /admin/suggestions?status=pending
# See the suggestion

POST /admin/suggestions/{id}/approve
{
  "priority": 9
}
# Creates training data
```

4. **AI learns and improves:**
```bash
POST /afl/generate
{
  "prompt": "Create RSI indicator"
}
# Now generates: rsi = RSI(14);  ✓
```

---

End of API Reference