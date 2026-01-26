# Admin Backend Panel

This document provides comprehensive information about the Admin Backend Panel for the Analyst by Potomac application.

## Overview

The Admin Backend Panel provides comprehensive administrative capabilities for managing the AI training system, users, feedback, and system analytics. It's built using FastAPI and provides a RESTful API for administrative operations.

## Features

### 🔐 Admin Authentication & Authorization
- JWT-based authentication for all admin endpoints
- Email-based admin verification with fallback defaults
- Database-backed admin flag verification
- Secure admin-only access to sensitive operations

### 🎓 Training Management
- **Add Training Examples**: Create input/output pairs, rules, patterns, and corrections
- **Quick Training**: Simplified interface for rapid training data creation
- **Batch Import**: Import multiple training examples at once
- **Training Review**: View, update, delete, and toggle training examples
- **Training Statistics**: Comprehensive analytics on training data
- **Context Preview**: Preview how training data appears to the AI

### 👥 User Management
- **User Listing**: Paginated list of all users with filtering
- **User Details**: View complete user information (excluding sensitive data)
- **User Updates**: Modify user information and admin status
- **User Deactivation**: Soft delete users (mark as inactive)
- **User Restoration**: Restore previously deactivated users
- **Admin Promotion**: Grant admin privileges to users

### 📊 Analytics & Monitoring
- **System Overview**: Comprehensive dashboard with key metrics
- **Usage Trends**: Time-series data on user activity and system usage
- **Engagement Metrics**: User retention and feature usage statistics
- **Real-time Monitoring**: System health and performance metrics

### 💬 Feedback Management
- **Feedback Review**: Review and process user feedback
- **Feedback Filtering**: Filter by type, status, and date range
- **Training Creation**: Convert feedback into training data
- **Status Tracking**: Track feedback review status and admin notes

### 💡 Training Suggestions
- **Suggestion Review**: Review user-submitted training suggestions
- **Quick Actions**: Approve or reject suggestions with one click
- **Training Creation**: Automatically create training data from approved suggestions
- **Priority Management**: Set priority levels for approved suggestions

### 📋 Audit & Logging
- **Admin Actions**: Track all administrative operations
- **Audit Logs**: Comprehensive logging with filtering and pagination
- **Action History**: View historical changes and operations
- **Security Monitoring**: Monitor for suspicious administrative activity

### ⚙️ System Configuration
- **Admin Emails**: Manage admin email list configuration
- **System Status**: Monitor and update system operational status
- **Maintenance Mode**: Toggle system maintenance mode
- **Configuration Export**: Export system configuration for backup

### 📤 Data Export
- **User Data Export**: Export user information for analysis
- **Feedback Export**: Export feedback data with filtering
- **Training Export**: Export training data for backup or transfer
- **Analytics Export**: Export analytics data for reporting

## API Endpoints

### Authentication Required
All admin endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Admin Status
- `GET /admin/status` - Get admin status and system overview
- `POST /admin/make-admin/{user_id}` - Grant admin privileges
- `POST /admin/revoke-admin/{user_id}` - Revoke admin privileges

### Training Management
- `POST /admin/train` - Add new training example
- `POST /admin/train/quick` - Quick training creation
- `POST /admin/train/correction` - Add correction from feedback
- `POST /admin/train/batch` - Batch import training data
- `GET /admin/training` - List training examples with pagination
- `GET /admin/training/{id}` - Get specific training example
- `PUT /admin/training/{id}` - Update training example
- `DELETE /admin/training/{id}` - Delete training example
- `POST /admin/training/{id}/toggle` - Toggle training active status
- `GET /admin/training/stats/overview` - Get training statistics
- `GET /admin/training/export/all` - Export all training data
- `GET /admin/training/context/preview` - Preview training context

### User Management
- `GET /admin/users` - List users with pagination
- `GET /admin/users/{id}` - Get user details
- `PUT /admin/users/{id}` - Update user information
- `DELETE /admin/users/{id}` - Deactivate user
- `POST /admin/users/{id}/restore` - Restore user

### System Configuration
- `GET /admin/config` - Get system configuration
- `PUT /admin/config` - Update system configuration
- `POST /admin/config/add-admin-email` - Add admin email

### Feedback Management
- `GET /admin/feedback` - List feedback with filtering
- `GET /admin/feedback/{id}` - Get feedback details
- `POST /admin/feedback/{id}/review` - Review and process feedback

### Training Suggestions
- `GET /admin/suggestions` - List suggestions with filtering
- `GET /admin/suggestions/{id}` - Get suggestion details
- `POST /admin/suggestions/{id}/review` - Review suggestion
- `POST /admin/suggestions/{id}/approve` - Quick approve
- `POST /admin/suggestions/{id}/reject` - Quick reject

### Analytics
- `GET /admin/analytics/overview` - Get comprehensive analytics
- `GET /admin/analytics/trends` - Get usage trends
- `GET /admin/analytics/engagement` - Get engagement metrics

### Audit & Logging
- `GET /admin/audit-logs` - Get admin audit logs

### System Health
- `GET /admin/health/system` - Get system health status
- `POST /admin/maintenance/toggle` - Toggle maintenance mode

### Data Export
- `GET /admin/export/users` - Export user data
- `GET /admin/export/feedback` - Export feedback data
- `GET /admin/export/training` - Export training data

## Database Schema

### Core Tables
- `users` - User accounts with admin flags
- `training_data` - AI training examples and rules
- `user_feedback` - User feedback on AI outputs
- `training_suggestions` - User-submitted training suggestions
- `analytics_events` - System usage and admin actions
- `ai_metrics` - AI performance metrics

### Key Features
- Row Level Security (RLS) for data protection
- Comprehensive indexing for performance
- Audit trails for all administrative actions
- Soft deletes for data preservation

## Security Features

### Authentication
- JWT tokens with configurable expiration
- Secure token storage and validation
- Automatic token refresh support

### Authorization
- Admin-only access to sensitive endpoints
- Email-based admin verification
- Database-backed admin status
- Comprehensive permission checking

### Data Protection
- Sensitive data filtering in responses
- Audit logging for all admin actions
- Secure database connections
- Input validation and sanitization

## Performance Features

### Pagination
- All list endpoints support pagination
- Configurable page sizes (1-1000)
- Offset-based pagination for consistency
- Total count information for UI pagination

### Filtering
- Comprehensive filtering options
- Date range filtering
- Status-based filtering
- Type-based filtering

### Caching
- Database query optimization
- Efficient indexing strategies
- Connection pooling
- Query result caching where appropriate

## Monitoring & Logging

### Audit Logs
- All admin actions are logged
- Structured logging with JSON format
- Action type and user identification
- Timestamp and metadata tracking

### System Health
- Database connectivity monitoring
- Storage usage tracking
- Error rate monitoring
- Performance metric collection

### Analytics
- User engagement metrics
- Feature usage statistics
- Training effectiveness tracking
- System performance monitoring

## Development

### Testing
Run the comprehensive test suite:
```bash
python test_admin_api.py
```

### API Documentation
Complete API documentation is available in:
- `docs/ADMIN_API_REFERENCE.md` - Detailed endpoint documentation
- FastAPI auto-generated docs at `/docs` when running locally

### Configuration
Admin emails can be configured via:
1. `ADMIN_EMAILS` environment variable (comma-separated)
2. Fallback hardcoded list in `config.py`

### Dependencies
- FastAPI - Web framework
- Pydantic - Data validation
- Supabase - Database client
- SQLAlchemy - Database ORM
- JWT - Authentication

## Deployment

### Environment Variables
```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Admin Configuration
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Optional API Keys
ANTHROPIC_API_KEY=your_anthropic_key
TAVILY_API_KEY=your_tavily_key
```

### Production Considerations
- Use HTTPS for all admin endpoints
- Implement rate limiting for admin actions
- Monitor audit logs regularly
- Backup training data regularly
- Use environment-specific admin email lists

## Troubleshooting

### Common Issues
1. **Authentication Failures**: Check JWT token validity and admin status
2. **Permission Denied**: Verify user has admin privileges
3. **Database Errors**: Check Supabase connection and RLS policies
4. **Rate Limiting**: Implement proper request throttling

### Debug Mode
Enable debug logging for detailed troubleshooting:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Checks
Use the system health endpoint to monitor status:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/admin/health/system
```

## Best Practices

### Security
- Never expose sensitive user data in API responses
- Use strong, unique admin passwords
- Regularly rotate JWT secrets
- Monitor audit logs for suspicious activity

### Performance
- Always use pagination for list endpoints
- Implement proper filtering to reduce data transfer
- Use batch operations when possible
- Monitor database query performance

### Data Management
- Regularly review and clean up training data
- Monitor feedback processing efficiency
- Track training effectiveness metrics
- Maintain data backup procedures

### User Management
- Use soft deletes for user deactivation
- Regularly review admin privileges
- Monitor user activity patterns
- Implement proper onboarding for new admins

## Support

For issues, questions, or contributions:
1. Check the API documentation
2. Review the test suite for examples
3. Check the audit logs for troubleshooting
4. Contact the development team

## License

This admin backend is part of the Analyst by Potomac application.