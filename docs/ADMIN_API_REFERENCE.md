# Admin API Reference

This document provides comprehensive documentation for the Admin Backend API endpoints.

## Authentication

All admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Admin Verification

All admin endpoints use the `verify_admin` dependency which:
- Checks if the user is authenticated
- Verifies the user is an admin (either via `is_admin` flag or admin email list)
- Returns 403 Forbidden if not authorized

## Endpoints

### Admin Status

#### `GET /admin/status`
Get admin status and system overview.

**Response:**
```json
{
  "status": "admin",
  "admin_id": "user-id",
  "stats": {
    "total_users": 150,
    "total_documents": 45,
    "training": {
      "total": 120,
      "active": 115,
      "by_type": {
        "example": 50,
        "rule": 40,
        "correction": 20,
        "pattern": 10
      },
      "by_category": {
        "afl": 100,
        "general": 20
      }
    },
    "recent_activity": {
      "codes_generated_last_7_days": 25,
      "feedback_submitted_last_7_days": 12
    }
  }
}
```

#### `POST /admin/make-admin/{target_user_id}`
Make another user an admin.

**Response:**
```json
{
  "status": "success",
  "message": "User {target_user_id} is now an admin"
}
```

#### `POST /admin/revoke-admin/{target_user_id}`
Revoke admin privileges from a user.

**Response:**
```json
{
  "status": "success", 
  "message": "Admin privileges revoked from user {target_user_id}"
}
```

### Training Management

#### `POST /admin/train`
Add a new training example.

**Request Body:**
```json
{
  "training_type": "rule",
  "title": "Always use SetTradeDelays",
  "input_prompt": "trade timing",
  "expected_output": "SetTradeDelays(0, 0, 0, 0); // for same bar execution",
  "explanation": "SetTradeDelays must be specified to avoid look-ahead bias",
  "category": "afl",
  "tags": ["timing", "execution"],
  "priority": 9
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "training-id",
    "training_type": "rule",
    "title": "Always use SetTradeDelays",
    "input_prompt": "trade timing",
    "expected_output": "SetTradeDelays(0, 0, 0, 0); // for same bar execution",
    "explanation": "SetTradeDelays must be specified to avoid look-ahead bias",
    "category": "afl",
    "tags": ["timing", "execution"],
    "priority": 9,
    "is_active": true,
    "created_by": "admin-id",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `POST /admin/train/quick`
Quick training - simplified input.

**Request Body:**
```json
{
  "what_to_learn": "Always use ExRem for signal cleanup",
  "example_input": "duplicate signals",
  "example_output": "Buy = ExRem(Buy, Sell); Sell = ExRem(Sell, Buy);",
  "training_type": "rule"
}
```

#### `POST /admin/train/correction`
Add a correction from feedback.

**Request Body:**
```json
{
  "original_prompt": "RSI indicator",
  "wrong_output": "RSI(Close, 14)",
  "correct_output": "RSI(14)",
  "feedback": "RSI does not take Close as first argument"
}
```

#### `POST /admin/train/batch`
Import multiple training examples.

**Request Body:**
```json
{
  "items": [
    {
      "training_type": "rule",
      "title": "Rule 1",
      "input_prompt": "input 1",
      "expected_output": "output 1",
      "explanation": "explanation 1"
    },
    {
      "training_type": "example", 
      "title": "Example 1",
      "input_prompt": "input 2",
      "expected_output": "output 2",
      "explanation": "explanation 2"
    }
  ]
}
```

#### `GET /admin/training`
List training examples with filtering and pagination.

**Query Parameters:**
- `training_type` (optional): Filter by training type
- `category` (optional): Filter by category  
- `is_active` (optional): Filter by active status (default: true)
- `limit` (optional): Limit results (default: 100, max: 1000)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "count": 50,
  "examples": [...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 50
  }
}
```

#### `GET /admin/training/{training_id}`
Get a single training example.

#### `PUT /admin/training/{training_id}`
Update a training example.

**Request Body:**
```json
{
  "title": "Updated title",
  "priority": 8,
  "is_active": false
}
```

#### `DELETE /admin/training/{training_id}`
Delete a training example.

#### `POST /admin/training/{training_id}/toggle`
Toggle a training example's active status.

**Response:**
```json
{
  "status": "success",
  "is_active": false
}
```

#### `GET /admin/training/stats/overview`
Get training statistics.

**Response:**
```json
{
  "total": 120,
  "active": 115,
  "by_type": {
    "example": 50,
    "rule": 40,
    "correction": 20,
    "pattern": 10
  },
  "by_category": {
    "afl": 100,
    "general": 20
  }
}
```

#### `GET /admin/training/export/all`
Export all training data.

**Query Parameters:**
- `training_type` (optional): Filter by training type
- `category` (optional): Filter by category

**Response:**
```json
{
  "count": 120,
  "data": [...]
}
```

#### `GET /admin/training/context/preview`
Preview training context for AI prompts.

**Response:**
```json
{
  "context_length": 5000,
  "context": "## LEARNED RULES (Must Follow)..."
}
```

### User Management

#### `GET /admin/users`
List all users with pagination.

**Query Parameters:**
- `limit` (optional): Limit results (default: 100, max: 1000)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "count": 150,
  "total": 150,
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "nickname": "nickname",
      "is_admin": false,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_active": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 150
  }
}
```

#### `GET /admin/users/{user_id}`
Get a specific user's details.

#### `PUT /admin/users/{user_id}`
Update a user's information.

**Request Body:**
```json
{
  "name": "New Name",
  "is_admin": true,
  "is_active": false
}
```

#### `DELETE /admin/users/{user_id}`
Mark a user as inactive (soft delete).

#### `POST /admin/users/{user_id}/restore`
Restore a deleted/inactive user.

### System Configuration

#### `GET /admin/config`
Get system configuration.

**Response:**
```json
{
  "admin_emails": ["admin1@example.com", "admin2@example.com"],
  "training_types": ["example", "rule", "correction", "pattern", "anti_pattern", "terminology"],
  "default_category": "afl",
  "system_status": "operational",
  "maintenance_mode": false
}
```

#### `PUT /admin/config`
Update system configuration.

**Request Body:**
```json
{
  "admin_emails": ["newadmin@example.com"],
  "system_status": "maintenance"
}
```

#### `POST /admin/config/add-admin-email`
Add an email to the admin list.

**Request Body:**
```json
{
  "email": "newadmin@example.com"
}
```

### Feedback Review

#### `GET /admin/feedback`
List all user feedback with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (pending_review, reviewed, implemented, rejected)
- `feedback_type` (optional): Filter by feedback type (correction, improvement, bug, praise)
- `limit` (optional): Limit results (default: 100, max: 1000)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "count": 25,
  "total": 25,
  "feedback": [...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 25
  }
}
```

#### `GET /admin/feedback/{feedback_id}`
Get detailed feedback for review.

#### `POST /admin/feedback/{feedback_id}/review`
Review and process user feedback.

**Request Body:**
```json
{
  "status": "implemented",
  "admin_notes": "Added as training correction",
  "create_training": true
}
```

### Training Suggestions Review

#### `GET /admin/suggestions`
List training suggestions with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected, implemented)
- `limit` (optional): Limit results (default: 100, max: 1000)
- `offset` (optional): Offset for pagination (default: 0)

#### `GET /admin/suggestions/{suggestion_id}`
Get detailed suggestion for review.

#### `POST /admin/suggestions/{suggestion_id}/review`
Review and process training suggestion.

**Request Body:**
```json
{
  "status": "approved",
  "admin_notes": "Good suggestion",
  "priority": 8
}
```

#### `POST /admin/suggestions/{suggestion_id}/approve`
Quick approve suggestion.

#### `POST /admin/suggestions/{suggestion_id}/reject`
Quick reject suggestion.

### Analytics

#### `GET /admin/analytics/overview`
Get comprehensive analytics overview.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30, max: 365)

**Response:**
```json
{
  "period": "Last 30 days",
  "users": {
    "total": 150,
    "active": 85,
    "growth_rate": "56.7%"
  },
  "code_generation": {
    "total_codes": 1200,
    "recent_codes": 250,
    "avg_per_day": "8.3"
  },
  "feedback": {
    "total": 45,
    "average_rating": 4.2,
    "corrections": 12,
    "praise": 28,
    "pending_review": 5,
    "satisfaction_rate": "62.2%"
  },
  "training": {
    "total_examples": 120,
    "active_examples": 115,
    "by_type": {...},
    "pending_suggestions": 8
  }
}
```

#### `GET /admin/analytics/trends`
Get usage trends over time.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30, min: 7, max: 90)

**Response:**
```json
{
  "period_days": 30,
  "date_range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "trends": {
    "code_generation": [
      {"date": "2024-01-01", "count": 15},
      {"date": "2024-01-02", "count": 12}
    ],
    "feedback": [
      {"date": "2024-01-01", "count": 3, "avg_rating": 4.2},
      {"date": "2024-01-02", "count": 2, "avg_rating": 4.5}
    ],
    "user_activity": [
      {"date": "2024-01-01", "active_users": 25},
      {"date": "2024-01-02", "active_users": 30}
    ]
  }
}
```

#### `GET /admin/analytics/engagement`
Get user engagement metrics.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30, max: 365)

### Audit Logs

#### `GET /admin/audit-logs`
Get admin audit logs with filtering and pagination.

**Query Parameters:**
- `action_type` (optional): Filter by action type
- `user_id` (optional): Filter by user ID
- `start_date` (optional): Start date filter
- `end_date` (optional): End date filter
- `limit` (optional): Limit results (default: 100, max: 1000)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "count": 50,
  "total": 50,
  "audit_logs": [
    {
      "id": "log-id",
      "user_id": "admin-id",
      "event_type": "add_training",
      "event_category": "admin",
      "event_data": {...},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...},
  "filters": {...}
}
```

### System Health

#### `GET /admin/health/system`
Get system health status.

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "storage": "healthy", 
    "api": "healthy"
  },
  "metrics": {
    "total_documents": 45,
    "recent_errors": 0,
    "last_check": "2024-01-01T00:00:00Z"
  }
}
```

#### `POST /admin/maintenance/toggle`
Toggle maintenance mode.

**Request Body:**
```json
{
  "enable": true
}
```

### Data Export

#### `GET /admin/export/users`
Export user data for backup or analysis.

**Response:**
```json
{
  "export_date": "2024-01-01T00:00:00Z",
  "total_users": 150,
  "users": [...]
}
```

#### `GET /admin/export/feedback`
Export feedback data for analysis.

**Query Parameters:**
- `status` (optional): Filter by status

#### `GET /admin/export/training`
Export training data for backup.

**Query Parameters:**
- `training_type` (optional): Filter by training type
- `category` (optional): Filter by category

## Error Responses

All endpoints return standard HTTP error codes:

- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Admin access required
- `404 Not Found`: Resource not found
- `400 Bad Request`: Invalid request data
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "detail": "Error message"
}
```

## Rate Limiting

Admin endpoints may have rate limits applied. Monitor response headers for rate limit information.

## Best Practices

1. **Pagination**: Always use pagination for list endpoints to avoid performance issues
2. **Filtering**: Use query parameters to filter results when possible
3. **Error Handling**: Implement proper error handling for all API calls
4. **Security**: Never expose sensitive user data in responses
5. **Logging**: Monitor admin actions through the audit logs