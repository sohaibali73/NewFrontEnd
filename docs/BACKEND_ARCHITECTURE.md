# Backend Architecture Documentation

## Overview

**Analyst by Potomac** is an AI-powered AmiBroker AFL (AmiBroker Formula Language) development platform built with FastAPI and Claude AI. This document provides a comprehensive breakdown of the backend architecture, source code structure, and system functionality.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Components](#core-components)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [AI Integration](#ai-integration)
7. [Code Generation Pipeline](#code-generation-pipeline)
8. [Validation System](#validation-system)
9. [Training and Learning](#training-and-learning)
10. [Security and Authentication](#security-and-authentication)
11. [Deployment and Configuration](#deployment-and-configuration)

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI        │    │   Supabase      │
│   (Web App)     │◄──►│   API Server     │◄──►│   PostgreSQL    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                │
                                ▼
                       ┌──────────────────┐
                       │   Claude AI      │
                       │   (Anthropic)    │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Tavily Search  │
                       │   (Web Research) │
                       └──────────────────┘
```

### Architecture Patterns

- **Microservices Architecture**: Modular design with separate concerns
- **RESTful API**: Clean HTTP API design following REST principles
- **Event-Driven**: Analytics and audit logging for system monitoring
- **Caching**: LRU caching for API keys and configuration
- **Streaming**: Server-Sent Events (SSE) for real-time code generation

## Technology Stack

### Backend Framework
- **FastAPI**: Modern Python web framework with automatic OpenAPI documentation
- **Python 3.10+**: Latest Python features and type hints
- **Pydantic**: Data validation and serialization

### Database & Storage
- **Supabase**: PostgreSQL-based backend with real-time capabilities
- **PostgreSQL**: Primary database for user data, AFL codes, and training data
- **Supabase Storage**: File storage for documents and training materials

### AI & Machine Learning
- **Claude AI (Anthropic)**: Primary LLM for code generation and analysis
- **Tavily**: Web search integration for research capabilities
- **Sentence Transformers**: Embedding generation for semantic search

### Development & Deployment
- **Docker**: Containerization for consistent deployment
- **Railway**: Cloud deployment platform
- **GitHub Actions**: CI/CD pipeline
- **Nixpacks**: Buildpack for deployment

### Dependencies
```txt
# Core Framework
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0

# AI & ML
anthropic==0.7.8
tavily-python==0.1.12
sentence-transformers==2.2.2

# Database
supabase==1.6.0
sqlalchemy==2.0.39

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Document Processing
PyPDF2==3.0.1
python-docx==0.8.11
PyMuPDF==1.24.4

# Utilities
python-dotenv==1.0.0
requests==2.31.0
yfinance==0.2.36
```

## Core Components

### 1. Main Application (`main.py`)

The entry point of the application that:
- Initializes FastAPI with CORS middleware
- Registers all API routers
- Configures logging and error handling
- Provides health check and route listing endpoints

```python
app = FastAPI(
    title="Analyst by Potomac API",
    description="AI-powered AmiBroker AFL development platform",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Configuration Management (`config.py`)

Centralized configuration using Pydantic settings:
- Environment-based configuration loading
- Database connection strings
- API keys management
- Security settings (JWT, encryption)
- Admin email configuration

```python
class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    secret_key: str = "change-this-in-production"
    anthropic_api_key: str = ""
    tavily_api_key: str = ""
    admin_emails: str = ""
```

### 3. Database Layer (`db/supabase_client.py`)

Singleton pattern for database connections:
- Supabase client initialization
- Connection pooling and management
- Error handling and retry logic

```python
def get_supabase() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client
```

### 4. Authentication & Dependencies (`api/dependencies.py`)

JWT-based authentication system:
- User authentication via JWT tokens
- API key management with caching
- Permission-based access control

```python
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and validate user ID from JWT token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    return payload.get("sub")
```

## API Endpoints

### Authentication Routes (`api/routes/auth.py`)

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `PUT /auth/api-keys` - Update API keys

### AFL Generation Routes (`api/routes/afl.py`)

- `POST /afl/generate` - Generate AFL code from natural language
- `POST /afl/optimize` - Optimize existing AFL code
- `POST /afl/debug` - Debug and fix AFL code errors
- `POST /afl/explain` - Explain AFL code in plain English
- `POST /afl/validate` - Validate AFL code syntax
- `GET /afl/codes` - List user's saved AFL codes
- `GET /afl/codes/{code_id}` - Get specific AFL code
- `DELETE /afl/codes/{code_id}` - Delete AFL code

### Chat Routes (`api/routes/chat.py`)

- `POST /chat` - Interactive chat with AI assistant
- `GET /chat/history` - Get conversation history
- `POST /chat/feedback` - Submit feedback on responses

### Research Routes (`api/routes/reverse_engineer.py`)

- `POST /research` - Research trading strategies
- `POST /research/fund` - Research specific funds
- `POST /research/web` - Web search for strategy information

### Researcher Routes (`api/routes/researcher.py`)

- `GET /api/researcher/company/{symbol}` - Complete company research
- `GET /api/researcher/news/{symbol}` - News aggregation with sentiment
- `POST /api/researcher/strategy-analysis` - Strategy fit analysis
- `POST /api/researcher/comparison` - Peer comparison analysis
- `GET /api/researcher/macro-context` - Macro environment analysis
- `GET /api/researcher/sec-filings/{symbol}` - SEC filings summary
- `POST /api/researcher/generate-report` - Custom report generation
- `GET /api/researcher/reports/{report_id}/export` - Report export
- `GET /api/researcher/search` - Research search
- `GET /api/researcher/trending` - Trending research topics
- `GET /api/researcher/health` - Health check

### Admin Routes (`api/routes/admin.py`)

- `GET /admin/status` - Admin dashboard and system overview
- `POST /admin/train` - Add training examples for AI
- `GET /admin/training` - List training data
- `POST /admin/feedback/review` - Review user feedback
- `GET /admin/analytics` - System analytics and metrics
- `GET /admin/users` - User management
- `POST /admin/make-admin` - Grant admin privileges

### Brain Routes (`api/routes/brain.py`)

- `POST /brain/upload` - Upload documents for knowledge base
- `GET /brain/documents` - List stored documents
- `POST /brain/query` - Query knowledge base
- `DELETE /brain/documents/{id}` - Delete documents

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR,
    nickname VARCHAR,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    claude_api_key VARCHAR,
    tavily_api_key VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);
```

#### AFL Codes Table
```sql
CREATE TABLE afl_codes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    conversation_id VARCHAR,
    name VARCHAR(200),
    description TEXT,
    code TEXT NOT NULL,
    strategy_type VARCHAR(50),
    quality_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Training Data Tables
```sql
CREATE TABLE training_examples (
    id SERIAL PRIMARY KEY,
    training_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    input_prompt TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    explanation TEXT,
    category VARCHAR(50) DEFAULT 'afl',
    tags TEXT[],
    priority INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE training_suggestions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    training_type VARCHAR(50) NOT NULL,
    input_prompt TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    explanation TEXT,
    category VARCHAR(50) DEFAULT 'afl',
    tags TEXT[],
    priority INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Feedback and Analytics Tables
```sql
CREATE TABLE user_feedback (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    feedback_type VARCHAR(20) NOT NULL,
    feedback_text TEXT,
    rating INTEGER,
    status VARCHAR(20) DEFAULT 'pending_review',
    original_prompt TEXT,
    generated_code TEXT,
    correct_code TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## AI Integration

### Claude Engine (`core/claude_engine.py`)

The core AI engine that handles all Claude API interactions:

```python
class ClaudeAFLEngine:
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.MODEL = model

    def generate_afl(self, request: str, strategy_type: StrategyType) -> Dict[str, Any]:
        # Generate AFL code with optimized prompts
        # Include training context and validation
        # Return code, explanation, and quality metrics
```

#### Key Features:
- **Multi-Strategy Support**: Standalone vs composite strategies
- **Context Optimization**: Intelligent context management to prevent prompt bloat
- **Streaming Responses**: Real-time code generation with Server-Sent Events
- **Quality Scoring**: Automated code quality assessment
- **Error Handling**: Robust error handling and fallback mechanisms

### Researcher (`core/researcher.py`)

Integrates multiple data sources for comprehensive research:

```python
class StrategyResearcher:
    def __init__(self, tavily_api_key: str):
        self.tavily_client = TavilyClient(api_key=tavily_api_key)
    
    def research_strategy(self, query: str) -> str:
        # Web search via Tavily
        # SEC EDGAR filings search
        # Yahoo Finance market data
        # Combine results for comprehensive research
```

#### Research Capabilities:
- **Web Search**: Real-time web search for strategy information
- **SEC EDGAR**: Access to fund filings and regulatory documents
- **Market Data**: Yahoo Finance integration for market context
- **Document Analysis**: PDF and document processing

### Context Manager (`core/context_manager.py`)

Optimizes prompt context to prevent token overflow:

```python
def build_optimized_context(
    user_query: str,
    kb_context: str = "",
    conversation_history: List[Dict] = None,
    training_context: str = "",
    max_tokens: int = 8000
) -> str:
    # Intelligent context truncation
    # Priority-based content selection
    # Token-efficient formatting
```

#### Context Optimization:
- **Token Management**: Prevents prompt overflow with intelligent truncation
- **Priority System**: Ensures most important context is retained
- **Caching**: LRU caching for frequently accessed context
- **Compression**: Efficient context formatting

## Code Generation Pipeline

### 1. Input Processing

```python
# User request: "Create a moving average crossover strategy"
request = "Create a moving average crossover strategy"
strategy_type = StrategyType.STANDALONE
```

### 2. Context Building

```python
# Build comprehensive context
context = build_optimized_context(
    user_query=request,
    kb_context=get_knowledge_base_context(),
    conversation_history=get_recent_messages(),
    training_context=get_training_context(),
    max_tokens=8000
)
```

### 3. Prompt Generation

```python
# Generate optimized prompt with system instructions
system_prompt = get_condensed_base_prompt()
system_prompt += get_condensed_generate_prompt(strategy_type.value)
system_prompt += f"\n\nKB CONTEXT:\n{kb_context}"
```

### 4. AI Generation

```python
# Call Claude API with streaming support
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=8192,
    system=system_prompt,
    messages=[{"role": "user", "content": request}]
)
```

### 5. Code Extraction & Validation

```python
# Extract AFL code from response
afl_code = extract_code(response.content[0].text)

# Validate and fix common issues
validated_code, errors, warnings = validate_and_fix(afl_code)

# Calculate quality score
quality_score = calculate_quality(validated_code, errors, warnings)
```

### 6. Storage & Response

```python
# Save to database
db.table("afl_codes").insert({
    "user_id": user_id,
    "name": request[:100],
    "code": validated_code,
    "quality_score": quality_score
})

# Return response
return {
    "afl_code": validated_code,
    "explanation": extract_explanation(response),
    "stats": {"quality_score": quality_score}
}
```

## Validation System

### AFL Validator (`core/afl_validator.py`)

Comprehensive validation system that prevents AI hallucinations:

#### Color Validation
```python
VALID_COLORS = {
    "colorBlack", "colorBlue", "colorGreen", "colorRed", 
    "colorYellow", "colorOrange", "colorWhite", "colorBlack",
    # ... 30+ official AmiBroker colors
}

def validate_colors(self, code: str) -> List[str]:
    # Check for invalid custom RGB usage
    # Validate only official AmiBroker colors
    # Suggest corrections for typos
```

#### Function Signature Validation
```python
SINGLE_ARG_FUNCTIONS = {
    "RSI": 1, "ATR": 1, "ADX": 1, "CCI": 1, "MFI": 1
}

DOUBLE_ARG_FUNCTIONS = {
    "MA": 2, "EMA": 2, "SMA": 2, "WMA": 2, "MACD": 2
}

def validate_functions(self, code: str) -> List[str]:
    # Detect hallucinations like RSI(Close, 14) instead of RSI(14)
    # Validate argument counts for all functions
    # Provide specific error messages and fixes
```

#### Reserved Word Validation
```python
RESERVED_WORDS = {
    "Buy", "Sell", "Short", "Cover",
    "Open", "High", "Low", "Close", "Volume",
    "RSI", "MACD", "MA", "EMA", "ATR"
}

def validate_reserved_words(self, code: str) -> List[str]:
    # Prevent shadowing of built-in functions and variables
    # Suggest alternative variable names
```

#### Plot Style Validation
```python
VALID_PLOT_STYLES = {
    "styleLine", "styleHistogram", "styleCandle", "styleBar",
    "styleArea", "styleDots", "styleThick", "styleDashed"
}

def validate_plot_styles(self, code: str) -> List[str]:
    # Validate only official AmiBroker plot styles
    # Suggest corrections for invalid styles
```

### Auto-Fixing Capabilities

```python
def fix_code(self, code: str) -> Tuple[str, List[str]]:
    fixes = []
    
    # Fix RSI(Close, 14) → RSI(14)
    code = re.sub(r'\bRSI\s*\(\s*Close\s*,\s*(\d+)\s*\)', r'RSI(\1)', code)
    fixes.append("Fixed RSI function signature")
    
    # Fix MA(14) → MA(Close, 14)
    code = re.sub(r'\bMA\s*\(\s*(\d+)\s*\)', r'MA(Close, \1)', code)
    fixes.append("Fixed MA function signature")
    
    return code, fixes
```

## Training and Learning

### Training Manager (`core/training.py`)

Dynamic AI training system that allows admins to teach the AI:

#### Training Types
```python
class TrainingType(str, Enum):
    EXAMPLE = "example"           # Input/output example pairs
    RULE = "rule"                 # Rules the AI must follow
    PATTERN = "pattern"           # Code patterns to use
    ANTI_PATTERN = "anti_pattern" # Patterns to avoid
    CORRECTION = "correction"     # Corrections to previous mistakes
    TERMINOLOGY = "terminology"   # Domain-specific terms
```

#### Training Data Structure
```python
@dataclass
class TrainingExample:
    id: str
    training_type: str
    title: str
    input_prompt: str
    expected_output: str
    explanation: str
    category: str
    tags: List[str]
    priority: int
    is_active: bool
    created_by: str
    created_at: datetime
```

#### Training Context Injection
```python
def get_training_context(self, category: str = "afl", limit: int = 5) -> str:
    """Get training context to inject into AI prompts."""
    examples = self.get_training_examples(category=category, limit=limit)
    
    context = "## LEARNED RULES:\n\n"
    for example in examples:
        context += f"### {example.title}\n"
        context += f"**When user asks:** {example.input_prompt}\n"
        context += f"**AI should respond:** {example.expected_output}\n"
        if example.explanation:
            context += f"**Explanation:** {example.explanation}\n"
        context += "\n"
    
    return context
```

### Feedback-Driven Learning

```python
def add_correction_from_feedback(
    self,
    original_prompt: str,
    wrong_output: str,
    correct_output: str,
    feedback: str,
    created_by: str
) -> Dict[str, Any]:
    """Create training data from user feedback."""
    return self.add_training_example(
        training_type="correction",
        title=f"Correction: {original_prompt[:50]}",
        input_prompt=original_prompt,
        expected_output=correct_output,
        explanation=f"User feedback: {feedback}",
        category="afl",
        priority=10,  # High priority for corrections
        created_by=created_by
    )
```

### Admin Training Interface

The admin panel provides comprehensive training management:

- **Add Training**: Create new training examples
- **Review Feedback**: Process user feedback and create corrections
- **Batch Import**: Import training data in bulk
- **Analytics**: Track training effectiveness
- **Context Preview**: See what the AI "knows" from training

## Security and Authentication

### JWT Authentication

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60*24*7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
```

### Admin Authorization

```python
async def verify_admin(user_id: str = Depends(get_current_user_id)) -> str:
    """Verify that the current user is an admin."""
    db = get_supabase()
    result = db.table("users").select("is_admin").eq("id", user_id).execute()
    
    if not result.data or not result.data[0].get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user_id
```

### API Key Management

```python
@lru_cache(maxsize=1000)
def get_cached_api_keys(user_id: str) -> dict:
    """Get user's API keys from database with caching."""
    db = get_supabase()
    result = db.table("users").select(
        "claude_api_key, tavily_api_key"
    ).eq("id", user_id).execute()
    
    user = result.data[0]
    return {
        "claude": user.get("claude_api_key") or settings.anthropic_api_key,
        "tavily": user.get("tavily_api_key") or settings.tavily_api_key,
    }
```

### Security Features

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Controlled cross-origin access
- **Audit Logging**: Track all admin actions
- **Data Encryption**: Sensitive data encryption at rest

## Deployment and Configuration

### Docker Configuration

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# AI Services
ANTHROPIC_API_KEY=your_claude_api_key
TAVILY_API_KEY=your_tavily_api_key

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256

# Admin Configuration
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### Railway Deployment

```json
{
  "name": "potomac-analyst-workbench",
  "env": {
    "PORT": "8000"
  },
  "build": {
    "builder": "nixpacks"
  }
}
```

### Health Monitoring

```python
@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.get("/routes")
async def list_routes():
    """List all available routes."""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name,
            })
    return {"routes": routes}
```

## Performance Optimization

### Caching Strategy

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_api_keys(user_id: str) -> dict:
    # Cache API keys for 1000 users
    pass

@lru_cache(maxsize=500)
def get_training_context(category: str, limit: int) -> str:
    # Cache training context
    pass
```

### Database Optimization

- **Connection Pooling**: Efficient database connection management
- **Indexing**: Proper indexes on frequently queried fields
- **Pagination**: Efficient data retrieval with limits and offsets
- **Query Optimization**: Minimize database round trips

### Context Optimization

```python
def truncate_context(context: str, max_tokens: int = 4000) -> str:
    """Truncate context to fit within token limits."""
    # Intelligent truncation preserving important information
    # Priority-based content selection
    pass
```

### Streaming Responses

```python
async def generate_stream(system_prompt: str, messages: List[Dict]):
    """Stream responses for real-time code generation."""
    with client.messages.stream(
        model=self.MODEL,
        max_tokens=self.MAX_TOKENS,
        system=system_prompt,
        messages=messages
    ) as stream:
        for text in stream.text_stream:
            yield {"type": "chunk", "content": text}
```

## Error Handling and Monitoring

### Comprehensive Error Handling

```python
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global general exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
```

### Analytics and Monitoring

```python
def log_analytics_event(
    user_id: str,
    event_type: str,
    event_category: str,
    event_data: Dict[str, Any]
):
    """Log analytics event for monitoring."""
    db.table("analytics_events").insert({
        "user_id": user_id,
        "event_type": event_type,
        "event_category": event_category,
        "event_data": event_data,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
```

### Health Checks

- **Database Connectivity**: Regular database health checks
- **API Availability**: Monitor external API status
- **Resource Usage**: Track memory and CPU usage
- **Error Rates**: Monitor and alert on error patterns

## Conclusion

The Analyst by Potomac backend is a sophisticated, production-ready system that combines modern web development practices with cutting-edge AI technology. The architecture is designed for:

- **Scalability**: Handle growing user base and data volume
- **Reliability**: Robust error handling and monitoring
- **Security**: Comprehensive authentication and authorization
- **Performance**: Optimized for fast response times
- **Maintainability**: Clean, modular code structure
- **Extensibility**: Easy to add new features and capabilities

The system successfully bridges the gap between natural language requests and complex AFL code generation, providing a powerful tool for traders and analysts while maintaining the highest standards of code quality and system reliability.