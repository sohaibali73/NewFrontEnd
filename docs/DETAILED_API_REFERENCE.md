# Detailed API Reference Guide

This comprehensive guide explains every part of the Potomac Analyst Workbench API in detail.

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Authentication System](#authentication-system)
3. [Main Application](#main-application)
4. [Route Modules](#route-modules)
5. [Core Components](#core-components)
6. [Database Integration](#database-integration)
7. [Error Handling](#error-handling)
8. [Configuration](#configuration)

## Core Architecture

### FastAPI Application Structure

The application follows a modular FastAPI architecture with the following key components:

#### Main Application (`main.py`)
```python
app = FastAPI(
    title="Analyst by Potomac API",
    description="AI-powered AmiBroker AFL development platform",
    version="1.0.0",
)
```

**Key Features:**
- **CORS Configuration**: Allows cross-origin requests for frontend integration
- **Router Organization**: Modular route separation for maintainability
- **Error Handling**: Graceful handling of import failures with warnings
- **Development Mode**: Automatic port detection and server startup

**Router Loading Pattern:**
```python
try:
    from api.routes.auth import router as auth_router
    app.include_router(auth_router)
    logger.info("Loaded auth router")
except ImportError as e:
    logger.warning(f"Could not load auth router: {e}")
```

This pattern ensures the application starts even if individual modules have issues.

## Authentication System

### JWT-Based Authentication (`api/routes/auth.py`)

#### Core Components

**1. User Model (`User` class)**
```python
class User(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    nickname: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime
    last_active: Optional[datetime] = None
```

**Purpose**: Represents a user with all necessary fields for authentication and authorization.

**2. Authentication Schemas**

- **UserCreate**: For user registration
- **UserLogin**: For user login
- **Token**: JWT token response
- **TokenData**: Token payload structure
- **PasswordResetRequest**: Password reset initiation
- **PasswordResetConfirm**: Password reset completion

**3. Key Endpoints**

**POST `/auth/register`**
- **Purpose**: Create new user account
- **Process**: Email validation → Password hashing → Database storage → JWT generation
- **Security**: bcrypt password hashing, email uniqueness validation
- **Response**: JWT token and user information

**POST `/auth/login`**
- **Purpose**: Authenticate existing user
- **Process**: Email lookup → Password verification → JWT generation → Activity update
- **Security**: Rate limiting (5 attempts per 15 minutes), secure password comparison
- **Response**: JWT token and user information

**POST `/auth/refresh`**
- **Purpose**: Refresh expired JWT tokens
- **Process**: Token validation → New token generation
- **Security**: Validates existing token before refresh
- **Response**: New JWT token

**POST `/auth/reset-password/request`**
- **Purpose**: Initiate password reset process
- **Process**: Email validation → Reset token generation → Email sending
- **Security**: 15-minute token expiration, email verification required
- **Response**: Success confirmation (email sent)

**POST `/auth/reset-password/confirm`**
- **Purpose**: Complete password reset with token
- **Process**: Token validation → Password update → Token invalidation
- **Security**: Token expiration check, new password validation
- **Response**: Success confirmation

**4. Security Features**

**Password Security:**
- bcrypt hashing with salt rounds
- Password strength validation (8+ characters)
- Secure password comparison

**JWT Security:**
- 24-hour expiration
- Secure token generation with secret key
- Token validation and refresh mechanism

**Rate Limiting:**
- Login attempts limited to 5 per 15 minutes
- Prevents brute force attacks

**Email Verification:**
- Required for registration and password reset
- Prevents fake account creation

### API Key Management

**GET `/auth/api-keys`**
- **Purpose**: Retrieve user's API keys
- **Process**: User authentication → Key retrieval from database
- **Security**: Only authenticated users can access their keys
- **Response**: Claude and Tavily API keys

**PUT `/auth/api-keys`**
- **Purpose**: Update user's API keys
- **Process**: User authentication → Key validation → Database update
- **Security**: API key format validation, secure storage
- **Response**: Success confirmation

## Main Application Routes

### Root Endpoints (`main.py`)

**GET `/`**
- **Purpose**: Health check and application information
- **Response**: Application name, version, and status
- **Use Case**: Frontend can verify API connectivity

**GET `/health`**
- **Purpose**: System health check
- **Response**: Simple status confirmation
- **Use Case**: Load balancers and monitoring systems

**GET `/routes`**
- **Purpose**: List all available API endpoints
- **Response**: Array of route information (path, methods, name)
- **Use Case**: API documentation and debugging

## Route Modules

### 1. Authentication Routes (`api/routes/auth.py`)

**File Size**: 1,100+ lines
**Purpose**: Complete user authentication and authorization system

**Key Features:**
- JWT-based authentication
- Password reset functionality
- API key management
- Rate limiting and security measures
- Email verification system

**Dependencies:**
- `python-jose` for JWT handling
- `bcrypt` for password hashing
- `fastapi` for routing
- `pydantic` for data validation

### 2. Chat Routes (`api/routes/chat.py`)

**File Size**: 400+ lines
**Purpose**: AI-powered chat interface for AFL code assistance

**Key Features:**
- Real-time chat with AI assistant
- Context-aware responses using knowledge base
- Message history management
- User-specific chat sessions

**Core Endpoints:**

**POST `/chat/send`**
- **Purpose**: Send message to AI assistant
- **Process**: User authentication → Context gathering → AI processing → Response generation
- **Context Sources**: User preferences, knowledge base, conversation history
- **Response**: AI-generated text with metadata

**GET `/chat/history`**
- **Purpose**: Retrieve conversation history
- **Process**: User authentication → Message retrieval → Pagination
- **Features**: Date filtering, message ordering, pagination
- **Response**: Array of conversation messages

**DELETE `/chat/clear`**
- **Purpose**: Clear conversation history
- **Process**: User authentication → Message deletion
- **Security**: Only authenticated users can clear their history
- **Response**: Success confirmation

**Dependencies:**
- `anthropic` for AI chat functionality
- `supabase` for message storage
- `fastapi` for routing

### 3. AFL Routes (`api/routes/afl.py`)

**File Size**: 1,100+ lines
**Purpose**: Core AFL (AmiBroker Formula Language) code generation and management

**Key Features:**
- AI-powered AFL code generation
- Code validation and optimization
- Template management
- Code sharing and collaboration

**Core Endpoints:**

**POST `/afl/generate`**
- **Purpose**: Generate AFL code from natural language description
- **Process**: User authentication → Prompt processing → AI generation → Validation → Storage
- **Validation**: Syntax checking, rule compliance, pattern matching
- **Response**: Generated code with validation results

**POST `/afl/validate`**
- **Purpose**: Validate existing AFL code
- **Process**: Code analysis → Rule checking → Pattern detection → Optimization suggestions
- **Features**: Multiple validation types, detailed error reporting
- **Response**: Validation results with suggestions

**POST `/afl/optimize`**
- **Purpose**: Optimize existing AFL code
- **Process**: Code analysis → Performance optimization → Best practices application
- **Features**: Performance improvements, readability enhancements
- **Response**: Optimized code with change summary

**GET `/afl/templates`**
- **Purpose**: Retrieve AFL code templates
- **Process**: Template filtering → Pagination → Response formatting
- **Features**: Category-based filtering, search functionality
- **Response**: Array of template information

**POST `/afl/templates`**
- **Purpose**: Create new AFL template
- **Process**: User authentication → Template validation → Database storage
- **Features**: Template categorization, metadata management
- **Response**: Created template information

**Dependencies:**
- `anthropic` for AI code generation
- `core.afl_validator` for code validation
- `core.knowledge_base` for context
- `supabase` for storage

### 4. Reverse Engineer Routes (`api/routes/reverse_engineer.py`)

**File Size**: 400+ lines
**Purpose**: Convert existing AFL code into natural language explanations

**Key Features:**
- Code analysis and explanation
- Pattern recognition
- Documentation generation
- Code understanding assistance

**Core Endpoints:**

**POST `/reverse-engineer/analyze`**
- **Purpose**: Analyze AFL code and generate explanation
- **Process**: Code validation → AI analysis → Explanation generation → Storage
- **Features**: Line-by-line explanation, overall summary, key insights
- **Response**: Detailed code analysis

**POST `/reverse-engineer/batch`**
- **Purpose**: Analyze multiple AFL codes at once
- **Process**: Batch processing → Individual analysis → Aggregated results
- **Features**: Bulk processing, progress tracking
- **Response**: Array of analysis results

**Dependencies:**
- `anthropic` for AI analysis
- `core.afl_validator` for code validation
- `supabase` for storage

### 5. Brain Routes (`api/routes/brain.py`)

**File Size**: 500+ lines
**Purpose**: Knowledge base management and document processing

**Key Features:**
- Document upload and processing
- Text extraction from multiple formats
- AI-powered document classification
- Knowledge base search and retrieval

**Core Endpoints:**

**POST `/brain/upload`**
- **Purpose**: Upload and process documents
- **Process**: File upload → Content extraction → Classification → Storage → Chunking
- **Supported Formats**: PDF, DOCX, TXT, MD, AFL, CSV, JSON, HTML
- **Features**: Automatic categorization, content deduplication, RAG chunking
- **Response**: Processing results with classification

**POST `/brain/upload-batch`**
- **Purpose**: Upload multiple documents at once
- **Process**: Batch file processing → Individual document handling → Aggregated results
- **Features**: Progress tracking, individual file results, error handling
- **Response**: Batch processing summary

**POST `/brain/search`**
- **Purpose**: Search knowledge base content
- **Process**: Query processing → Text search → Result ranking → Response formatting
- **Features**: Category filtering, result limiting, text matching
- **Response**: Search results with metadata

**GET `/brain/documents`**
- **Purpose**: List all documents in knowledge base
- **Process**: Database query → Pagination → Response formatting
- **Features**: Category filtering, document metadata
- **Response**: Array of document information

**Dependencies:**
- `core.document_parser` for file processing
- `core.document_classifier` for AI classification
- `supabase` for storage

### 6. Backtest Routes (`api/routes/backtest.py`)

**File Size**: 300+ lines
**Purpose**: AFL code backtesting and performance analysis

**Key Features:**
- Historical data integration
- Performance metrics calculation
- Risk assessment
- Backtest result visualization

**Core Endpoints:**

**POST `/backtest/run`**
- **Purpose**: Execute backtest on AFL code
- **Process**: Code validation → Data retrieval → Backtest execution → Result calculation
- **Features**: Multiple timeframes, parameter optimization, risk metrics
- **Response**: Backtest results with performance statistics

**GET `/backtest/results`**
- **Purpose**: Retrieve backtest results
- **Process**: Result filtering → Pagination → Response formatting
- **Features**: Date range filtering, strategy comparison
- **Response**: Array of backtest results

**POST `/backtest/optimize`**
- **Purpose**: Optimize AFL strategy parameters
- **Process**: Parameter space definition → Optimization algorithm → Best parameters selection
- **Features**: Grid search, genetic algorithms, performance scoring
- **Response**: Optimized parameters with performance metrics

**Dependencies:**
- `yfinance` for market data
- `pandas` for data analysis
- `numpy` for calculations
- `supabase` for result storage

### 7. Admin Routes (`api/routes/admin.py`)

**File Size**: 2,000+ lines
**Purpose**: Administrative interface for system management

**Key Features:**
- User management
- Training data management
- System configuration
- Analytics and monitoring
- Audit logging

**Core Endpoints:**

**Admin Authentication**
- **Purpose**: Verify admin privileges
- **Process**: User lookup → Email/admin check → Permission verification
- **Features**: Configurable admin emails, fallback defaults
- **Security**: Multi-level admin verification

**Training Management**
- **Purpose**: Manage AI training data
- **Endpoints**: Add, update, delete, list training examples
- **Features**: Multiple training types, batch import, quick training
- **Types**: Examples, rules, patterns, corrections, terminology

**User Management**
- **Purpose**: Administer user accounts
- **Endpoints**: List, view, update, delete, restore users
- **Features**: Bulk operations, user statistics, activity tracking
- **Security**: Admin-only access, audit logging

**System Configuration**
- **Purpose**: Configure system settings
- **Endpoints**: Get, update configuration
- **Features**: Admin email management, system status
- **Security**: Admin-only access

**Analytics and Monitoring**
- **Purpose**: Monitor system usage and performance
- **Endpoints**: Overview, trends, engagement metrics
- **Features**: User activity, code generation stats, feedback analysis
- **Data**: Real-time and historical metrics

**Audit Logs**
- **Purpose**: Track administrative actions
- **Endpoints**: List, filter audit logs
- **Features**: Action filtering, user filtering, date ranges
- **Security**: Complete audit trail

**Dependencies:**
- `sqlalchemy` for database operations
- `supabase` for data storage
- `fastapi` for routing

### 8. Train Routes (`api/routes/train.py`)

**File Size**: 300+ lines
**Purpose**: AI model training and feedback management

**Key Features:**
- User feedback collection
- Training data suggestions
- Model improvement tracking
- Training analytics

**Core Endpoints:**

**POST `/train/feedback`**
- **Purpose**: Submit feedback on AI responses
- **Process**: User authentication → Feedback validation → Storage → Analysis trigger
- **Features**: Multiple feedback types, detailed explanations, rating system
- **Response**: Feedback ID and processing status

**POST `/train/suggest`**
- **Purpose**: Suggest new training data
- **Process**: User authentication → Suggestion validation → Review queue → Admin approval
- **Features**: Training type specification, priority setting, admin review workflow
- **Response**: Suggestion ID and review status

**GET `/train/suggestions`**
- **Purpose**: View training suggestions
- **Process**: User filtering → Status filtering → Pagination → Response formatting
- **Features**: Admin review interface, suggestion management
- **Response**: Array of training suggestions

**Dependencies:**
- `supabase` for feedback storage
- `core.training` for training management
- `fastapi` for routing

### 9. Researcher Routes (`api/routes/researcher.py`)

**File Size**: 1,200+ lines
**Purpose**: Market research and intelligence platform for financial analysis

**Key Features:**
- Company deep dives with fundamentals and financials
- Real-time news aggregation with sentiment analysis
- Strategy fit analysis for current market conditions
- Peer comparison and industry benchmarking
- SEC filings and regulatory intelligence
- Macro environment and economic analysis
- Custom research report generation
- Multi-source data integration

**Core Endpoints:**

**GET `/api/researcher/company/{symbol}`**
- **Purpose**: Get comprehensive company research for a stock symbol
- **Process**: Multi-source data aggregation → Sentiment analysis → AI summarization → Response formatting
- **Data Sources**: OpenBB (fundamentals), Finnhub (news), SEC EDGAR (filings), Claude AI (analysis)
- **Response**: Complete company profile with fundamentals, news, insider activity, analyst ratings, AI summary

**GET `/api/researcher/news/{symbol}`**
- **Purpose**: Get aggregated news with sentiment analysis for a company
- **Process**: News collection → Sentiment scoring → Source credibility ranking → Impact assessment
- **Features**: Real-time news aggregation, sentiment timeline, related stocks
- **Response**: News articles with sentiment scores, overall sentiment, news impact assessment

**POST `/api/researcher/strategy-analysis`**
- **Purpose**: Analyze how well a strategy fits current market conditions
- **Process**: Market regime analysis → Strategy performance correlation → Parameter optimization → Risk assessment
- **Features**: Strategy fit scoring, parameter suggestions, risk/reward analysis
- **Response**: Strategy fit analysis with recommendations and parameter adjustments

**POST `/api/researcher/comparison`**
- **Purpose**: Compare a company against its peers
- **Process**: Peer identification → Metric comparison → Valuation analysis → Relative performance
- **Features**: Side-by-side comparison, industry benchmarking, relative value assessment
- **Response**: Peer comparison with metric analysis and recommendations

**GET `/api/researcher/macro-context`**
- **Purpose**: Get current macroeconomic context and market outlook
- **Process**: Economic data collection → Fed policy analysis → Market sentiment → Outlook generation
- **Data Sources**: FRED API (economic data), Finnhub (market data), AI analysis
- **Response**: Macro environment analysis with economic indicators and market outlook

**GET `/api/researcher/sec-filings/{symbol}`**
- **Purpose**: Get recent SEC filings summary for a company
- **Process**: SEC EDGAR search → Filing parsing → Key metrics extraction → Summary generation
- **Features**: 10-K, 10-Q, 8-K form analysis, insider trading data
- **Response**: SEC filings with extracted key metrics and summaries

**POST `/api/researcher/generate-report`**
- **Purpose**: Generate custom research reports
- **Process**: Data collection → AI report generation → Format processing → Export preparation
- **Features**: Multiple report types, customizable sections, multiple export formats
- **Response**: Generated report with export options and download links

**GET `/api/researcher/reports/{report_id}/export`**
- **Purpose**: Export a previously generated report
- **Process**: Report retrieval → Format conversion → Download link generation
- **Formats**: PDF, CSV, Markdown
- **Response**: Export information with download URL and expiration

**GET `/api/researcher/search`**
- **Purpose**: Search for research across different categories
- **Process**: Query processing → Multi-source search → Result ranking → Response formatting
- **Categories**: Company, strategy, macro research
- **Response**: Search results with relevance scoring

**GET `/api/researcher/trending`**
- **Purpose**: Get trending research topics and companies
- **Process**: Activity analysis → Trend detection → Popularity ranking → Result formatting
- **Features**: Real-time trending analysis, category-specific trends
- **Response**: Trending research topics with popularity metrics

**GET `/api/researcher/health`**
- **Purpose**: Health check for researcher service
- **Process**: Service status verification → Data source testing → Performance metrics
- **Features**: Multi-service health check, performance monitoring
- **Response**: Service health status with component status

**Dependencies:**
- `openbb` for financial data aggregation
- `finnhub-python` for real-time market data
- `fredapi` for economic data
- `sec-api` for SEC filings
- `transformers` for sentiment analysis
- `anthropic` for AI analysis
- `redis` for caching
- `fastapi` for routing

**Researcher Engine Integration:**
- **Multi-Source Orchestration**: Coordinates multiple data sources
- **Async Processing**: Concurrent data fetching for optimal performance
- **Intelligent Caching**: Multi-tier caching strategy for performance
- **Fallback Mechanisms**: Graceful degradation when data sources fail

## Core Components

### 1. Document Parser (`core/document_parser.py`)

**Purpose**: Extract text content from various document formats

**Supported Formats:**
- **Text-based**: TXT, MD, AFL, CSV, JSON
- **Office Documents**: PDF, DOCX
- **Web Content**: HTML, HTM

**Processing Pipeline:**
1. **Format Detection**: Determine file type from extension
2. **Content Extraction**: Use appropriate parser for each format
3. **Text Cleaning**: Remove formatting artifacts, normalize whitespace
4. **Content Hashing**: Generate SHA-256 hash for deduplication

**PDF Processing:**
- **Primary**: PyMuPDF (fitz) - Fast, reliable text extraction
- **Fallback 1**: pdfplumber - Alternative PDF parser
- **Fallback 2**: pypdf - Basic PDF text extraction
- **Process**: Extract text from all pages → Join content → Clean text

**Error Handling:**
- Graceful degradation when libraries are missing
- Clear error messages for unsupported formats
- Content preservation for processing failures

### 2. Document Classifier (`core/document_classifier.py`)

**Purpose**: AI-powered document categorization and analysis

**Classification Process:**
1. **Content Analysis**: Analyze document content and structure
2. **Category Prediction**: Use AI to predict document category
3. **Metadata Extraction**: Extract summary, tags, subcategories
4. **Confidence Scoring**: Provide confidence level for classification

**AI Integration:**
- Uses Claude API for intelligent document analysis
- Processes document content and filename
- Generates structured classification results

**Output Structure:**
```python
@dataclass
class DocumentClassification:
    primary_category: str
    confidence: float
    subcategories: List[str]
    suggested_tags: List[str]
    summary: str
```

### 3. AFL Validator (`core/afl_validator.py`)

**Purpose**: Validate and analyze AFL code for correctness and best practices

**Validation Types:**
- **Syntax Validation**: Check for syntax errors and compilation issues
- **Rule Compliance**: Verify adherence to coding standards
- **Pattern Analysis**: Detect common patterns and anti-patterns
- **Performance Analysis**: Identify potential performance issues

**Validation Process:**
1. **Code Parsing**: Parse AFL code structure
2. **Rule Checking**: Apply validation rules
3. **Pattern Detection**: Identify code patterns
4. **Error Reporting**: Generate detailed validation results

**Integration Points:**
- Used by AFL generation endpoints for quality assurance
- Provides feedback for code optimization
- Supports multiple validation levels

### 4. Knowledge Base (`core/knowledge_base.py`)

**Purpose**: Manage and query the system's knowledge base

**Core Features:**
- **Document Storage**: Store and organize processed documents
- **Search Functionality**: Text-based search across knowledge base
- **Context Management**: Provide relevant context for AI responses
- **RAG Integration**: Support Retrieval-Augmented Generation

**Storage Structure:**
- **Documents**: Complete document information
- **Chunks**: Processed text chunks for efficient searching
- **Metadata**: Classification, tags, and other document metadata

**Search Capabilities:**
- Full-text search across document content
- Category-based filtering
- Relevance ranking
- Result pagination

### 5. Researcher (`core/researcher.py`)

**Purpose**: Conduct research and gather information for AI responses

**Research Process:**
1. **Query Analysis**: Understand research requirements
2. **Source Identification**: Identify relevant information sources
3. **Data Collection**: Gather information from multiple sources
4. **Analysis and Synthesis**: Analyze and synthesize findings
5. **Report Generation**: Create comprehensive research reports

**Integration:**
- Works with Tavily API for web research
- Integrates with knowledge base for internal information
- Supports complex multi-step research tasks

### 6. Training Manager (`core/training.py`)

**Purpose**: Manage AI training data and improvement processes

**Training Types:**
- **Examples**: Input/output example pairs
- **Rules**: Rules the AI must follow
- **Patterns**: Code patterns to use or avoid
- **Corrections**: Corrections to previous mistakes
- **Terminology**: Domain-specific terms and definitions

**Management Features:**
- **Training Data Storage**: Organize and store training examples
- **Quality Control**: Validate training data quality
- **Usage Tracking**: Track training data effectiveness
- **Batch Operations**: Import/export training data

**Integration:**
- Used by admin interface for training management
- Supports AI model improvement workflows
- Provides training analytics and insights

## Database Integration

### Supabase Client (`db/supabase_client.py`)

**Purpose**: Database connection and query management

**Key Features:**
- **Connection Management**: Handle database connections efficiently
- **Query Building**: Provide structured query interface
- **Error Handling**: Graceful handling of database errors
- **Security**: Secure connection with proper authentication

**Database Operations:**
- **CRUD Operations**: Create, Read, Update, Delete operations
- **Complex Queries**: Support for joins, aggregations, and filtering
- **Transactions**: Support for database transactions
- **Pagination**: Efficient handling of large datasets

**Security Measures:**
- **Connection Security**: Secure database connections
- **Query Validation**: Prevent SQL injection attacks
- **Access Control**: Role-based access to database operations
- **Audit Logging**: Track database operations for security

### Database Schema

**Core Tables:**
- **users**: User account information
- **afl_codes**: Generated AFL code and metadata
- **user_feedback**: User feedback on AI responses
- **training_data**: AI training examples
- **brain_documents**: Knowledge base documents
- **brain_chunks**: Processed document chunks
- **analytics_events**: System usage analytics

**Relationships:**
- Users own AFL codes, feedback, and training data
- Documents contain multiple chunks
- Feedback can reference specific AFL codes
- Training data supports multiple categories

## Error Handling

### Global Error Handling

**Exception Types:**
- **HTTPException**: Standard HTTP errors with status codes
- **ValidationError**: Pydantic validation errors
- **DatabaseError**: Database operation failures
- **AIError**: AI service communication failures

**Error Response Format:**
```json
{
  "error": "Error message",
  "type": "Error type",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Logging Strategy:**
- **Structured Logging**: Use structured logging for better analysis
- **Error Levels**: Different log levels for different error severities
- **Context Information**: Include relevant context in error logs
- **Security**: Avoid logging sensitive information

### Route-Specific Error Handling

**Authentication Errors:**
- Invalid credentials
- Expired tokens
- Missing permissions

**Validation Errors:**
- Invalid input data
- Missing required fields
- Format validation failures

**Business Logic Errors:**
- Duplicate entries
- Resource not found
- Operation not allowed

**External Service Errors:**
- AI service timeouts
- Database connection failures
- File processing errors

## Configuration

### Environment Variables

**Database Configuration:**
- `SUPABASE_URL`: Supabase database URL
- `SUPABASE_KEY`: Supabase API key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

**AI Service Configuration:**
- `ANTHROPIC_API_KEY`: Claude AI API key
- `TAVILY_API_KEY`: Tavily research API key

**Security Configuration:**
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

**Application Configuration:**
- `DEBUG`: Enable debug mode
- `PORT`: Application port (default: 8000)
- `HOST`: Application host (default: 0.0.0.0)

### Configuration Management

**Settings Class (`config.py`):**
- **Environment Loading**: Load configuration from environment variables
- **Validation**: Validate required configuration values
- **Defaults**: Provide sensible defaults for optional settings
- **Security**: Secure handling of sensitive configuration

**Configuration Patterns:**
- **Environment-based**: Different settings for development/production
- **Secure Defaults**: Secure configuration by default
- **Validation**: Validate configuration at startup
- **Documentation**: Clear documentation of all configuration options

## Security Considerations

### Authentication Security
- JWT tokens with expiration
- Secure password hashing with bcrypt
- Rate limiting on authentication endpoints
- Email verification for account creation

### Data Security
- Secure database connections
- Input validation and sanitization
- SQL injection prevention
- XSS protection for user content

### API Security
- CORS configuration for frontend integration
- Rate limiting on public endpoints
- API key validation for AI services
- Secure file upload handling

### Privacy Protection
- User data encryption at rest
- Minimal data collection
- Clear data retention policies
- User control over their data

## Performance Optimization

### Caching Strategies
- **Redis Integration**: Cache frequently accessed data
- **Database Query Optimization**: Optimize database queries
- **Static File Caching**: Cache static assets
- **API Response Caching**: Cache API responses where appropriate

### Database Optimization
- **Indexing**: Proper database indexing for performance
- **Query Optimization**: Optimize complex queries
- **Connection Pooling**: Efficient database connection management
- **Pagination**: Handle large datasets efficiently

### AI Service Optimization
- **Request Batching**: Batch AI service requests where possible
- **Caching**: Cache AI responses for similar requests
- **Timeout Handling**: Proper timeout handling for AI services
- **Fallback Mechanisms**: Graceful degradation when AI services are unavailable

## Monitoring and Observability

### Logging
- **Structured Logging**: Use structured logging for better analysis
- **Log Levels**: Appropriate log levels for different information
- **Performance Logging**: Log performance metrics and bottlenecks
- **Error Tracking**: Comprehensive error logging and tracking

### Metrics
- **API Response Times**: Monitor API performance
- **Error Rates**: Track error rates and patterns
- **User Activity**: Monitor user engagement and usage patterns
- **Resource Usage**: Track system resource usage

### Health Checks
- **Application Health**: Monitor application health
- **Database Health**: Monitor database connectivity and performance
- **External Service Health**: Monitor AI service availability
- **Resource Health**: Monitor system resources

This comprehensive API reference provides detailed information about every component of the Potomac Analyst Workbench system, enabling developers to understand, maintain, and extend the application effectively.