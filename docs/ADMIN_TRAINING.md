# Admin Training Feature

This document explains how to use the admin training feature to teach the AI new rules, patterns, and behaviors.

## Overview

The admin training feature allows administrators to:
- Add training examples that the AI will learn from
- Define rules the AI must follow
- Add code patterns the AI should use
- Specify anti-patterns the AI should avoid
- Correct mistakes the AI has made
- Define domain-specific terminology

All training data is automatically injected into the AI's system prompt when generating code.

## Setup

### 1. Database Migration

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Run the contents of: db/migrations/001_training_data.sql
```

This will:
- Add `is_admin` column to the `users` table
- Create the `training_data` table
- Set up indexes and triggers

### 2. Configure Admin Emails

Add admin emails to your `.env` file:

```env
ADMIN_EMAILS=admin@example.com,sohaib@example.com
```

Or set a user as admin directly in the database:

```sql

```
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
## API Endpoints

All endpoints require admin authentication (Bearer token).

### Status & Overview

```http
GET /admin/status
```

Returns system overview with stats about users, documents, and training data.

### Training Management

#### Add Training Example

```http
POST /admin/train
Content-Type: application/json

{
  "training_type": "rule",
  "title": "Always use SetTradeDelays",
  "input_prompt": "When generating trading strategies",
  "expected_output": "SetTradeDelays(0, 0, 0, 0);",
  "explanation": "SetTradeDelays must be specified to avoid look-ahead bias",
  "category": "afl",
  "priority": 9,
  "tags": ["trading", "delays"]
}
```

**Training Types:**
- `example` - Input/output example pairs
- `rule` - Rules the AI must follow (highest priority)
- `pattern` - Code patterns to use
- `anti_pattern` - Patterns to avoid
- `correction` - Corrections to previous mistakes
- `terminology` - Domain-specific terms

#### Quick Training

Simplified way to teach the AI something new:

```http
POST /admin/train/quick
Content-Type: application/json

{
  "what_to_learn": "Always include ExRem to clean duplicate signals",
  "example_input": "Buy/Sell signals",
  "example_output": "Buy = ExRem(Buy, Sell); Sell = ExRem(Sell, Buy);",
  "training_type": "rule"
}
```

#### Add Correction

When the AI makes a mistake, add a correction:

```http
POST /admin/train/correction
Content-Type: application/json

{
  "original_prompt": "Create an RSI indicator",
  "wrong_output": "rsi = RSI(Close, 14);",
  "correct_output": "rsi = RSI(14);",
  "feedback": "RSI function only takes period as argument, not the array"
}
```

#### List Training Data

```http
GET /admin/training?training_type=rule&category=afl&is_active=true&limit=100
```

#### Get Single Training Example

```http
GET /admin/training/{training_id}
```

#### Update Training Example

```http
PUT /admin/training/{training_id}
Content-Type: application/json

{
  "priority": 10,
  "is_active": true
}
```

#### Delete Training Example

```http
DELETE /admin/training/{training_id}
```

#### Toggle Active Status

```http
POST /admin/training/{training_id}/toggle
```

#### Preview Training Context

See what the AI will "know" from training:

```http
GET /admin/training/context/preview?category=afl
```

#### Export Training Data

```http
GET /admin/training/export/all?training_type=rule&category=afl
```

#### Batch Import

```http
POST /admin/train/batch
Content-Type: application/json

{
  "items": [
    {
      "training_type": "rule",
      "title": "Rule 1",
      "input_prompt": "...",
      "expected_output": "..."
    },
    {
      "training_type": "pattern",
      "title": "Pattern 1",
      "input_prompt": "...",
      "expected_output": "..."
    }
  ]
}
```

### User Management

```http
GET /admin/users              # List all users
GET /admin/users/{user_id}    # Get user details
DELETE /admin/users/{user_id} # Delete user
POST /admin/make-admin/{user_id}   # Make user admin
POST /admin/revoke-admin/{user_id} # Revoke admin
```

### Configuration

```http
GET /admin/config                      # Get config
POST /admin/config/add-admin-email?email=new@example.com  # Add admin
```

## Training Best Practices

### 1. Start with Rules

Add critical rules first with high priority (8-10):

```json
{
  "training_type": "rule",
  "title": "RSI function syntax",
  "input_prompt": "RSI indicator",
  "expected_output": "RSI() only takes period as argument. Example: rsi = RSI(14);",
  "priority": 9
}
```

### 2. Add Anti-Patterns for Common Mistakes

```json
{
  "training_type": "anti_pattern",
  "title": "Wrong RSI syntax",
  "input_prompt": "RSI(Close, 14)",
  "expected_output": "RSI(14)",
  "explanation": "RSI does not take Close as first argument"
}
```

### 3. Provide Complete Examples

```json
{
  "training_type": "example",
  "title": "Complete trading strategy structure",
  "input_prompt": "Create a simple MA crossover strategy",
  "expected_output": "_SECTION_BEGIN(\"MA Crossover\");\n\nSetTradeDelays(0, 0, 0, 0);\n\nfastMA = MA(Close, 10);\nslowMA = MA(Close, 50);\n\nBuy = Cross(fastMA, slowMA);\nSell = Cross(slowMA, fastMA);\n\nBuy = ExRem(Buy, Sell);\nSell = ExRem(Sell, Buy);\n\n_SECTION_END();",
  "priority": 7
}
```

### 4. Use Corrections for Feedback

When the AI generates wrong code, immediately add a correction:

```json
{
  "training_type": "correction",
  "input_prompt": "Create RSI strategy",
  "expected_output": "rsi = RSI(14);  // Correct syntax",
  "explanation": "The AI used RSI(Close, 14) but should use RSI(14)"
}
```

### 5. Add Terminology for Domain Knowledge

```json
{
  "training_type": "terminology",
  "title": "ExRem",
  "expected_output": "ExRem (Exclude Remainder) removes consecutive duplicate signals. Use ExRem(Buy, Sell) to keep only the first Buy signal after a Sell."
}
```

## How Training Works

1. When generating AFL code, the engine calls `_get_training_context()`
2. This retrieves all active training data from the database
3. Training data is formatted and injected into Claude's system prompt
4. Rules have highest priority, followed by patterns, corrections, and examples
5. The AI follows these learned rules when generating new code

## Priority System

- **1-3**: Low priority (nice-to-have suggestions)
- **4-6**: Medium priority (general guidelines)
- **7-8**: High priority (important rules)
- **9-10**: Critical (must always follow)

Higher priority training data appears first in the context and has more influence.

## Troubleshooting

### Training not being applied?

1. Check if training is active: `GET /admin/training?is_active=true`
2. Preview the context: `GET /admin/training/context/preview`
3. Ensure the training category matches (default: "afl")

### Can't access admin endpoints?

1. Verify your email is in ADMIN_EMAILS env var
2. Or check `is_admin = true` in database
3. Ensure you're sending valid Bearer token

### Database errors?

Run the migration SQL again - it uses `IF NOT EXISTS` so it's safe to re-run.