# Researcher Tool Implementation

## Overview

The Researcher tool is a comprehensive Market Researcher & Intelligence Platform that transforms raw market data into strategic intelligence. This is a standalone tool that provides deep financial research, market analysis, and strategic intelligence gathering capabilities.

## Features

### Core Capabilities

1. **Company Deep Dives**
   - Fundamentals analysis (P/E ratio, revenue, earnings, growth rates, margins)
   - Business analysis (what the company does, competitive position, market share)
   - Management analysis (CEO background, insider ownership, recent transactions)
   - Risk factors (listed risks, litigation, regulatory issues)
   - Growth catalysts (upcoming events, product launches, earnings dates)
   - Valuation analysis (fair value estimates, price targets from analysts)

2. **Market Context & Intelligence**
   - Industry trends analysis
   - Macro environment impact (Fed policy, interest rates, inflation)
   - Market sentiment tracking (Fear/Greed index, put/call ratios, insider activity)
   - Correlation analysis (which stocks move together, diversification advice)
   - Sector rotation insights (which sectors outperforming, money flows)
   - Economic calendar integration

3. **Strategy Research & Backtesting Context**
   - Strategy type matching ("Which stocks work best with moving average crossovers?")
   - Historical validation ("Did this strategy work during 2020 crash?")
   - Market regime analysis ("Does this strategy work in low/high volatility?")
   - Similar strategies discovery ("Who else uses this approach? How did they do?")
   - Risk analysis ("What can go wrong with this strategy?")
   - Optimization suggestions ("These parameters work better in current market")

4. **Research Reports & Analysis**
   - Multi-source integration (SEC filings, analyst reports, news, social sentiment)
   - Custom report generation with AI
   - Comparison analysis (stock vs competitors vs industry benchmarks)
   - Technical + fundamental analysis combination
   - Export options (PDF, CSV, markdown formats)
   - Customizable reports (choose which sections to include)

5. **News & Sentiment Analysis**
   - Aggregated news from 100+ sources
   - Sentiment scoring (positive/negative/neutral categorization)
   - News timeline (historical news for any date range)
   - Source credibility ranking
   - Related news ("Other stocks affected by this news")
   - Impact assessment ("How will this news affect the stock?")

6. **Data Comparison & Screening**
   - Peer analysis (compare against direct competitors)
   - Industry benchmarking (how it compares to industry averages)
   - Custom screening (filter by any metric)
   - Growth vs value comparison
   - Risk metrics (volatility, beta, max drawdown comparisons)
   - Dividend analysis (yield, growth, sustainability)

7. **SEC & Regulatory Intelligence**
   - 10-K analysis (annual reports summarized)
   - 10-Q analysis (quarterly reports with key metrics)
   - 8-K alerts (major corporate events)
   - Insider trading analysis
   - Short interest data
   - Regulatory changes tracking

8. **Economic & Macro Analysis**
   - Fed policy impact analysis
   - Economic indicators (GDP, unemployment, inflation data)
   - Bond market analysis (Treasury yields, spreads, credit spreads)
   - Currency impact (how FX affects international stocks)
   - Commodity impact (how oil, metals, agriculture affects sectors)
   - Market cycles analysis (where in economic cycle are we?)

## Architecture

### Backend Components

#### Researcher Engine (`core/researcher_engine.py`)
The core orchestrator that integrates all data sources:

```python
class ResearcherEngine:
    def __init__(self):
        # Initialize all pre-built tools
        self.openbb = openbb.EquityToolkit()  # OpenBB
        self.finnhub = finnhub.Client()       # Finnhub
        self.fred = requests (FRED API)        # Federal Reserve
        self.nlp = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finBERT")  # FinBERT
        self.claude = anthropic.Anthropic()   # Claude AI
        
    def get_company_research(self, symbol):
        """Orchestrate multiple pre-built data sources"""
        # Implementation details...
```

#### API Routes (`api/routes/researcher.py`)
Comprehensive REST API endpoints:

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

### Frontend Components

#### Research Pages
- **CompanyDeepDive.tsx** - Comprehensive company analysis
- **StrategyAnalysis.tsx** - Strategy fit and optimization
- **PeerComparison.tsx** - Comparative analysis
- **SECFilings.tsx** - SEC filings and regulatory analysis
- **MacroContext.tsx** - Macro environment analysis
- **NewsAnalysis.tsx** - News aggregation and sentiment

#### UI Components
- **ResearchCard.tsx** - Container for research sections
- **MetricComparison.tsx** - Side-by-side metric comparison
- **SentimentGauge.tsx** - Visual sentiment indicator
- **ReportBuilder.tsx** - Custom report configuration
- **DataTimeline.tsx** - Historical events and data timeline

## Data Sources

### Pre-Built Integrations

#### OpenBB SDK (Primary Data Source)
- **Purpose**: Single API to 50+ financial data sources
- **Components**: Stock fundamentals, financial statements, analyst ratings, insider trading, short interest, options data, economic data
- **Installation**: `pip install openbb`
- **Why**: Instead of making 10 API calls, one OpenBB call gets everything

#### Finnhub API
- **Purpose**: Real-time financial market data
- **Components**: News API, insider trading, crypto data, earnings calendar, economic calendar, IPO calendar, company events
- **Free Tier**: 60 API calls/minute
- **Why**: Better than yfinance for news, earnings, insider data

#### FRED API (Federal Reserve)
- **Purpose**: U.S. economic data directly from Federal Reserve
- **Components**: GDP, unemployment, inflation, interest rates, employment data, housing data, money supply, stock market data
- **Free Tier**: Unlimited API calls (requires API key)
- **Why**: Understand macro environment affecting stocks

#### SEC EDGAR
- **Purpose**: All SEC filings in searchable format
- **Components**: 10-K (annual reports), 10-Q (quarterly reports), 8-K (current reports), insider trading forms, proxy statements
- **Access**: Direct HTTP API (no key needed)
- **Why**: Legal documents, insider trading, corporate actions

#### FinBERT (Sentiment Analysis)
- **Purpose**: Pre-trained AI model for financial sentiment analysis
- **Components**: Sentiment scoring (-1 to +1), confidence levels, multi-language support
- **Installation**: `pip install transformers torch`
- **Why**: Don't build ML models, use pre-trained ones

#### Claude AI
- **Purpose**: AI analysis and report generation
- **Use Cases**: Summarize financial reports, generate research recommendations, analyze sentiment from news, create custom reports, answer specific financial questions, provide strategy recommendations
- **Why**: Already integrated, use existing claude_engine.py

## Configuration

### Environment Variables

```bash
# Required (Already in your stack)
ANTHROPIC_API_KEY=sk-ant-...  # Already have
TAVILY_API_KEY=tvly-...       # Already have
REDIS_URL=redis://...         # Already have

# New - Researcher Specific
FINNHUB_API_KEY=your_key      # Free: 60 calls/min
NEWSAPI_KEY=your_key          # Free: 100 requests/day
FMP_API_KEY=your_key          # Free: 250 calls/day
FRED_API_KEY=your_key         # Free: Unlimited

# Optional Premium (If Budget Allows)
OPENBB_API_KEY=your_key
SEC_API_KEY=your_key
FACTSET_KEY=your_key
```

### Configuration Updates

The `config.py` has been updated to include researcher-specific API keys:

```python
# Researcher tool API keys
finnhub_api_key: str = ""
fred_api_key: str = ""
newsapi_key: str = ""
openbb_api_key: str = ""
sec_api_key: str = ""
```

## Caching Strategy

### Multi-Tier Caching

```
Tier 1 - Redis (5 minute TTL):
├── Real-time data
├── News sentiment
└── Market status

Tier 2 - Redis (1 hour TTL):
├── Company fundamentals
├── Analyst ratings
└── Insider trading

Tier 3 - Redis (24 hour TTL):
├── Financial statements
├── SEC filings
└── Economic indicators

Tier 4 - Database (1 week TTL):
├── Generated reports
├── User research history
└── Cached analysis results
```

### Smart Fallback Strategy

```
OpenBB request fails
  ↓
Try FMP API (financial data)
  ↓
If both fail → serve cached data with "stale" warning
  ↓
Queue request for retry during off-hours
```

## Performance Optimization

### Async Requests

```python
async def get_company_research(symbol):
    """Fetch from multiple APIs concurrently"""
    
    tasks = [
        get_openbb_data(symbol),
        get_finnhub_data(symbol),
        get_sec_data(symbol),
        get_fred_data(symbol)
    ]
    
    results = await asyncio.gather(*tasks)
    return combine_results(results)

# Runs all 4 APIs in parallel instead of serial
# Total time: ~1-2 seconds instead of 8-10 seconds
```

### Lazy Loading

- Show company name + quick metrics (cached)
- Load fundamentals async
- Load news async
- Load SEC filings async
- Load macro data async

### Report Generation Async

- Queue report generation jobs
- Return job ID immediately
- Check status via separate endpoint
- Download when complete

## Testing

### Test Script (`test_researcher_api.py`)

Comprehensive test suite covering all endpoints:

```bash
# Run the test suite
python test_researcher_api.py

# Test against local server
BASE_URL = "http://localhost:8000"
TEST_SYMBOL = "AAPL"
```

### Test Coverage

- Health check endpoint
- Company research endpoint
- News aggregation endpoint
- Strategy analysis endpoint
- Peer comparison endpoint
- Macro context endpoint
- SEC filings endpoint
- Report generation endpoint
- Search endpoint
- Trending endpoint

## Integration Points

### With Existing Features

1. **From AFL Generator**:
   - "Research This Strategy" button → opens StrategyResearcher
   - Passes strategy type to researcher
   - Shows how to optimize parameters for current market

2. **From Chart/Analysis**:
   - "Deep Research" button on any stock → opens CompanyResearch
   - "Compare with Peers" → opens ComparativeAnalysis with auto-populated symbol

3. **From Chat**:
   - Researcher links in responses (e.g., "Research Apple's fundamentals")
   - Click opens relevant researcher page

4. **From Knowledge Base**:
   - "Related Companies" section
   - "Market Context" for strategy documents

5. **From Dashboard**:
   - Researcher widget showing "Markets to Research"
   - Quick access to macro environment

## Database Extensions

### New Tables

#### research_reports
```sql
CREATE TABLE research_reports (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES auth.users(id),
    symbol VARCHAR(10) NOT NULL,
    report_type VARCHAR(50),  -- 'company', 'strategy', 'comparison'
    title VARCHAR(255),
    sections JSONB,  -- Report content
    export_formats TEXT[],  -- pdf, csv, markdown
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP  -- For auto-cleanup
);
```

#### research_cache
```sql
CREATE TABLE research_cache (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    data_type VARCHAR(50),  -- 'fundamentals', 'news', 'insider', 'filings'
    data JSONB NOT NULL,
    source VARCHAR(50),  -- 'openbb', 'finnhub', 'sec', 'fred'
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);
```

#### research_history
```sql
CREATE TABLE research_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES auth.users(id),
    symbol VARCHAR(10),
    research_type VARCHAR(50),  -- 'company', 'strategy', 'macro'
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Usage Examples

### Basic Company Research

```python
# Get comprehensive company research
response = requests.get("http://localhost:8000/api/researcher/company/AAPL")
data = response.json()

# Access different sections
fundamentals = data['data']['fundamentals']
news = data['data']['news']
insider = data['data']['insider_activity']
ai_summary = data['data']['ai_summary']
```

### Strategy Analysis

```python
# Analyze strategy fit for current market
payload = {
    "symbol": "AAPL",
    "strategy_type": "momentum",
    "timeframe": "daily"
}

response = requests.post(
    "http://localhost:8000/api/researcher/strategy-analysis",
    json=payload
)
analysis = response.json()
```

### Peer Comparison

```python
# Compare Apple against Microsoft and Google
payload = {
    "symbol": "AAPL",
    "peers": ["MSFT", "GOOGL", "AMZN"]
}

response = requests.post(
    "http://localhost:8000/api/researcher/comparison",
    json=payload
)
comparison = response.json()
```

### Report Generation

```python
# Generate custom research report
payload = {
    "symbol": "AAPL",
    "report_type": "company",
    "sections": ["executive_summary", "fundamental_analysis"],
    "format": "pdf"
}

response = requests.post(
    "http://localhost:8000/api/researcher/generate-report",
    json=payload
)
report = response.json()
```

## Success Metrics

### Performance
- Page load < 2 seconds
- Report generation < 10 seconds
- API calls cached properly (90%+ hit rate)
- No unnecessary API calls

### Accuracy
- Fundamentals match OpenBB/Yahoo
- Sentiment analysis matches reality
- Analyst ratings current within 24 hours
- SEC filings parsed correctly

### User Satisfaction
- Users can research any symbol
- Reports are actionable
- Strategy analysis helps them trade better
- Macro context improves decisions

## What's Pre-Built vs. Custom

### Pre-Built (Don't Code)
- ✅ Financial data (OpenBB, Finnhub, FMP)
- ✅ Economic data (FRED)
- ✅ SEC filings (EDGAR)
- ✅ News aggregation (NewsAPI, Finnhub)
- ✅ Sentiment analysis (FinBERT)
- ✅ AI summaries (Claude)
- ✅ Technical indicators (pandas-ta)

### Custom Implementation
- 🔧 ResearcherEngine orchestration layer
- 🔧 Frontend components & pages
- 🔧 Report builder & export
- 🔧 Caching & performance
- 🔧 Integration with existing features

## Next Steps

1. **Setup API Keys**: Configure environment variables for all data sources
2. **Install Dependencies**: Install required Python packages
3. **Run Tests**: Execute test suite to verify implementation
4. **Frontend Integration**: Add researcher pages to React frontend
5. **User Testing**: Test with real users and gather feedback
6. **Performance Tuning**: Optimize caching and async operations
7. **Documentation**: Create user guides and API documentation

## Troubleshooting

### Common Issues

1. **API Rate Limits**: Use caching and fallback strategies
2. **Missing Data**: Check API key configuration
3. **Slow Performance**: Enable Redis caching
4. **Sentiment Analysis**: Verify FinBERT model loading
5. **Report Generation**: Check Claude API integration

### Debug Commands

```bash
# Test health check
curl http://localhost:8000/api/researcher/health

# Test company research
curl http://localhost:8000/api/researcher/company/AAPL

# Check API keys
python -c "from core.config import get_settings; print(get_settings().dict())"
```

This implementation provides a professional research platform that leverages best-in-class tools without reinventing any wheels, delivering comprehensive market intelligence to users.