# Researcher Frontend Integration Guide

## Overview

This guide explains how to integrate the Researcher tool into the existing Analyst by Potomac frontend application. The backend is complete and ready for frontend implementation.

## Current Frontend Architecture

### Existing Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── afl/
│   │   ├── admin/
│   │   ├── brain/
│   │   └── shared/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── AFLGenerator.tsx
│   │   ├── Admin.tsx
│   │   └── Brain.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── useAFL.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── chat.ts
│   └── types/
│       ├── auth.ts
│       ├── chat.ts
│       └── afl.ts
```

## Researcher Frontend Implementation

### 1. New Components Structure

#### Core Researcher Components
```
src/components/researcher/
├── ResearcherHome.tsx          # Main researcher dashboard
├── CompanyDeepDive.tsx         # Company analysis page
├── StrategyAnalysis.tsx        # Strategy fit analysis
├── PeerComparison.tsx          # Peer comparison tool
├── SECFilings.tsx             # SEC filings viewer
├── MacroContext.tsx           # Macro environment analysis
├── NewsAnalysis.tsx           # News aggregation and sentiment
├── ReportBuilder.tsx          # Custom report generation
└── ResearchCard.tsx           # Reusable research card component
```

#### UI Components
```
src/components/researcher/ui/
├── MetricComparison.tsx       # Side-by-side metric comparison
├── SentimentGauge.tsx         # Visual sentiment indicator
├── DataTimeline.tsx           # Historical events timeline
├── ReportPreview.tsx          # Report preview component
└── ResearchSidebar.tsx        # Navigation sidebar
```

### 2. New Pages Structure

```
src/pages/
├── Researcher.tsx             # Main researcher page (/researcher)
├── CompanyResearch.tsx        # Company deep dive (/researcher/company/:symbol)
├── StrategyResearcher.tsx     # Strategy analysis (/researcher/strategy)
├── ComparativeAnalysis.tsx    # Peer comparison (/researcher/compare)
├── MacroResearcher.tsx        # Macro analysis (/researcher/macro)
└── NewsResearcher.tsx         # News analysis (/researcher/news)
```

### 3. New Hooks and Services

#### Researcher Hooks
```
src/hooks/
├── useResearcher.ts           # Main researcher hook
├── useCompanyResearch.ts      # Company research hook
├── useStrategyAnalysis.ts     # Strategy analysis hook
└── useReportGeneration.ts     # Report generation hook
```

#### Researcher Services
```
src/services/
├── researcher.ts              # Main researcher API service
├── companyResearch.ts         # Company research service
├── marketData.ts              # Market data service
└── reportService.ts           # Report generation service
```

#### Researcher Types
```
src/types/
├── researcher.ts              # Researcher types
├── company.ts                 # Company research types
├── strategy.ts                # Strategy analysis types
└── report.ts                  # Report types
```

## Implementation Details

### 1. Main Researcher Hook (`useResearcher.ts`)

```typescript
import { useState, useCallback } from 'react';
import { researcherApi } from '../services/researcher';

export interface ResearcherState {
  currentSymbol: string | null;
  reportType: 'company' | 'strategy' | 'comparison';
  comparisonSymbols: string[];
  researchData: any;
  loading: boolean;
  error: string | null;
}

export const useResearcher = () => {
  const [state, setState] = useState<ResearcherState>({
    currentSymbol: null,
    reportType: 'company',
    comparisonSymbols: [],
    researchData: null,
    loading: false,
    error: null
  });

  const fetchCompanyResearch = useCallback(async (symbol: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await researcherApi.getCompanyResearch(symbol);
      setState(prev => ({ ...prev, researchData: data, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
    }
  }, []);

  const generateReport = useCallback(async (symbol: string, reportType: string, sections: string[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const report = await researcherApi.generateReport(symbol, reportType, sections);
      setState(prev => ({ ...prev, researchData: report, loading: false }));
      return report;
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  }, []);

  return {
    ...state,
    fetchCompanyResearch,
    generateReport,
    setCurrentSymbol: (symbol: string) => setState(prev => ({ ...prev, currentSymbol: symbol })),
    setReportType: (type: 'company' | 'strategy' | 'comparison') => setState(prev => ({ ...prev, reportType: type })),
    addComparisonSymbol: (symbol: string) => setState(prev => ({ ...prev, comparisonSymbols: [...prev.comparisonSymbols, symbol] })),
    removeComparisonSymbol: (symbol: string) => setState(prev => ({ ...prev, comparisonSymbols: prev.comparisonSymbols.filter(s => s !== symbol) }))
  };
};
```

### 2. Researcher API Service (`researcher.ts`)

```typescript
import axios from 'axios';
import { API_BASE_URL } from './api';

export interface CompanyResearch {
  symbol: string;
  company_name: string;
  sector: string;
  industry: string;
  fundamentals: {
    market_cap: number;
    pe_ratio: number;
    dividend_yield: number;
    earnings_growth: number;
    revenue_growth: number;
  };
  financial_health: {
    debt_to_equity: number;
    current_ratio: number;
    roe: number;
    roa: number;
  };
  analyst_consensus: {
    target_price: number;
    ratings: { buy: number; hold: number; sell: number };
    sentiment: string;
  };
  insider_activity: {
    recent_buys: number;
    recent_sells: number;
    net_insider_position: number;
  };
  ai_summary: string;
}

export interface NewsItem {
  headline: string;
  source: string;
  timestamp: string;
  sentiment: { score: number; confidence: number };
  summary: string;
  url: string;
}

export interface StrategyAnalysis {
  symbol: string;
  strategy: string;
  market_regime: string;
  strategy_fit: string;
  confidence: number;
  recommendation: string;
  risks: string[];
  opportunities: string[];
  adjusted_parameters: any;
}

class ResearcherApi {
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getCompanyResearch(symbol: string): Promise<CompanyResearch> {
    const response = await axios.get(`${API_BASE_URL}/api/researcher/company/${symbol}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getCompanyNews(symbol: string, limit: number = 20): Promise<{ news: NewsItem[]; sentiment_score: number }> {
    const response = await axios.get(`${API_BASE_URL}/api/researcher/news/${symbol}?limit=${limit}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async analyzeStrategyFit(symbol: string, strategyType: string, timeframe: string): Promise<StrategyAnalysis> {
    const response = await axios.post(`${API_BASE_URL}/api/researcher/strategy-analysis`, {
      symbol,
      strategy_type: strategyType,
      timeframe
    }, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getPeerComparison(symbol: string, peers: string[]): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/api/researcher/comparison`, {
      symbol,
      peers
    }, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getMacroContext(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/api/researcher/macro-context`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getSEC Filings(symbol: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/api/researcher/sec-filings/${symbol}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async generateReport(symbol: string, reportType: string, sections: string[], format: string = 'json'): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/api/researcher/generate-report`, {
      symbol,
      report_type: reportType,
      sections,
      format
    }, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async exportReport(reportId: string, format: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/api/researcher/reports/${reportId}/export?format=${format}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async searchResearch(query: string, searchType: string, limit: number = 10): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/api/researcher/search?query=${encodeURIComponent(query)}&search_type=${searchType}&limit=${limit}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getTrendingResearch(limit: number = 10): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/api/researcher/trending?limit=${limit}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }
}

export const researcherApi = new ResearcherApi();
```

### 3. Researcher Types (`researcher.ts`)

```typescript
export interface CompanyResearch {
  symbol: string;
  company_name: string;
  sector: string;
  industry: string;
  description: string;
  fundamentals: {
    market_cap: number;
    pe_ratio: number;
    dividend_yield: number;
    earnings_growth: number;
    revenue_growth: number;
  };
  financial_health: {
    debt_to_equity: number;
    current_ratio: number;
    roe: number;
    roa: number;
  };
  analyst_consensus: {
    target_price: number;
    ratings: { buy: number; hold: number; sell: number };
    sentiment: string;
  };
  insider_activity: {
    recent_buys: number;
    recent_sells: number;
    net_insider_position: number;
  };
  sec_filings: SEC Filing[];
  news: NewsItem[];
  ai_summary: string;
}

export interface NewsItem {
  headline: string;
  source: string;
  timestamp: string;
  sentiment: {
    score: number;
    confidence: number;
  };
  summary: string;
  url: string;
}

export interface SEC Filing {
  type: string;
  date: string;
  summary: string;
  key_metrics: Record<string, any>;
  url: string;
}

export interface StrategyAnalysis {
  symbol: string;
  strategy: string;
  market_regime: string;
  strategy_fit: string;
  confidence: number;
  recommendation: string;
  risks: string[];
  opportunities: string[];
  adjusted_parameters: Record<string, any>;
}

export interface PeerComparison {
  company: string;
  peers: string[];
  comparison: Record<string, Record<string, number>>;
  analysis: string;
  recommendation: string;
}

export interface MacroContext {
  fed_rate: number;
  inflation: number;
  unemployment: number;
  gdp_growth: number;
  sentiment_index: number;
  market_outlook: string;
  upcoming_events: MacroEvent[];
}

export interface MacroEvent {
  event: string;
  date: string;
  expected_impact: string;
  market_reaction_guide: string;
}

export interface ResearchReport {
  report_id: string;
  title: string;
  generated_at: string;
  sections: ReportSection[];
  export_options: string[];
  export_format: string;
}

export interface ReportSection {
  title: string;
  content: string;
}

export interface ResearcherState {
  currentSymbol: string | null;
  reportType: 'company' | 'strategy' | 'comparison';
  comparisonSymbols: string[];
  researchData: any;
  loading: boolean;
  error: string | null;
}
```

### 4. Main Researcher Page (`Researcher.tsx`)

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, TrendingUp, BarChart3, Newspaper, Building, DollarSign } from 'lucide-react';
import { useResearcher } from '../hooks/useResearcher';

export const Researcher: React.FC = () => {
  const navigate = useNavigate();
  const { fetchCompanyResearch, loading } = useResearcher();
  const [symbol, setSymbol] = useState('');

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      fetchCompanyResearch(symbol.trim().toUpperCase());
      navigate(`/researcher/company/${symbol.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Researcher & Intelligence</h1>
        <p className="text-gray-600">Comprehensive financial research and market intelligence platform</p>
      </div>

      {/* Quick Search */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSymbolSubmit} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, MSFT, GOOGL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              <Search className="mr-2 h-5 w-5" />
              Research Company
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Research Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Company Research */}
        <Card onClick={() => navigate('/researcher/company')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Building className="h-6 w-6 text-blue-600" />
              Company Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Deep dive into company fundamentals, financials, management, and competitive position
            </p>
            <Button variant="outline" className="w-full">
              Start Research
            </Button>
          </CardContent>
        </Card>

        {/* Strategy Analysis */}
        <Card onClick={() => navigate('/researcher/strategy')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Strategy Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Analyze how well trading strategies fit current market conditions and optimize parameters
            </p>
            <Button variant="outline" className="w-full">
              Analyze Strategy
            </Button>
          </CardContent>
        </Card>

        {/* Peer Comparison */}
        <Card onClick={() => navigate('/researcher/compare')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              Peer Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Compare companies against peers and industry benchmarks for relative value assessment
            </p>
            <Button variant="outline" className="w-full">
              Compare Companies
            </Button>
          </CardContent>
        </Card>

        {/* News Analysis */}
        <Card onClick={() => navigate('/researcher/news')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-orange-600" />
              News Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Aggregated news with sentiment analysis and impact assessment on stock prices
            </p>
            <Button variant="outline" className="w-full">
              View News
            </Button>
          </CardContent>
        </Card>

        {/* Macro Context */}
        <Card onClick={() => navigate('/researcher/macro')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-red-600" />
              Macro Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Economic indicators, Fed policy impact, and market sentiment analysis
            </p>
            <Button variant="outline" className="w-full">
              View Macro
            </Button>
          </CardContent>
        </Card>

        {/* SEC Filings */}
        <Card onClick={() => navigate('/researcher/sec')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Building className="h-6 w-6 text-gray-600" />
              SEC Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Regulatory filings, insider trading, and corporate governance analysis
            </p>
            <Button variant="outline" className="w-full">
              View Filings
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Research Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Your recent research history will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 5. Company Deep Dive Page (`CompanyResearch.tsx`)

```typescript
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResearcher } from '../hooks/useResearcher';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import { MetricComparison } from '../components/researcher/ui/MetricComparison';
import { SentimentGauge } from '../components/researcher/ui/SentimentGauge';
import { DataTimeline } from '../components/researcher/ui/DataTimeline';

export const CompanyResearch: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { fetchCompanyResearch, researchData, loading, error } = useResearcher();

  useEffect(() => {
    if (symbol) {
      fetchCompanyResearch(symbol);
    }
  }, [symbol, fetchCompanyResearch]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-red-600 mb-4">Error loading research data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/researcher')}>Back to Researcher</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!researchData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">No Research Data Available</h2>
            <p className="text-gray-600 mb-4">Please search for a valid stock symbol to begin research.</p>
            <Button onClick={() => navigate('/researcher')}>Back to Researcher</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { fundamentals, financial_health, analyst_consensus, insider_activity, ai_summary } = researchData;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{symbol}</h1>
            <p className="text-gray-600">{researchData.company_name} • {researchData.sector} • {researchData.industry}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/researcher')}>Back to Researcher</Button>
            <Button variant="outline">Generate Report</Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        {/* Market Cap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Market Cap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(fundamentals.market_cap / 1e9).toFixed(2)}B</div>
          </CardContent>
        </Card>

        {/* P/E Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">P/E Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fundamentals.pe_ratio.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Trailing Twelve Months</div>
          </CardContent>
        </Card>

        {/* Dividend Yield */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Dividend Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(fundamentals.dividend_yield * 100).toFixed(2)}%</div>
          </CardContent>
        </Card>

        {/* Earnings Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Earnings Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(fundamentals.earnings_growth * 100).toFixed(2)}%</div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Financial Health */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Financial Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricComparison
              metrics={[
                { label: 'Debt to Equity', value: financial_health.debt_to_equity, format: 'decimal' },
                { label: 'Current Ratio', value: financial_health.current_ratio, format: 'decimal' },
                { label: 'ROE', value: financial_health.roe, format: 'percentage' },
                { label: 'ROA', value: financial_health.roa, format: 'percentage' }
              ]}
            />
          </CardContent>
        </Card>

        {/* Analyst Consensus */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Analyst Consensus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Price</span>
                <span className="font-bold">${analyst_consensus.target_price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="success">Buy: {analyst_consensus.ratings.buy}</Badge>
                <Badge variant="secondary">Hold: {analyst_consensus.ratings.hold}</Badge>
                <Badge variant="destructive">Sell: {analyst_consensus.ratings.sell}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <SentimentGauge score={0.75} />
                <span className="text-sm text-gray-600">Overall Sentiment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insider Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insider Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recent Buys</span>
                <span className="font-bold text-green-600">+{insider_activity.recent_buys}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recent Sells</span>
                <span className="font-bold text-red-600">-{insider_activity.recent_sells}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Net Position</span>
                <span className={`font-bold ${insider_activity.net_insider_position > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insider_activity.net_insider_position > 0 ? '+' : ''}{insider_activity.net_insider_position.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* AI Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{ai_summary}</p>
        </CardContent>
      </Card>

      {/* News and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent News */}
        <Card>
          <CardHeader>
            <CardTitle>Recent News</CardTitle>
          </CardHeader>
          <CardContent>
            {/* News items would be rendered here */}
            <p className="text-gray-600">News aggregation coming soon...</p>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Key Events Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTimeline events={[]} />
          </CardContent>
        </Card>

      </div>

    </div>
  );
};
```

### 6. Integration with Existing Features

#### Navigation Integration
```typescript
// Add to existing navigation component
const navigationItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'AFL Generator', path: '/afl', icon: Code },
  { name: 'Researcher', path: '/researcher', icon: Search },
  { name: 'Brain', path: '/brain', icon: Brain },
  { name: 'Admin', path: '/admin', icon: Shield },
];
```

#### Context Integration
```typescript
// Add researcher context to existing context providers
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ChatProvider>
        <AFLProvider>
          <ResearcherProvider>
            {children}
          </ResearcherProvider>
        </AFLProvider>
      </ChatProvider>
    </AuthProvider>
  );
};
```

#### Route Integration
```typescript
// Add to existing router
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/chat", element: <Chat /> },
      { path: "/afl", element: <AFLGenerator /> },
      { path: "/researcher", element: <Researcher /> },
      { path: "/researcher/company/:symbol", element: <CompanyResearch /> },
      { path: "/researcher/strategy", element: <StrategyResearcher /> },
      { path: "/researcher/compare", element: <ComparativeAnalysis /> },
      { path: "/brain", element: <Brain /> },
      { path: "/admin", element: <Admin /> },
    ],
  },
]);
```

### 7. Styling and Theming

#### Researcher-Specific Styles
```css
/* src/styles/researcher.css */
.researcher-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.researcher-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.metric-positive {
  color: #10b981;
}

.metric-negative {
  color: #ef4444;
}

.sentiment-gauge {
  width: 120px;
  height: 120px;
}

.timeline-event {
  border-left: 2px solid #e5e7eb;
  padding-left: 1rem;
  position: relative;
}

.timeline-event::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 0.5rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
}
```

### 8. Performance Optimization

#### Lazy Loading
```typescript
// Use React.lazy for heavy components
const CompanyResearch = React.lazy(() => import('../pages/CompanyResearch'));
const StrategyResearcher = React.lazy(() => import('../pages/StrategyResearcher'));
const ComparativeAnalysis = React.lazy(() => import('../pages/ComparativeAnalysis'));

// Wrap in Suspense
<Suspense fallback={<div>Loading...</div>}>
  <CompanyResearch />
</Suspense>
```

#### Memoization
```typescript
// Use memoization for expensive calculations
const memoizedMetrics = useMemo(() => {
  return calculateMetrics(researchData);
}, [researchData]);
```

#### Virtualization
```typescript
// Use virtualization for long lists
import { FixedSizeList as List } from 'react-window';

const NewsList = ({ news }: { news: NewsItem[] }) => (
  <List
    height={400}
    itemCount={news.length}
    itemSize={80}
    itemData={news}
  >
    {NewsItemRow}
  </List>
);
```

## Development Workflow

### 1. Setup
```bash
# Install dependencies
npm install axios react-router-dom lucide-react

# Create directory structure
mkdir -p src/components/researcher/ui
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/pages
```

### 2. Implementation Order
1. **Core Infrastructure**: Types, services, hooks
2. **Main Pages**: Researcher home, company research
3. **UI Components**: Cards, gauges, comparisons
4. **Integration**: Navigation, routing, context
5. **Polish**: Styling, animations, performance

### 3. Testing
```typescript
// Example test for researcher hook
import { renderHook, waitFor } from '@testing-library/react';
import { useResearcher } from '../hooks/useResearcher';

describe('useResearcher', () => {
  it('should fetch company research', async () => {
    const { result } = renderHook(() => useResearcher());
    
    await act(async () => {
      await result.current.fetchCompanyResearch('AAPL');
    });

    expect(result.current.researchData).toBeDefined();
    expect(result.current.loading).toBe(false);
  });
});
```

### 4. Deployment Considerations
- **Environment Variables**: Ensure API keys are properly configured
- **Caching**: Implement client-side caching for better performance
- **Error Handling**: Graceful error handling for API failures
- **Accessibility**: Ensure all components are accessible

## Conclusion

The researcher frontend implementation provides a comprehensive market intelligence platform that integrates seamlessly with the existing Analyst by Potomac application. The modular architecture allows for easy maintenance and future enhancements, while the rich UI components provide an engaging user experience for financial research and analysis.