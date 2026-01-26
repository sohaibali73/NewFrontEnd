"""
Researcher API Routes

Provides endpoints for the Market Researcher & Intelligence Platform.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/researcher",
    tags=["researcher"],
    dependencies=[],
    responses={404: {"description": "Not found"}},
)


@router.get("/company/{symbol}")
async def get_company_research(
    symbol: str,
    current_user: dict = None
):
    """
    Get comprehensive company research for a symbol
    
    Returns:
        - Fundamentals (P/E, dividend, growth rates)
        - Financial statements (income, balance sheet, cash flow)
        - Recent news with sentiment analysis
        - Insider trading activity
        - Analyst ratings and estimates
        - SEC filings summary
        - AI-generated summary
    """
    try:
        logger.info(f"Company research requested for {symbol} by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Return mock data for now since external dependencies are not configured
        research_data = {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "fundamentals": {
                "pe_ratio": 25.5,
                "dividend_yield": 1.2,
                "market_cap": "2.5T",
                "beta": 1.15,
                "eps": 5.80,
                "revenue_growth": 12.5,
                "earnings_growth": 15.2
            },
            "financials": {
                "income_statement": {
                    "revenue": "394.3B",
                    "net_income": "99.8B",
                    "operating_margin": 30.2
                },
                "balance_sheet": {
                    "total_assets": "352.8B",
                    "total_liabilities": "287.0B",
                    "equity": "65.8B"
                },
                "cash_flow": {
                    "operating_cash_flow": "122.2B",
                    "free_cash_flow": "92.4B",
                    "capex": "29.8B"
                }
            },
            "news": [
                {
                    "source": "Mock News",
                    "title": f"{symbol} Reports Strong Quarterly Earnings",
                    "description": "Company beats earnings expectations with strong revenue growth",
                    "url": f"https://example.com/news/{symbol}",
                    "published_at": datetime.now().isoformat(),
                    "sentiment": {
                        "label": "POSITIVE",
                        "score": 0.85
                    }
                }
            ],
            "insider": {
                "recent_trades": [],
                "net_insider_activity": "neutral"
            },
            "analyst": {
                "ratings": {
                    "buy": 25,
                    "hold": 15,
                    "sell": 2,
                    "average_rating": "Buy"
                },
                "price_targets": {
                    "average": 220.50,
                    "high": 250.00,
                    "low": 180.00
                }
            },
            "sentiment": {
                "overall_sentiment": "positive",
                "confidence": 0.75,
                "sources_analyzed": 1,
                "sentiment_breakdown": {
                    "positive": 1,
                    "negative": 0,
                    "neutral": 0
                }
            },
            "sec_filings": [
                {
                    "type": "10-K",
                    "date": "2024-01-31",
                    "description": "Annual Report"
                }
            ],
            "ai_summary": f"Mock AI analysis for {symbol}: The company shows strong fundamentals with solid revenue growth and healthy profit margins. Recent news sentiment is positive, indicating favorable market perception."
        }
        
        return JSONResponse(
            content={
                "success": True,
                "data": research_data,
                "message": f"Research data for {symbol} retrieved successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting company research for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve research data for {symbol}: {str(e)}"
        )


@router.get("/news/{symbol}")
async def get_company_news(
    symbol: str,
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = None
):
    """
    Get aggregated news for a company with sentiment analysis
    
    Query Parameters:
        - limit: Number of news items to return (1-100)
    """
    try:
        logger.info(f"News requested for {symbol} by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Return mock news data
        news = [
            {
                "source": "Mock News",
                "title": f"{symbol} Reports Strong Quarterly Earnings",
                "description": "Company beats earnings expectations with strong revenue growth",
                "url": f"https://example.com/news/{symbol}",
                "published_at": datetime.now().isoformat(),
                "sentiment": {
                    "label": "POSITIVE",
                    "score": 0.85
                }
            },
            {
                "source": "Mock News",
                "title": f"{symbol} Announces New Product Line",
                "description": "Company expands product offerings to capture new market segments",
                "url": f"https://example.com/news/{symbol}-product",
                "published_at": datetime.now().isoformat(),
                "sentiment": {
                    "label": "NEUTRAL",
                    "score": 0.15
                }
            }
        ][:limit]
        
        # Calculate overall sentiment
        sentiment_scores = [item.get('sentiment', {}).get('score', 0) for item in news]
        overall_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
        
        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "symbol": symbol,
                    "news": news,
                    "sentiment_score": overall_sentiment,
                    "news_count": len(news)
                },
                "message": f"News for {symbol} retrieved successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting news for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve news for {symbol}: {str(e)}"
        )


@router.post("/strategy-analysis")
async def analyze_strategy_fit(
    request: Dict[str, Any],
    current_user: dict = None
):
    """
    Analyze how well a strategy fits current market conditions
    
    Request Body:
        - symbol: Stock symbol
        - strategy_type: Type of strategy (e.g., 'momentum', 'mean_reversion', 'trend_following')
        - timeframe: Timeframe for analysis (e.g., 'daily', 'weekly', 'monthly')
    """
    try:
        symbol = request.get('symbol')
        strategy_type = request.get('strategy_type')
        timeframe = request.get('timeframe', 'daily')
        
        if not symbol or not strategy_type:
            raise HTTPException(
                status_code=400,
                detail="Symbol and strategy_type are required"
            )
        
        logger.info(f"Strategy analysis requested for {symbol} ({strategy_type}) by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Return mock analysis data
        analysis = {
            "symbol": symbol,
            "strategy_type": strategy_type,
            "timeframe": timeframe,
            "market_regime": "bull_market",
            "volatility": {
                "historical_volatility": 25.5,
                "volatility_rank": 0.6,
                "volatility_trend": "stable"
            },
            "technical_indicators": {
                "trend": "uptrend",
                "momentum": "strong",
                "support_level": 180.00,
                "resistance_level": 220.00
            },
            "market_context": {
                "regime": "bull_market",
                "sp500_level": 5200.0,
                "vix_level": 15.5,
                "market_sentiment": 0.75
            },
            "strategy_fit_score": 0.8,
            "recommendations": [
                f"Strategy {strategy_type} shows good fit for current market conditions",
                "Consider adjusting position size based on volatility levels",
                "Monitor key support and resistance levels"
            ]
        }
        
        return JSONResponse(
            content={
                "success": True,
                "data": analysis,
                "message": f"Strategy analysis for {symbol} completed"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing strategy for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze strategy for {symbol}: {str(e)}"
        )


@router.post("/comparison")
async def get_peer_comparison(
    request: Dict[str, Any],
    current_user: dict = None
):
    """
    Compare a company against its peers
    
    Request Body:
        - symbol: Base company symbol
        - peers: List of peer company symbols
    """
    try:
        symbol = request.get('symbol')
        peers = request.get('peers', [])
        
        if not symbol:
            raise HTTPException(
                status_code=400,
                detail="Symbol is required"
            )
        
        if not peers:
            raise HTTPException(
                status_code=400,
                detail="At least one peer symbol is required"
            )
        
        logger.info(f"Peer comparison requested for {symbol} vs {peers} by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Return mock comparison data
        comparison = {
            "symbol": symbol,
            "peers": peers,
            "companies": {
                symbol: {
                    "fundamentals": {
                        "pe_ratio": 25.5,
                        "market_cap": "2.5T",
                        "revenue_growth": 12.5
                    }
                }
            },
            "comparison_metrics": {
                "valuation": {
                    "symbol": symbol,
                    "pe_ratio": 25.5,
                    "peers_average": 22.3,
                    "relative_valuation": "premium"
                },
                "growth": {
                    "symbol": symbol,
                    "revenue_growth": 12.5,
                    "peers_average": 8.7,
                    "growth_rank": 1
                }
            },
            "analysis": {
                "summary": f"{symbol} trades at a premium to peers but shows superior growth metrics",
                "strengths": ["Higher growth rate", "Stronger fundamentals"],
                "weaknesses": ["Higher valuation", "Potential overvaluation risk"],
                "recommendation": "Consider for growth-focused portfolios"
            }
        }
        
        return JSONResponse(
            content={
                "success": True,
                "data": comparison,
                "message": f"Peer comparison for {symbol} completed"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting peer comparison for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get peer comparison for {symbol}: {str(e)}"
        )


@router.get("/macro-context")
async def get_macro_context(
    current_user: dict = None
):
    """
    Get current macroeconomic context and market outlook
    """
    try:
        logger.info(f"Macro context requested by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Return mock macro data
        macro_data = {
            "timestamp": datetime.now().isoformat(),
            "economic_indicators": {
                "latest_values": {
                    "gdp_growth": 2.1,
                    "unemployment": 3.8,
                    "inflation": 3.2,
                    "fed_funds_rate": 5.25
                },
                "trends": {
                    "gdp_growth": "up",
                    "unemployment": "flat",
                    "inflation": "down",
                    "fed_funds_rate": "flat"
                }
            },
            "market_sentiment": {
                "fear_greed_index": 65,
                "put_call_ratio": 0.85,
                "overall_sentiment": "neutral"
            },
            "fed_policy": {
                "current_rate": 5.25,
                "inflation_trend": 3.2,
                "policy_stance": "neutral"
            },
            "outlook": {
                "short_term": "Cautious optimism with potential for volatility",
                "medium_term": "Stable growth expected with Fed policy monitoring",
                "long_term": "Positive outlook driven by innovation and productivity gains"
            }
        }
        
        return JSONResponse(
            content={
                "success": True,
                "data": macro_data,
                "message": "Macro context retrieved successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting macro context: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve macro context: {str(e)}"
        )


@router.get("/sec-filings/{symbol}")
async def get_sec_filings(
    symbol: str,
    current_user: dict = None
):
    """
    Get recent SEC filings for a company
    """
    try:
        logger.info(f"SEC filings requested for {symbol} by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Return mock SEC filings data
        filings = [
            {
                "type": "10-K",
                "date": "2024-01-31",
                "description": "Annual Report",
                "url": f"https://sec.gov/edgar/{symbol}/10k"
            },
            {
                "type": "10-Q",
                "date": "2023-10-31",
                "description": "Quarterly Report",
                "url": f"https://sec.gov/edgar/{symbol}/10q"
            }
        ]
        
        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "symbol": symbol,
                    "filings": filings,
                    "filing_count": len(filings)
                },
                "message": f"SEC filings for {symbol} retrieved successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting SEC filings for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve SEC filings for {symbol}: {str(e)}"
        )


@router.post("/generate-report")
async def generate_research_report(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: dict = None
):
    """
    Generate a custom research report
    
    Request Body:
        - symbol: Stock symbol
        - report_type: Type of report (e.g., 'company', 'strategy', 'comparison')
        - sections: List of sections to include
        - format: Export format (pdf, csv, markdown)
    """
    try:
        symbol = request.get('symbol')
        report_type = request.get('report_type', 'company')
        sections = request.get('sections', ['executive_summary', 'fundamental_analysis'])
        export_format = request.get('format', 'json')
        
        if not symbol:
            raise HTTPException(
                status_code=400,
                detail="Symbol is required"
            )
        
        logger.info(f"Report generation requested for {symbol} by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Generate mock report
        report = {
            "symbol": symbol,
            "report_type": report_type,
            "sections": {},
            "generated_at": datetime.now().isoformat(),
            "sections_included": sections,
            "export_options": ['json', 'pdf', 'csv', 'markdown'],
            "export_format": export_format
        }
        
        for section in sections:
            if section == 'executive_summary':
                report['sections']['executive_summary'] = f"Executive summary for {symbol}: Strong company with solid fundamentals and growth prospects."
            elif section == 'fundamental_analysis':
                report['sections']['fundamental_analysis'] = f"Fundamental analysis for {symbol}: P/E ratio of 25.5, strong revenue growth of 12.5%, healthy balance sheet."
            elif section == 'technical_analysis':
                report['sections']['technical_analysis'] = f"Technical analysis for {symbol}: Currently in uptrend with support at $180 and resistance at $220."
            elif section == 'risk_assessment':
                report['sections']['risk_assessment'] = f"Risk assessment for {symbol}: Market risk, regulatory risk, and competitive pressures identified."
            elif section == 'investment_recommendation':
                report['sections']['investment_recommendation'] = f"Investment recommendation for {symbol}: Buy with target price of $220, suitable for long-term investors."
        
        # Schedule background export if requested
        if export_format != 'json':
            background_tasks.add_task(
                _export_report_background,
                report,
                export_format,
                current_user
            )
        
        return JSONResponse(
            content={
                "success": True,
                "data": report,
                "message": f"Research report for {symbol} generated successfully"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report for {symbol}: {str(e)}"
        )


@router.get("/reports/{report_id}/export")
async def export_report(
    report_id: str,
    format: str = Query(default="pdf", pattern="^(pdf|csv|markdown)$"),
    current_user: dict = None
):
    """
    Export a previously generated report
    
    Query Parameters:
        - format: Export format (pdf, csv, markdown)
    """
    try:
        logger.info(f"Report export requested for {report_id} in {format} format by user {current_user.get('id') if current_user else 'anonymous'}")
        
        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "report_id": report_id,
                    "format": format,
                    "download_url": f"/api/researcher/reports/{report_id}/download?format={format}",
                    "expires_at": (datetime.now()).isoformat()
                },
                "message": f"Report {report_id} export prepared"
            }
        )
        
    except Exception as e:
        logger.error(f"Error exporting report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export report {report_id}: {str(e)}"
        )


@router.get("/search")
async def search_research(
    query: str = Query(..., min_length=2),
    search_type: str = Query(default="company", pattern="^(company|strategy|macro)$"),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = None
):
    """
    Search for research across different categories
    
    Query Parameters:
        - query: Search query
        - search_type: Type of search (company, strategy, macro)
        - limit: Number of results to return
    """
    try:
        logger.info(f"Search requested for '{query}' ({search_type}) by user {current_user.get('id') if current_user else 'anonymous'}")
        
        # Return mock search results
        search_results = {
            "query": query,
            "search_type": search_type,
            "results": [
                {
                    "title": f"Research on {query}",
                    "type": search_type,
                    "symbol": query if search_type == "company" else None,
                    "summary": f"Mock research results for {query}",
                    "url": f"/api/researcher/company/{query}" if search_type == "company" else "/api/researcher/macro-context",
                    "last_updated": datetime.now().isoformat()
                }
            ],
            "total_results": 1,
            "search_time": datetime.now().isoformat()
        }
        
        return JSONResponse(
            content={
                "success": True,
                "data": search_results,
                "message": f"Search completed for '{query}'"
            }
        )
        
    except Exception as e:
        logger.error(f"Error searching for '{query}': {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search for '{query}': {str(e)}"
        )


@router.get("/trending")
async def get_trending_research(
    limit: int = Query(default=10, ge=1, le=20),
    current_user: dict = None
):
    """
    Get trending research topics and companies
    
    Query Parameters:
        - limit: Number of trending items to return
    """
    try:
        logger.info(f"Trending research requested by user {current_user.get('id') if current_user else 'anonymous'}")
        
        trending_data = {
            "trending_companies": [
                {"symbol": "AAPL", "reason": "Strong earnings report"},
                {"symbol": "NVDA", "reason": "AI boom driving growth"},
                {"symbol": "TSLA", "reason": "New product announcements"}
            ],
            "trending_strategies": [
                {"strategy": "AI-driven momentum", "popularity": 85},
                {"strategy": "ESG-focused investing", "popularity": 72},
                {"strategy": "Volatility harvesting", "popularity": 64}
            ],
            "trending_topics": [
                {"topic": "Artificial Intelligence", "trend": "up"},
                {"topic": "Renewable Energy", "trend": "up"},
                {"topic": "Cybersecurity", "trend": "stable"}
            ],
            "last_updated": datetime.now().isoformat()
        }
        
        return JSONResponse(
            content={
                "success": True,
                "data": trending_data,
                "message": "Trending research data retrieved"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting trending research: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trending research: {str(e)}"
        )


# Background task for report export
async def _export_report_background(report: Dict[str, Any], format: str, user: dict):
    """Background task to export reports"""
    try:
        logger.info(f"Background export started for report {report.get('symbol')} in {format} format")
        
        # Mock export logic
        logger.info(f"Background export completed for report {report.get('symbol')} in {format} format")
        
    except Exception as e:
        logger.error(f"Background export failed for report {report.get('symbol')}: {str(e)}")


# Health check endpoint
@router.get("/health")
async def researcher_health_check():
    """Health check for researcher service"""
    try:
        return JSONResponse(
            content={
                "status": "healthy",
                "service": "researcher",
                "last_test": datetime.now().isoformat(),
                "test_symbol": "AAPL",
                "test_data_available": True,
                "data_sources": {
                    "openbb": False,  # Not configured
                    "finnhub": False,  # Not configured
                    "fred": False,     # Not configured
                    "newsapi": False,  # Not configured
                    "transformers": False  # Not configured
                },
                "note": "Service running with mock data due to unconfigured external dependencies"
            }
        )
        
    except Exception as e:
        logger.error(f"Researcher health check failed: {str(e)}")
        return JSONResponse(
            content={
                "status": "unhealthy",
                "service": "researcher",
                "error": str(e),
                "last_test": datetime.now().isoformat()
            },
            status_code=503
        )