# Researcher Tool API Reference

## Overview

The Researcher Tool provides comprehensive market research and intelligence capabilities for the Analyst by Potomac platform. It integrates multiple financial data sources to deliver strategic insights, company analysis, and market intelligence.

## Base URL

```
https://potomac-analyst-workbench-production.up.railway.app/docs#/researcher
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Required API Keys

The researcher tool requires the following API keys to be configured in user settings:

- **Tavily API Key**: For web search and research
- **Finnhub API Key**: For market data, news, and insider trading
- **FMP API Key**: For financial statements and fundamentals

## Endpoints

### Company Research

#### POST /researcher/company

Get comprehensive company research including fundamentals, news, and AI analysis.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "include_news": true,
  "include_insider": true,
  "include_analyst": true
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "company_name": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "description": "Leading technology company...",
  "fundamentals": {
    "market_cap": 2960000000000,
    "pe_ratio": 29.5,
    "forward_pe": 27.8,
    "peg_ratio": 1.8,
    "price_to_book": 35.2,
    "price_to_sales": 7.8,
    "dividend_yield": 0.45,
    "earnings_growth": 0.12,
    "revenue_growth": 0.08,
    "roa": 0.18,
    "roe": 0.89,
    "debt_to_equity": 1.98,
    "current_ratio": 0.97
  },
  "financial_health": {
    "health_score": 0.75,
    "debt_to_equity": 1.98,
    "current_ratio": 0.97,
    "roe": 0.89,
    "roa": 0.18,
    "overall_health": "healthy"
  },
  "analyst_consensus": {
    "target_price": 195.23,
    "ratings": {"buy": 25, "hold": 8, "sell": 2},
    "sentiment": "bullish",
    "consensus": "Buy"
  },
  "insider_activity": {
    "recent_buys": 5,
    "recent_sells": 12,
    "net_insider_position": -2500000
  },
  "ai_summary": "Apple shows strong fundamentals...",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### GET /researcher/company/{symbol}

Get cached company research data.

**Response:**
```json
{
  "symbol": "AAPL",
  "company_name": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "description": "Leading technology company...",
  "fundamentals": {...},
  "financial_health": {...},
  "analyst_consensus": {...},
  "insider_activity": {...},
  "ai_summary": "Apple shows strong fundamentals...",
  "last_updated": "2024-01-15T10:30:00Z",
  "data_source": "fmp"
}
```

### Strategy Analysis

#### POST /researcher/strategy-analysis

Analyze how well a strategy fits current market conditions for a symbol.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "strategy_type": "moving_average_crossover",
  "timeframe": "daily"
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "strategy": "moving_average_crossover",
  "market_regime": "uptrend",
  "strategy_fit": "good",
  "confidence": 0.78,
  "recommendation": "Strong fit for current conditions",
  "risks": ["Fed tightening could reverse trend"],
  "opportunities": ["Breakout above 200 MA likely"],
  "adjusted_parameters": {
    "period_short": 20,
    "period_long": 50,
    "reason": "Shorter periods better in current volatility"
  }
}
```

#### GET /researcher/strategy-analysis/{symbol}

Get user's strategy analyses for a symbol.

**Response:**
```json
{
  "symbol": "AAPL",
  "analyses": [
    {
      "id": 1,
      "user_id": "user-id",
      "symbol": "AAPL",
      "strategy_type": "moving_average_crossover",
      "market_regime": "uptrend",
      "strategy_fit": "good",
      "confidence": 0.78,
      "recommendation": "Strong fit for current conditions",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Peer Comparison

#### POST /researcher/peer-comparison

Compare a company against its peers or industry benchmarks.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "peers": ["MSFT", "GOOGL", "AMZN"],
  "metrics": ["pe_ratio", "forward_pe", "peg_ratio", "price_to_book"]
}
```

**Response:**
```json
{
  "company": "AAPL",
  "peers": ["MSFT", "GOOGL", "AMZN"],
  "comparison": {
    "AAPL": {"pe_ratio": 29.5, "forward_pe": 27.8, "peg_ratio": 1.8},
    "MSFT": {"pe_ratio": 28.3, "forward_pe": 26.5, "peg_ratio": 1.6},
    "GOOGL": {"pe_ratio": 22.1, "forward_pe": 20.8, "peg_ratio": 1.4}
  },
  "analysis": "Apple trading at premium valuation...",
  "recommendation": "MSFT offers better value"
}
```

### Macro Context

#### POST /researcher/macro-context

Get current macroeconomic environment and its impact on markets.

**Request Body:**
```json
{
  "include_events": true,
  "include_sentiment": true
}
```

**Response:**
```json
{
  "fed_rate": 5.375,
  "inflation": 0.032,
  "unemployment": 0.038,
  "gdp_growth": 0.025,
  "sentiment_index": -0.15,
  "market_outlook": "cautious",
  "upcoming_events": [
    {
      "event": "CPI Release",
      "date": "2024-02-13",
      "expected_impact": "high",
      "market_reaction_guide": "High inflation = bearish for equities"
    }
  ]
}
```

#### GET /researcher/macro-context/latest

Get the latest cached macro context.

**Response:**
```json
{
  "context_date": "2024-01-15",
  "fed_rate": 5.375,
  "inflation": 0.032,
  "unemployment": 0.038,
  "gdp_growth": 0.025,
  "sentiment_index": -0.15,
  "market_outlook": "cautious",
  "upcoming_events": [...]
}
```

### Report Generation

#### POST /researcher/report

Generate a comprehensive research report.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "report_type": "company",
  "sections": ["executive_summary", "fundamental_analysis", "sentiment_analysis"],
  "format": "markdown"
}
```

**Response:**
```json
{
  "report_id": "report_AAPL_20240115_103000",
  "title": "AAPL Research Report - Company",
  "generated_at": "2024-01-15T10:30:00Z",
  "sections": [
    {
      "title": "Executive Summary",
      "content": "Apple Inc. is a leading technology company..."
    },
    {
      "title": "Fundamental Analysis",
      "content": "Apple shows strong fundamentals with a market cap..."
    }
  ],
  "export_formats": ["markdown", "pdf", "csv"]
}
```

#### GET /researcher/reports

Get user's generated research reports.

**Response:**
```json
{
  "reports": [
    {
      "report_id": "report_AAPL_20240115_103000",
      "symbol": "AAPL",
      "report_type": "company",
      "title": "AAPL Research Report - Company",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### GET /researcher/reports/{report_id}

Get a specific research report.

**Response:**
```json
{
  "report_id": "report_AAPL_20240115_103000",
  "symbol": "AAPL",
  "report_type": "company",
  "title": "AAPL Research Report - Company",
  "sections": [...],
  "export_formats": ["markdown", "pdf", "csv"],
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### DELETE /researcher/reports/{report_id}

Delete a research report.

**Response:**
```json
{
  "status": "deleted",
  "report_id": "report_AAPL_20240115_103000"
}
```

### News

#### POST /researcher/news

Get news articles for a company with sentiment analysis.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "limit": 20,
  "sentiment_filter": "positive"
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "news": [
    {
      "headline": "Apple reports strong quarterly earnings",
      "source": "Reuters",
      "timestamp": "2024-01-15T10:30:00Z",
      "sentiment": "positive",
      "summary": "Apple beats earnings expectations...",
      "url": "https://example.com/news/aapl",
      "sentiment_score": 0.8
    }
  ],
  "sentiment_score": 0.65,
  "article_count": 20
}
```

### Economic Indicators

#### POST /researcher/economic-indicators

Get economic indicators data.

**Request Body:**
```json
{
  "indicators": ["fed_rate", "inflation", "unemployment"],
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-15"
  }
}
```

**Response:**
```json
{
  "indicators": {
    "fed_rate": 5.375,
    "inflation": 0.032,
    "unemployment": 0.038
  },
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-15"
  }
}
```

### Research History

#### GET /researcher/history

Get user's research history.

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "user_id": "user-id",
      "symbol": "AAPL",
      "research_type": "company",
      "query_text": "Company research for AAPL",
      "result_summary": "Comprehensive research completed for AAPL",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### DELETE /researcher/history/{history_id}

Delete a research history entry.

**Response:**
```json
{
  "status": "deleted",
  "history_id": 1
}
```

### Statistics

#### GET /researcher/stats

Get researcher usage statistics.

**Response:**
```json
{
  "user_stats": {
    "total_researches": 25,
    "total_reports": 8,
    "strategy_analyses": 12,
    "peer_comparisons": 5
  },
  "recent_activity": [
    {
      "symbol": "AAPL",
      "research_type": "company",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "research_types": ["company", "strategy", "comparison", "macro", "report"],
  "symbols_researched": ["AAPL", "MSFT", "GOOGL"]
}
```

### Cache Management

#### POST /researcher/cache/cleanup

Clean up expired cache entries (admin function).

**Response:**
```json
{
  "status": "success",
  "message": "Cache cleanup completed"
}
```

## Error Responses

All endpoints return standard HTTP error codes:

- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

**Error Response Format:**
```json
{
  "detail": "Error message describing the issue"
}
```

## Rate Limits

- **Company Research**: 60 requests per minute per user
- **Strategy Analysis**: 30 requests per minute per user
- **Peer Comparison**: 20 requests per minute per user
- **Macro Context**: 10 requests per minute per user
- **Report Generation**: 5 requests per minute per user

## Data Sources

The researcher tool integrates the following data sources:

1. **OpenBB SDK**: Comprehensive financial data aggregation
2. **Finnhub API**: Real-time market data, news, and insider trading
3. **Financial Modeling Prep (FMP)**: Financial statements and fundamentals
4. **SEC EDGAR**: Official SEC filings and regulatory documents
5. **FRED API**: Federal Reserve economic data
6. **NewsAPI**: News aggregation from 150+ sources
7. **Claude AI**: AI analysis and report generation

## Caching Strategy

The researcher tool implements intelligent caching:

- **Fundamentals**: 1 hour cache
- **News**: 5 minutes cache
- **Insider Data**: 30 minutes cache
- **Analyst Data**: 30 minutes cache
- **Macro Data**: 30 minutes cache
- **Company Research**: 1 hour cache

## Webhooks and Real-time Updates

The researcher tool supports real-time updates for:

- **News Alerts**: Real-time news with sentiment analysis
- **Earnings Calendar**: Upcoming earnings dates and estimates
- **Insider Activity**: Real-time insider trading notifications
- **Market Events**: Economic calendar events and impacts

## Integration Examples

### JavaScript/TypeScript
```javascript
const response = await fetch('/api/researcher/company', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    symbol: 'AAPL',
    include_news: true,
    include_insider: true,
    include_analyst: true
  })
});

const data = await response.json();
console.log(data.company_name); // "Apple Inc."
```

### Python
```python
import requests

headers = {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
}

data = {
    'symbol': 'AAPL',
    'include_news': True,
    'include_insider': True,
    'include_analyst': True
}

response = requests.post('/api/researcher/company', headers=headers, json=data)
result = response.json()
print(result['company_name'])  # "Apple Inc."
```

## Best Practices

1. **API Key Management**: Store API keys securely and rotate regularly
2. **Error Handling**: Implement proper error handling for all endpoints
3. **Rate Limiting**: Respect rate limits and implement retry logic
4. **Caching**: Leverage caching to improve performance and reduce API calls
5. **Data Validation**: Validate all input parameters before making requests
6. **Security**: Use HTTPS and proper authentication for all requests

## Support

For support and questions about the Researcher Tool API:

- **Documentation**: [API Reference](./RESEARCHER_API_REFERENCE.md)
- **Examples**: [Frontend Implementation](../frontend/src/pages/ResearcherHome.tsx)
- **Backend**: [API Routes](../api/routes/researcher.py)
- **Engine**: [Researcher Engine](../core/researcher_engine.py)