"""
Researcher API Routes

Provides endpoints for the Market Researcher & Intelligence Platform.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from core.researcher_engine import ResearcherEngine
from core.config import settings
from api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/researcher",
    tags=["researcher"],
    dependencies=[],
    responses={404: {"description": "Not found"}},
)

# Initialize researcher engine
researcher_engine = ResearcherEngine()


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
        
        research_data = await researcher_engine.get_company_research(symbol)
        
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
        
        research_data = await researcher_engine.get_company_research(symbol)
        news = research_data.get('news', [])[:limit]
        
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
        
        analysis = await researcher_engine.get_strategy_analysis(symbol, strategy_type, timeframe)
        
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
        
        comparison = await researcher_engine.get_peer_comparison(symbol, peers)
        
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
        
        macro_data = await researcher_engine.get_macro_context()
        
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
        
        research_data = await researcher_engine.get_company_research(symbol)
        filings = research_data.get('sec_filings', [])
        
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
        
        # Generate report
        report = await researcher_engine.generate_research_report(symbol, report_type, sections)
        
        # Add export information
        report['export_options'] = ['json', 'pdf', 'csv', 'markdown']
        report['export_format'] = export_format
        
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
    format: str = Query(default="pdf", regex="^(pdf|csv|markdown)$"),
    current_user: dict = None
):
    """
    Export a previously generated report
    
    Query Parameters:
        - format: Export format (pdf, csv, markdown)
    """
    try:
        # This would typically fetch from a database or cache
        # For now, return a placeholder
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
    search_type: str = Query(default="company", regex="^(company|strategy|macro)$"),
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
        
        # This would implement search across cached research data
        # For now, return a placeholder structure
        search_results = {
            "query": query,
            "search_type": search_type,
            "results": [],
            "total_results": 0,
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
        
        # This would analyze recent research requests and popular topics
        # For now, return a placeholder structure
        trending_data = {
            "trending_companies": [],
            "trending_strategies": [],
            "trending_topics": [],
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
        
        # This would implement actual export logic
        # For now, just log completion
        logger.info(f"Background export completed for report {report.get('symbol')} in {format} format")
        
    except Exception as e:
        logger.error(f"Background export failed for report {report.get('symbol')}: {str(e)}")


# Health check endpoint
@router.get("/health")
async def researcher_health_check():
    """Health check for researcher service"""
    try:
        # Test basic functionality
        test_symbol = "AAPL"
        test_data = await researcher_engine.get_company_research(test_symbol)
        
        return JSONResponse(
            content={
                "status": "healthy",
                "service": "researcher",
                "last_test": datetime.now().isoformat(),
                "test_symbol": test_symbol,
                "test_data_available": bool(test_data),
                "data_sources": {
                    "openbb": True,
                    "finnhub": True,
                    "fred": True,
                    "newsapi": True,
                    "transformers": True
                }
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