"""
Claude Tools - Custom tools for the AI agent
Implements: Code Execution, Knowledge Base Search, Stock Data

OPTIMIZED VERSION - Faster KB search, cached stock data, async-ready
"""

import json
import traceback
import logging
import os
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from functools import lru_cache


# Configure logger level based on environment
log_level = os.getenv("LOG_LEVEL", "WARNING" if os.getenv("ENVIRONMENT") == "production" else "INFO")
logger = logging.getLogger(__name__)
logger.setLevel(getattr(logging, log_level.upper()))


# ============================================================================
# CACHING FOR PERFORMANCE
# ============================================================================

# Stock data cache (5 minute TTL)
_stock_cache: Dict[str, Dict] = {}
_stock_cache_time: Dict[str, float] = {}
_STOCK_CACHE_TTL = 300  # 5 minutes

# Knowledge base cache (10 minute TTL)
_kb_cache: Dict[str, Dict] = {}
_kb_cache_time: Dict[str, float] = {}
_KB_CACHE_TTL = 600  # 10 minutes


def _get_cached_stock(symbol: str, info_type: str) -> Optional[Dict]:
    """Get cached stock data if not expired."""
    cache_key = f"{symbol}_{info_type}"
    if cache_key in _stock_cache:
        age = time.time() - _stock_cache_time.get(cache_key, 0)
        if age < _STOCK_CACHE_TTL:
            logger.debug(f"Stock cache hit for {cache_key} ({age:.0f}s old)")
            return _stock_cache[cache_key]
    return None


def _set_cached_stock(symbol: str, info_type: str, data: Dict):
    """Cache stock data."""
    cache_key = f"{symbol}_{info_type}"
    _stock_cache[cache_key] = data
    _stock_cache_time[cache_key] = time.time()


def _get_cached_kb(query: str, category: str) -> Optional[Dict]:
    """Get cached KB results if not expired."""
    cache_key = f"{query}_{category}"
    if cache_key in _kb_cache:
        age = time.time() - _kb_cache_time.get(cache_key, 0)
        if age < _KB_CACHE_TTL:
            logger.debug(f"KB cache hit for query ({age:.0f}s old)")
            return _kb_cache[cache_key]
    return None


def _set_cached_kb(query: str, category: str, data: Dict):
    """Cache KB search results."""
    cache_key = f"{query}_{category}"
    _kb_cache[cache_key] = data
    _kb_cache_time[cache_key] = time.time()


# ============================================================================
# TOOL DEFINITIONS (for Claude API)
# ============================================================================

TOOL_DEFINITIONS = [
    # Built-in Claude Web Search
    {
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 5
    },
    # Custom: Code Execution
    {
        "name": "execute_python",
        "description": "Execute Python code for calculations, data analysis, or generating AFL formulas. The code runs in a sandboxed environment with access to common libraries like math, statistics, numpy, pandas. Use this for complex calculations, backtesting logic, or data processing.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Python code to execute. Must be safe and computational (no file I/O, network, or system calls)."
                },
                "description": {
                    "type": "string",
                    "description": "Brief description of what the code does"
                }
            },
            "required": ["code"]
        }
    },
    # Custom: Knowledge Base Search - OPTIMIZED
    {
        "name": "search_knowledge_base",
        "description": "Search the user's uploaded documents and knowledge base for relevant information about AFL, trading strategies, indicators, or any uploaded content. Use this when you need to reference the user's specific documents or previously uploaded trading knowledge. FAST - results are cached.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query to find relevant documents"
                },
                "category": {
                    "type": "string",
                    "description": "Optional category filter (e.g., 'afl', 'strategy', 'indicator')",
                    "enum": ["afl", "strategy", "indicator", "general", "documentation"]
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return",
                    "default": 3
                }
            },
            "required": ["query"]
        }
    },
    # Custom: Stock Data - OPTIMIZED with caching
    {
        "name": "get_stock_data",
        "description": "Fetch real-time or historical stock market data for a given ticker symbol. Results are cached for 5 minutes for faster responses. Use this when discussing specific stocks, analyzing price movements, or when the user asks about current market conditions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., 'AAPL', 'GOOGL', 'MSFT')"
                },
                "period": {
                    "type": "string",
                    "description": "Time period for historical data",
                    "enum": ["1d", "5d", "1mo", "3mo", "6mo", "1y"],
                    "default": "1mo"
                },
                "info_type": {
                    "type": "string",
                    "description": "Type of information to retrieve",
                    "enum": ["price", "history", "info"],
                    "default": "price"
                }
            },
            "required": ["symbol"]
        }
    },
    # Custom: AFL Validator
    {
        "name": "validate_afl",
        "description": "Validate AFL (AmiBroker Formula Language) code for syntax errors and common issues. Use this before presenting AFL code to the user to ensure it's syntactically correct.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "AFL code to validate"
                }
            },
            "required": ["code"]
        }
    },
    # Custom: Generate AFL - FAST
    {
        "name": "generate_afl_code",
        "description": "Generate AmiBroker AFL code from a natural language description. Use this when the user wants to create a trading system, indicator, or exploration formula. This creates complete, production-ready AFL code.",
        "input_schema": {
            "type": "object",
            "properties": {
                "description": {
                    "type": "string",
                    "description": "Natural language description of the trading strategy, indicator, or system to create"
                },
                "strategy_type": {
                    "type": "string",
                    "description": "Type of AFL code to generate",
                    "enum": ["standalone", "composite", "indicator", "exploration"],
                    "default": "standalone"
                }
            },
            "required": ["description"]
        }
    },
    # Custom: Debug AFL
    {
        "name": "debug_afl_code",
        "description": "Debug and fix errors in AFL code. Analyzes the code, identifies issues, and returns corrected code.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The AFL code that needs debugging"
                },
                "error_message": {
                    "type": "string",
                    "description": "Optional error message from AmiBroker",
                    "default": ""
                }
            },
            "required": ["code"]
        }
    },
    # Custom: Explain AFL
    {
        "name": "explain_afl_code",
        "description": "Explain AFL code in plain English. Provides a detailed breakdown of what each section does.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The AFL code to explain"
                }
            },
            "required": ["code"]
        }
    },
    # Custom: Sanity Check AFL (auto-fix)
    {
        "name": "sanity_check_afl",
        "description": "Performs comprehensive sanity check on AFL code and automatically fixes common issues. USE THIS BEFORE PRESENTING ANY AFL CODE TO THE USER.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The AFL code to sanity check and fix"
                },
                "auto_fix": {
                    "type": "boolean",
                    "description": "Whether to automatically fix detected issues",
                    "default": True
                }
            },
            "required": ["code"]
        }
    },
    # Custom: Stock Chart Data (full OHLCV for candlestick rendering)
    {
        "name": "get_stock_chart",
        "description": "Fetch full OHLCV (Open/High/Low/Close/Volume) candlestick data for rendering interactive stock charts. Returns more data points than get_stock_data and includes moving averages. Use when the user wants to SEE a chart or visualize price history.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., 'AAPL', 'GOOGL', 'MSFT')"
                },
                "period": {
                    "type": "string",
                    "description": "Time period for chart data",
                    "enum": ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"],
                    "default": "3mo"
                },
                "interval": {
                    "type": "string",
                    "description": "Data interval/granularity",
                    "enum": ["1m", "5m", "15m", "30m", "1h", "1d", "1wk"],
                    "default": "1d"
                },
                "chart_type": {
                    "type": "string",
                    "description": "Type of chart to render",
                    "enum": ["candlestick", "line", "area"],
                    "default": "candlestick"
                }
            },
            "required": ["symbol"]
        }
    },
    # Custom: Technical Analysis
    {
        "name": "technical_analysis",
        "description": "Perform comprehensive technical analysis on a stock. Returns RSI, MACD, Bollinger Bands, ADX, moving averages, support/resistance levels, and an overall signal. Use when the user asks about technical indicators, signals, or analysis for a stock.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"
                },
                "period": {
                    "type": "string",
                    "description": "Lookback period for analysis",
                    "enum": ["1mo", "3mo", "6mo", "1y"],
                    "default": "3mo"
                }
            },
            "required": ["symbol"]
        }
    },
    # Custom: Weather Data
    {
        "name": "get_weather",
        "description": "Get current weather conditions and forecast for a location. Use when the user asks about weather, temperature, or atmospheric conditions for any city or location.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name or location (e.g., 'New York', 'London, UK', 'Tokyo')"
                },
                "units": {
                    "type": "string",
                    "description": "Temperature units",
                    "enum": ["metric", "imperial"],
                    "default": "imperial"
                }
            },
            "required": ["location"]
        }
    },
    # Custom: News Headlines
    {
        "name": "get_news",
        "description": "Fetch recent news headlines with summaries and sentiment analysis. Use when the user asks about news, market sentiment, or current events related to stocks, sectors, or general topics.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query for news (e.g., 'AAPL earnings', 'Fed rate decision', 'tech sector')"
                },
                "category": {
                    "type": "string",
                    "description": "News category filter",
                    "enum": ["market", "earnings", "economy", "technology", "politics", "general"],
                    "default": "general"
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of articles to return",
                    "default": 5
                }
            },
            "required": ["query"]
        }
    },
    # Custom: Data Chart Builder
    {
        "name": "create_chart",
        "description": "Create a data visualization chart. Returns structured data that the frontend renders as an interactive SVG chart. Supports bar, line, area, pie, donut, scatter, and horizontal bar charts. Use when the user wants to visualize data, compare values, show trends, or create any kind of chart/graph.",
        "input_schema": {
            "type": "object",
            "properties": {
                "chart_type": {
                    "type": "string",
                    "description": "Type of chart to create",
                    "enum": ["bar", "horizontal_bar", "line", "area", "pie", "donut", "scatter"]
                },
                "title": {
                    "type": "string",
                    "description": "Chart title"
                },
                "data": {
                    "type": "array",
                    "description": "Array of data points. Each item should have 'label' and 'value' keys. For scatter charts, use 'x' and 'y' instead.",
                    "items": {
                        "type": "object"
                    }
                },
                "x_label": {
                    "type": "string",
                    "description": "Label for X axis",
                    "default": ""
                },
                "y_label": {
                    "type": "string",
                    "description": "Label for Y axis",
                    "default": ""
                },
                "colors": {
                    "type": "array",
                    "description": "Optional array of hex color strings for the data series",
                    "items": {"type": "string"}
                }
            },
            "required": ["chart_type", "title", "data"]
        }
    },
    # Custom: Code Sandbox (enhanced code execution with UI)
    {
        "name": "code_sandbox",
        "description": "Create an interactive code sandbox with editable code, run capability, and output terminal. Returns the code, language, and execution result for rendering in a rich code editor UI. Use when the user wants to see, edit, and run code interactively - more visual than execute_python.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The code to put in the sandbox"
                },
                "language": {
                    "type": "string",
                    "description": "Programming language",
                    "enum": ["python", "javascript", "afl", "sql", "r"],
                    "default": "python"
                },
                "title": {
                    "type": "string",
                    "description": "Title for the sandbox",
                    "default": "Code Sandbox"
                },
                "run_immediately": {
                    "type": "boolean",
                    "description": "Whether to execute the code immediately and include output",
                    "default": True
                }
            },
            "required": ["code"]
        }
    }
]


# ============================================================================
# TOOL HANDLERS - OPTIMIZED
# ============================================================================

def execute_python(code: str, description: str = "") -> Dict[str, Any]:
    """Execute Python code in a sandboxed environment."""
    allowed_globals = {
        "__builtins__": {
            "abs": abs, "all": all, "any": any, "bool": bool,
            "dict": dict, "enumerate": enumerate, "filter": filter,
            "float": float, "format": format, "int": int, "len": len,
            "list": list, "map": map, "max": max, "min": min,
            "pow": pow, "range": range, "reversed": reversed,
            "round": round, "set": set, "slice": slice, "sorted": sorted,
            "str": str, "sum": sum, "tuple": tuple, "zip": zip,
            "print": print, "True": True, "False": False, "None": None,
        }
    }
    
    try:
        import math
        import statistics
        allowed_globals["math"] = math
        allowed_globals["statistics"] = statistics
    except ImportError:
        pass
    
    try:
        import numpy as np
        allowed_globals["np"] = np
        allowed_globals["numpy"] = np
    except ImportError:
        pass
    
    try:
        import pandas as pd
        allowed_globals["pd"] = pd
        allowed_globals["pandas"] = pd
    except ImportError:
        pass
    
    # Check for dangerous operations
    dangerous_keywords = [
        "import os", "import sys", "import subprocess", "import shutil",
        "__import__", "exec(", "eval(", "open(", "file(",
        "os.", "sys.", "subprocess.", "shutil.",
        "requests.", "urllib.", "socket.",
    ]
    
    code_lower = code.lower()
    for keyword in dangerous_keywords:
        if keyword.lower() in code_lower:
            return {
                "success": False,
                "error": f"Unsafe operation detected: {keyword}",
                "output": None
            }
    
    try:
        local_vars = {}
        exec(code, allowed_globals, local_vars)
        output = local_vars.get("result", local_vars.get("output", None))
        
        return {
            "success": True,
            "output": str(output) if output is not None else "Code executed successfully",
            "variables": {k: str(v)[:200] for k, v in local_vars.items() if not k.startswith("_")}
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()[:500]
        }


def search_knowledge_base(query: str, category: Optional[str] = None, limit: int = 3, supabase_client=None) -> Dict[str, Any]:
    """
    OPTIMIZED: Search the knowledge base for relevant documents.
    Uses caching and optimized queries.
    """
    # Check cache first
    cached = _get_cached_kb(query, category or "all")
    if cached:
        return cached
    
    if supabase_client is None:
        return {
            "success": False,
            "error": "Database connection not available",
            "results": []
        }
    
    try:
        start_time = time.time()
        
        # Build optimized query - select only needed fields
        db_query = supabase_client.table("brain_documents").select(
            "id, title, category, summary, tags, raw_content"
        )
        
        if category:
            db_query = db_query.eq("category", category)
        
        # Search in title, summary, and content using OR
        # Split query into words for better matching
        search_terms = query.split()[:3]  # Use first 3 words max
        or_conditions = []
        for term in search_terms:
            or_conditions.extend([
                f"title.ilike.%{term}%",
                f"summary.ilike.%{term}%",
                f"raw_content.ilike.%{term}%"
            ])
        
        if or_conditions:
            db_query = db_query.or_(",".join(or_conditions))
        
        result = db_query.limit(limit).execute()
        
        # Format results efficiently
        documents = []
        for doc in result.data:
            raw_content = doc.get("raw_content", "")
            # Extract relevant snippet around query terms
            snippet = _extract_relevant_snippet(raw_content, query, max_len=300)
            
            documents.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "summary": doc.get("summary", "")[:200],
                "tags": doc.get("tags", []),
                "content_snippet": snippet,
            })
        
        search_time = time.time() - start_time
        
        response = {
            "success": True,
            "query": query,
            "category_filter": category,
            "results_count": len(documents),
            "search_time_ms": round(search_time * 1000, 2),
            "results": documents
        }
        
        # Cache the result
        _set_cached_kb(query, category or "all", response)
        
        logger.debug(f"KB search completed in {search_time:.3f}s, {len(documents)} results")
        return response
        
    except Exception as e:
        logger.error(f"KB search error: {e}")
        return {
            "success": False,
            "error": str(e),
            "results": []
        }


def _extract_relevant_snippet(content: str, query: str, max_len: int = 300) -> str:
    """Extract a relevant snippet from content around query terms."""
    if not content:
        return ""
    
    content_lower = content.lower()
    query_terms = query.lower().split()
    
    # Find the first occurrence of any query term
    best_pos = -1
    for term in query_terms:
        pos = content_lower.find(term)
        if pos != -1 and (best_pos == -1 or pos < best_pos):
            best_pos = pos
    
    if best_pos == -1:
        # No match found, return start of content
        return content[:max_len] + "..." if len(content) > max_len else content
    
    # Extract snippet around the match
    start = max(0, best_pos - 50)
    end = min(len(content), best_pos + max_len - 50)
    
    snippet = content[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(content):
        snippet = snippet + "..."
    
    return snippet


def get_stock_data(symbol: str, period: str = "1mo", info_type: str = "price") -> Dict[str, Any]:
    """
    OPTIMIZED: Fetch stock market data with caching.
    Results are cached for 5 minutes.
    """
    symbol = symbol.upper()
    
    # Check cache first
    cached = _get_cached_stock(symbol, info_type)
    if cached:
        cached["cached"] = True
        return cached
    
    try:
        import yfinance as yf
        
        start_time = time.time()
        ticker = yf.Ticker(symbol)
        
        if info_type == "price":
            info = ticker.info
            response = {
                "success": True,
                "symbol": symbol,
                "data_type": "price",
                "cached": False,
                "data": {
                    "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                    "previous_close": info.get("previousClose"),
                    "open": info.get("open") or info.get("regularMarketOpen"),
                    "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
                    "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
                    "volume": info.get("volume") or info.get("regularMarketVolume"),
                    "market_cap": info.get("marketCap"),
                    "company_name": info.get("longName") or info.get("shortName"),
                },
                "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
            }
            
        elif info_type == "history":
            hist = ticker.history(period=period)
            
            if hist.empty:
                return {
                    "success": False,
                    "error": f"No historical data found for {symbol}"
                }
            
            history_data = []
            for date, row in hist.tail(10).iterrows():  # Last 10 entries for speed
                history_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"])
                })
            
            response = {
                "success": True,
                "symbol": symbol,
                "data_type": "history",
                "period": period,
                "cached": False,
                "data": history_data,
                "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
            }
            
        elif info_type == "info":
            info = ticker.info
            response = {
                "success": True,
                "symbol": symbol,
                "data_type": "info",
                "cached": False,
                "data": {
                    "name": info.get("longName"),
                    "sector": info.get("sector"),
                    "industry": info.get("industry"),
                    "description": info.get("longBusinessSummary", "")[:300],
                    "exchange": info.get("exchange"),
                },
                "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
            }
        else:
            response = {
                "success": False,
                "error": f"Unknown info_type: {info_type}"
            }
        
        # Cache the successful response
        if response.get("success"):
            _set_cached_stock(symbol, info_type, response)
        
        return response
        
    except ImportError:
        return {
            "success": False,
            "error": "yfinance library not available"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def validate_afl(code: str) -> Dict[str, Any]:
    """Comprehensive AFL code validation."""
    from core.afl_validator import AFLValidator, get_valid_colors
    
    validator = AFLValidator()
    result = validator.validate(code)
    
    lines = code.split("\n")
    code_upper = code.upper()
    
    all_errors = result.errors + result.color_issues + result.function_issues
    all_warnings = result.warnings + result.reserved_word_issues + result.style_issues
    
    return {
        "success": result.is_valid,
        "valid": result.is_valid,
        "errors": all_errors,
        "warnings": all_warnings,
        "line_count": len(lines),
        "has_buy_sell": "BUY" in code_upper or "SELL" in code_upper,
        "has_plot": "PLOT" in code_upper,
    }


def generate_afl_code(description: str, strategy_type: str = "standalone", api_key: str = None) -> Dict[str, Any]:
    """Generate AFL code using the ClaudeAFLEngine."""
    if not api_key:
        return {
            "success": False,
            "error": "API key required for AFL generation"
        }
    
    try:
        from core.claude_engine import ClaudeAFLEngine, StrategyType
        
        engine = ClaudeAFLEngine(api_key=api_key, use_condensed_prompts=True)
        
        strat_type = StrategyType.STANDALONE
        if strategy_type.lower() == "composite":
            strat_type = StrategyType.COMPOSITE
        
        result = engine.generate_afl(
            request=description,
            strategy_type=strat_type,
            include_training=False  # Skip training for faster response
        )
        
        return {
            "success": True,
            "description": description,
            "strategy_type": strategy_type,
            "afl_code": result.get("afl_code", ""),
            "explanation": result.get("explanation", ""),
            "stats": result.get("stats", {})
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def debug_afl_code(code: str, error_message: str = "", api_key: str = None) -> Dict[str, Any]:
    """Debug and fix AFL code."""
    if not api_key:
        return {
            "success": False,
            "error": "API key required for AFL debugging"
        }
    
    try:
        from core.claude_engine import ClaudeAFLEngine
        
        engine = ClaudeAFLEngine(api_key=api_key, use_condensed_prompts=True)
        fixed_code = engine.debug_code(code, error_message)
        
        return {
            "success": True,
            "original_code": code[:200] + "..." if len(code) > 200 else code,
            "error_message": error_message,
            "fixed_code": fixed_code
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def explain_afl_code(code: str, api_key: str = None) -> Dict[str, Any]:
    """Explain AFL code."""
    if not api_key:
        return {
            "success": False,
            "error": "API key required for AFL explanation"
        }
    
    try:
        from core.claude_engine import ClaudeAFLEngine
        
        engine = ClaudeAFLEngine(api_key=api_key, use_condensed_prompts=True)
        explanation = engine.explain_code(code)
        
        return {
            "success": True,
            "code": code[:200] + "..." if len(code) > 200 else code,
            "explanation": explanation
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def sanity_check_afl(code: str, auto_fix: bool = True) -> Dict[str, Any]:
    """Comprehensive AFL sanity check with auto-fix."""
    from core.afl_validator import AFLValidator
    
    validator = AFLValidator()
    original_validation = validator.validate(code)
    
    result = {
        "success": original_validation.is_valid,
        "original_valid": original_validation.is_valid,
        "total_issues_found": (
            len(original_validation.errors) +
            len(original_validation.color_issues) +
            len(original_validation.function_issues)
        )
    }
    
    if auto_fix and not original_validation.is_valid:
        fixed_code, fixes_applied = validator.fix_code(code)
        fixed_validation = validator.validate(fixed_code)
        
        result.update({
            "auto_fixed": True,
            "fixes_applied": fixes_applied,
            "fixed_code": fixed_code,
            "fixed_valid": fixed_validation.is_valid,
            "success": fixed_validation.is_valid
        })
    else:
        result["auto_fixed"] = False
        result["fixed_code"] = code

    return result


# ============================================================================
# NEW TOOL HANDLERS - Generative UI Tools
# ============================================================================

def get_stock_chart(symbol: str, period: str = "3mo", interval: str = "1d", chart_type: str = "candlestick") -> Dict[str, Any]:
    """
    Fetch full OHLCV candlestick data for interactive chart rendering.
    Returns data formatted for the LiveStockChart frontend component.
    """
    symbol = symbol.upper()
    
    # Check cache (reuse stock cache with chart-specific key)
    cache_key = f"chart_{period}_{interval}"
    cached = _get_cached_stock(symbol, cache_key)
    if cached:
        cached["cached"] = True
        return cached
    
    try:
        import yfinance as yf
        
        start_time = time.time()
        ticker = yf.Ticker(symbol)
        
        # Get historical data
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            return {
                "success": False,
                "error": f"No chart data found for {symbol}"
            }
        
        # Build OHLCV data points
        data_points = []
        for date, row in hist.iterrows():
            data_points.append({
                "date": date.strftime("%Y-%m-%d") if interval in ["1d", "1wk"] else date.strftime("%Y-%m-%d %H:%M"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"])
            })
        
        # Calculate simple moving averages for overlay
        closes = [p["close"] for p in data_points]
        sma20 = []
        sma50 = []
        for i in range(len(closes)):
            if i >= 19:
                sma20.append(round(sum(closes[i-19:i+1]) / 20, 2))
            else:
                sma20.append(None)
            if i >= 49:
                sma50.append(round(sum(closes[i-49:i+1]) / 50, 2))
            else:
                sma50.append(None)
        
        # Add SMAs to data points
        for i, point in enumerate(data_points):
            point["sma20"] = sma20[i]
            point["sma50"] = sma50[i]
        
        # Get company info
        try:
            info = ticker.info
            company_name = info.get("longName") or info.get("shortName") or symbol
            current_price = info.get("currentPrice") or info.get("regularMarketPrice") or closes[-1]
            previous_close = info.get("previousClose") or (closes[-2] if len(closes) > 1 else closes[-1])
        except Exception:
            company_name = symbol
            current_price = closes[-1]
            previous_close = closes[-2] if len(closes) > 1 else closes[-1]
        
        change = round(current_price - previous_close, 2)
        change_percent = round((change / previous_close) * 100, 2) if previous_close else 0
        
        response = {
            "success": True,
            "tool": "get_stock_chart",
            "symbol": symbol,
            "company_name": company_name,
            "chart_type": chart_type,
            "period": period,
            "interval": interval,
            "current_price": current_price,
            "change": change,
            "change_percent": change_percent,
            "data_points": len(data_points),
            "data": data_points,
            "cached": False,
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
        
        _set_cached_stock(symbol, cache_key, response)
        return response
        
    except ImportError:
        return {"success": False, "error": "yfinance library not available"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def technical_analysis(symbol: str, period: str = "3mo") -> Dict[str, Any]:
    """
    Perform comprehensive technical analysis on a stock.
    Returns indicators formatted for the TechnicalAnalysis frontend component.
    """
    symbol = symbol.upper()
    
    # Check cache
    cache_key = f"ta_{period}"
    cached = _get_cached_stock(symbol, cache_key)
    if cached:
        cached["cached"] = True
        return cached
    
    try:
        import yfinance as yf
        import numpy as np
        
        start_time = time.time()
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if hist.empty or len(hist) < 20:
            return {"success": False, "error": f"Insufficient data for technical analysis on {symbol}"}
        
        closes = hist["Close"].values.astype(float)
        highs = hist["High"].values.astype(float)
        lows = hist["Low"].values.astype(float)
        volumes = hist["Volume"].values.astype(float)
        
        # --- RSI (14-period) ---
        deltas = np.diff(closes)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gain = np.mean(gains[-14:])
        avg_loss = np.mean(losses[-14:])
        rs = avg_gain / avg_loss if avg_loss != 0 else 100
        rsi = round(100 - (100 / (1 + rs)), 2)
        
        # --- MACD (12, 26, 9) ---
        def ema(data, window):
            alpha = 2 / (window + 1)
            result = [data[0]]
            for i in range(1, len(data)):
                result.append(alpha * data[i] + (1 - alpha) * result[-1])
            return np.array(result)
        
        ema12 = ema(closes, 12)
        ema26 = ema(closes, 26)
        macd_line = ema12 - ema26
        signal_line = ema(macd_line, 9)
        macd_histogram = macd_line - signal_line
        
        macd_val = round(float(macd_line[-1]), 4)
        signal_val = round(float(signal_line[-1]), 4)
        histogram_val = round(float(macd_histogram[-1]), 4)
        
        # --- Bollinger Bands (20, 2) ---
        sma20 = np.mean(closes[-20:])
        std20 = np.std(closes[-20:])
        bb_upper = round(float(sma20 + 2 * std20), 2)
        bb_middle = round(float(sma20), 2)
        bb_lower = round(float(sma20 - 2 * std20), 2)
        bb_width = round(float((bb_upper - bb_lower) / bb_middle * 100), 2)
        
        # --- ADX (14-period) ---
        try:
            tr_list = []
            plus_dm_list = []
            minus_dm_list = []
            for i in range(1, len(closes)):
                tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
                tr_list.append(tr)
                plus_dm = highs[i] - highs[i-1] if highs[i] - highs[i-1] > lows[i-1] - lows[i] and highs[i] - highs[i-1] > 0 else 0
                minus_dm = lows[i-1] - lows[i] if lows[i-1] - lows[i] > highs[i] - highs[i-1] and lows[i-1] - lows[i] > 0 else 0
                plus_dm_list.append(plus_dm)
                minus_dm_list.append(minus_dm)
            
            atr14 = np.mean(tr_list[-14:])
            plus_di = round(100 * np.mean(plus_dm_list[-14:]) / atr14, 2) if atr14 > 0 else 0
            minus_di = round(100 * np.mean(minus_dm_list[-14:]) / atr14, 2) if atr14 > 0 else 0
            dx = abs(plus_di - minus_di) / (plus_di + minus_di) * 100 if (plus_di + minus_di) > 0 else 0
            adx = round(dx, 2)
        except Exception:
            adx = 0
            plus_di = 0
            minus_di = 0
        
        # --- Moving Averages ---
        current_price = float(closes[-1])
        sma_periods = [10, 20, 50, 100, 200]
        moving_averages = []
        for p in sma_periods:
            if len(closes) >= p:
                sma_val = round(float(np.mean(closes[-p:])), 2)
                moving_averages.append({
                    "period": p,
                    "type": "SMA",
                    "value": sma_val,
                    "signal": "bullish" if current_price > sma_val else "bearish"
                })
        
        # --- Support / Resistance ---
        recent_lows = sorted(lows[-20:])[:3]
        recent_highs = sorted(highs[-20:], reverse=True)[:3]
        support_levels = [round(float(l), 2) for l in recent_lows]
        resistance_levels = [round(float(h), 2) for h in recent_highs]
        
        # --- Overall Signal ---
        bullish_signals = 0
        bearish_signals = 0
        
        if rsi < 30: bullish_signals += 1
        elif rsi > 70: bearish_signals += 1
        
        if macd_val > signal_val: bullish_signals += 1
        else: bearish_signals += 1
        
        if current_price > bb_middle: bullish_signals += 1
        else: bearish_signals += 1
        
        bull_ma = sum(1 for ma in moving_averages if ma["signal"] == "bullish")
        bear_ma = sum(1 for ma in moving_averages if ma["signal"] == "bearish")
        if bull_ma > bear_ma: bullish_signals += 1
        else: bearish_signals += 1
        
        if bullish_signals > bearish_signals + 1:
            overall_signal = "strong_buy"
            signal_label = "Strong Buy"
        elif bullish_signals > bearish_signals:
            overall_signal = "buy"
            signal_label = "Buy"
        elif bearish_signals > bullish_signals + 1:
            overall_signal = "strong_sell"
            signal_label = "Strong Sell"
        elif bearish_signals > bullish_signals:
            overall_signal = "sell"
            signal_label = "Sell"
        else:
            overall_signal = "neutral"
            signal_label = "Neutral"
        
        # Get company name
        try:
            info = ticker.info
            company_name = info.get("longName") or info.get("shortName") or symbol
        except Exception:
            company_name = symbol
        
        response = {
            "success": True,
            "tool": "technical_analysis",
            "symbol": symbol,
            "company_name": company_name,
            "current_price": round(current_price, 2),
            "overall_signal": overall_signal,
            "signal_label": signal_label,
            "signal_strength": max(bullish_signals, bearish_signals) / (bullish_signals + bearish_signals) * 100 if (bullish_signals + bearish_signals) > 0 else 50,
            "indicators": {
                "rsi": {"value": rsi, "signal": "oversold" if rsi < 30 else "overbought" if rsi > 70 else "neutral"},
                "macd": {"value": macd_val, "signal": signal_val, "histogram": histogram_val, "trend": "bullish" if macd_val > signal_val else "bearish"},
                "bollinger_bands": {"upper": bb_upper, "middle": bb_middle, "lower": bb_lower, "width": bb_width},
                "adx": {"value": adx, "plus_di": plus_di, "minus_di": minus_di, "trend_strength": "strong" if adx > 25 else "weak"}
            },
            "moving_averages": moving_averages,
            "support_levels": support_levels,
            "resistance_levels": resistance_levels,
            "cached": False,
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
        
        _set_cached_stock(symbol, cache_key, response)
        return response
        
    except ImportError as e:
        return {"success": False, "error": f"Required library not available: {e}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_weather(location: str, units: str = "imperial") -> Dict[str, Any]:
    """
    Get current weather and forecast for a location.
    Uses wttr.in as a free, no-API-key weather service.
    Returns data formatted for the WeatherCard frontend component.
    """
    try:
        import urllib.request
        import urllib.parse
        
        start_time = time.time()
        
        # Use wttr.in JSON API (no API key needed)
        encoded_location = urllib.parse.quote(location)
        url = f"https://wttr.in/{encoded_location}?format=j1"
        
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            weather_data = json.loads(resp.read().decode())
        
        current = weather_data.get("current_condition", [{}])[0]
        nearest_area = weather_data.get("nearest_area", [{}])[0]
        forecasts = weather_data.get("weather", [])
        
        # Parse temperature based on units
        if units == "metric":
            temp = int(current.get("temp_C", 0))
            feels_like = int(current.get("FeelsLikeC", 0))
            temp_unit = "°C"
        else:
            temp = int(current.get("temp_F", 0))
            feels_like = int(current.get("FeelsLikeF", 0))
            temp_unit = "°F"
        
        # Parse condition
        condition_desc = current.get("weatherDesc", [{}])[0].get("value", "Unknown")
        
        # Map condition to a simple type for the UI
        condition_lower = condition_desc.lower()
        if "sun" in condition_lower or "clear" in condition_lower:
            condition = "sunny"
        elif "cloud" in condition_lower or "overcast" in condition_lower:
            condition = "cloudy"
        elif "rain" in condition_lower or "drizzle" in condition_lower or "shower" in condition_lower:
            condition = "rainy"
        elif "snow" in condition_lower or "blizzard" in condition_lower or "sleet" in condition_lower:
            condition = "snowy"
        elif "thunder" in condition_lower or "storm" in condition_lower:
            condition = "stormy"
        elif "fog" in condition_lower or "mist" in condition_lower or "haze" in condition_lower:
            condition = "foggy"
        elif "partly" in condition_lower:
            condition = "partly_cloudy"
        else:
            condition = "cloudy"
        
        # Build forecast
        forecast_list = []
        for day in forecasts[:5]:
            if units == "metric":
                high = int(day.get("maxtempC", 0))
                low = int(day.get("mintempC", 0))
            else:
                high = int(day.get("maxtempF", 0))
                low = int(day.get("mintempF", 0))
            
            day_date = day.get("date", "")
            day_desc = day.get("hourly", [{}])[4].get("weatherDesc", [{}])[0].get("value", "") if day.get("hourly") else ""
            
            forecast_list.append({
                "date": day_date,
                "high": high,
                "low": low,
                "condition": day_desc
            })
        
        # Get area name
        area_name = nearest_area.get("areaName", [{}])[0].get("value", location)
        region = nearest_area.get("region", [{}])[0].get("value", "")
        country = nearest_area.get("country", [{}])[0].get("value", "")
        
        response = {
            "success": True,
            "tool": "get_weather",
            "location": f"{area_name}, {region}" if region else f"{area_name}, {country}",
            "temperature": temp,
            "feels_like": feels_like,
            "temp_unit": temp_unit,
            "condition": condition,
            "condition_text": condition_desc,
            "humidity": int(current.get("humidity", 0)),
            "wind_speed": int(current.get("windspeedMiles", 0)) if units == "imperial" else int(current.get("windspeedKmph", 0)),
            "wind_unit": "mph" if units == "imperial" else "km/h",
            "wind_direction": current.get("winddir16Point", ""),
            "visibility": int(current.get("visibilityMiles", 10)) if units == "imperial" else int(current.get("visibility", 10)),
            "visibility_unit": "mi" if units == "imperial" else "km",
            "uv_index": int(current.get("uvIndex", 0)),
            "pressure": float(current.get("pressure", 0)),
            "forecast": forecast_list,
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
        
        return response
        
    except Exception as e:
        return {"success": False, "error": f"Weather fetch failed: {str(e)}"}


def get_news(query: str, category: str = "general", max_results: int = 5) -> Dict[str, Any]:
    """
    Fetch news headlines with summaries and basic sentiment.
    Uses Tavily API if available, falls back to web search summary.
    Returns data formatted for the NewsHeadlines frontend component.
    """
    try:
        start_time = time.time()
        
        # Try Tavily API first (user has key in environment)
        tavily_key = os.getenv("TAVILY_API_KEY")
        
        if tavily_key:
            import urllib.request
            
            payload = json.dumps({
                "api_key": tavily_key,
                "query": f"{query} news {category}",
                "search_depth": "basic",
                "include_answer": True,
                "max_results": max_results
            })
            
            req = urllib.request.Request(
                "https://api.tavily.com/search",
                data=payload.encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=15) as resp:
                search_data = json.loads(resp.read().decode())
            
            articles = []
            for item in search_data.get("results", [])[:max_results]:
                title = item.get("title", "")
                content = item.get("content", "")
                url = item.get("url", "")
                
                # Basic sentiment analysis from content
                sentiment = _analyze_basic_sentiment(title + " " + content)
                
                articles.append({
                    "title": title,
                    "summary": content[:300],
                    "url": url,
                    "source": _extract_domain(url),
                    "sentiment": sentiment,
                    "category": category,
                    "published": item.get("published_date", "")
                })
            
            # Overall market sentiment
            sentiments = [a["sentiment"] for a in articles]
            positive_count = sentiments.count("positive")
            negative_count = sentiments.count("negative")
            
            if positive_count > negative_count + 1:
                overall_sentiment = "bullish"
            elif negative_count > positive_count + 1:
                overall_sentiment = "bearish"
            else:
                overall_sentiment = "mixed"
            
            response = {
                "success": True,
                "tool": "get_news",
                "query": query,
                "category": category,
                "overall_sentiment": overall_sentiment,
                "article_count": len(articles),
                "articles": articles,
                "answer": search_data.get("answer", ""),
                "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
            }
            
            return response
        else:
            # No Tavily key - return a helpful error
            return {
                "success": False,
                "error": "News search requires TAVILY_API_KEY environment variable. Please set it in your .env file.",
                "tool": "get_news"
            }
        
    except Exception as e:
        return {"success": False, "error": f"News fetch failed: {str(e)}", "tool": "get_news"}


def _analyze_basic_sentiment(text: str) -> str:
    """Basic keyword-based sentiment analysis."""
    text_lower = text.lower()
    
    positive_words = ["surge", "gain", "rally", "rise", "jump", "soar", "beat", "exceed",
                      "strong", "growth", "profit", "upgrade", "bullish", "record", "boom",
                      "optimistic", "positive", "upbeat", "recovery", "breakthrough"]
    negative_words = ["fall", "drop", "crash", "decline", "plunge", "loss", "miss", "cut",
                      "weak", "recession", "bearish", "downgrade", "warning", "concern",
                      "pessimistic", "negative", "fear", "crisis", "layoff", "bankrupt"]
    
    pos_count = sum(1 for w in positive_words if w in text_lower)
    neg_count = sum(1 for w in negative_words if w in text_lower)
    
    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    return "neutral"


def _extract_domain(url: str) -> str:
    """Extract domain name from URL for source display."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        return domain
    except Exception:
        return "Unknown"


def create_chart(chart_type: str, title: str, data: list, x_label: str = "", y_label: str = "", colors: list = None) -> Dict[str, Any]:
    """
    Create a data visualization chart.
    Returns structured data for the DataChart frontend component.
    """
    try:
        # Validate data
        if not data or not isinstance(data, list):
            return {"success": False, "error": "Data must be a non-empty array"}
        
        # Validate chart type
        valid_types = ["bar", "horizontal_bar", "line", "area", "pie", "donut", "scatter"]
        if chart_type not in valid_types:
            return {"success": False, "error": f"Invalid chart type. Must be one of: {', '.join(valid_types)}"}
        
        # Default color palette
        default_colors = [
            "#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6",
            "#EC4899", "#06B6D4", "#F97316", "#84CC16", "#6366F1"
        ]
        
        chart_colors = colors if colors and len(colors) > 0 else default_colors
        
        # Normalize data format
        normalized_data = []
        for i, item in enumerate(data):
            if isinstance(item, dict):
                normalized_data.append({
                    "label": str(item.get("label", item.get("name", f"Item {i+1}"))),
                    "value": float(item.get("value", item.get("y", 0))),
                    "x": float(item.get("x", i)) if chart_type == "scatter" else None,
                    "y": float(item.get("y", item.get("value", 0))) if chart_type == "scatter" else None,
                    "color": chart_colors[i % len(chart_colors)]
                })
            elif isinstance(item, (int, float)):
                normalized_data.append({
                    "label": f"Item {i+1}",
                    "value": float(item),
                    "color": chart_colors[i % len(chart_colors)]
                })
        
        # Calculate summary stats
        values = [d["value"] for d in normalized_data]
        total = sum(values)
        avg = total / len(values) if values else 0
        
        response = {
            "success": True,
            "tool": "create_chart",
            "chart_type": chart_type,
            "title": title,
            "x_label": x_label,
            "y_label": y_label,
            "data": normalized_data,
            "colors": chart_colors[:len(normalized_data)],
            "summary": {
                "total": round(total, 2),
                "average": round(avg, 2),
                "min": round(min(values), 2) if values else 0,
                "max": round(max(values), 2) if values else 0,
                "count": len(normalized_data)
            }
        }
        
        return response
        
    except Exception as e:
        return {"success": False, "error": f"Chart creation failed: {str(e)}"}


def code_sandbox(code: str, language: str = "python", title: str = "Code Sandbox", run_immediately: bool = True) -> Dict[str, Any]:
    """
    Create an interactive code sandbox.
    Returns code + execution result for the CodeSandbox frontend component.
    """
    try:
        output = None
        execution_error = None
        execution_time_ms = 0
        
        # Only execute Python code for safety
        if run_immediately and language == "python":
            start_time = time.time()
            exec_result = execute_python(code=code, description=title)
            execution_time_ms = round((time.time() - start_time) * 1000, 2)
            
            if exec_result.get("success"):
                output = exec_result.get("output", "Code executed successfully")
                # Include variable outputs
                variables = exec_result.get("variables", {})
                if variables:
                    var_output = "\n".join([f"{k} = {v}" for k, v in variables.items()])
                    if output == "Code executed successfully" and var_output:
                        output = var_output
                    elif var_output:
                        output = f"{output}\n\nVariables:\n{var_output}"
            else:
                execution_error = exec_result.get("error", "Unknown error")
                output = f"Error: {execution_error}"
        elif run_immediately and language != "python":
            output = f"[{language}] Code preview only - execution supported for Python"
        
        response = {
            "success": True,
            "tool": "code_sandbox",
            "title": title,
            "language": language,
            "code": code,
            "output": output,
            "error": execution_error,
            "execution_time_ms": execution_time_ms,
            "is_executed": run_immediately and language == "python",
            "files": [
                {
                    "name": f"main.{_get_file_extension(language)}",
                    "language": language,
                    "code": code
                }
            ]
        }
        
        return response
        
    except Exception as e:
        return {"success": False, "error": f"Sandbox creation failed: {str(e)}"}


def _get_file_extension(language: str) -> str:
    """Get file extension for a language."""
    extensions = {
        "python": "py",
        "javascript": "js",
        "afl": "afl",
        "sql": "sql",
        "r": "r"
    }
    return extensions.get(language, "txt")


# ============================================================================
# TOOL DISPATCHER - OPTIMIZED
# ============================================================================

def handle_tool_call(tool_name: str, tool_input: Dict[str, Any], supabase_client=None, api_key: str = None) -> str:
    """
    OPTIMIZED: Dispatch tool calls to appropriate handlers.
    Returns JSON string result.
    """
    start_time = time.time()
    
    try:
        logger.debug(f"Handling tool call: {tool_name}")

        if tool_name == "execute_python":
            result = execute_python(
                code=tool_input.get("code", ""),
                description=tool_input.get("description", "")
            )

        elif tool_name == "search_knowledge_base":
            result = search_knowledge_base(
                query=tool_input.get("query", ""),
                category=tool_input.get("category"),
                limit=tool_input.get("limit", 3),
                supabase_client=supabase_client
            )

        elif tool_name == "get_stock_data":
            result = get_stock_data(
                symbol=tool_input.get("symbol", ""),
                period=tool_input.get("period", "1mo"),
                info_type=tool_input.get("info_type", "price")
            )

        elif tool_name == "validate_afl":
            result = validate_afl(
                code=tool_input.get("code", "")
            )

        elif tool_name == "generate_afl_code":
            result = generate_afl_code(
                description=tool_input.get("description", ""),
                strategy_type=tool_input.get("strategy_type", "standalone"),
                api_key=api_key
            )

        elif tool_name == "debug_afl_code":
            result = debug_afl_code(
                code=tool_input.get("code", ""),
                error_message=tool_input.get("error_message", ""),
                api_key=api_key
            )

        elif tool_name == "explain_afl_code":
            result = explain_afl_code(
                code=tool_input.get("code", ""),
                api_key=api_key
            )

        elif tool_name == "sanity_check_afl":
            result = sanity_check_afl(
                code=tool_input.get("code", ""),
                auto_fix=tool_input.get("auto_fix", True)
            )

        elif tool_name == "get_stock_chart":
            result = get_stock_chart(
                symbol=tool_input.get("symbol", ""),
                period=tool_input.get("period", "3mo"),
                interval=tool_input.get("interval", "1d"),
                chart_type=tool_input.get("chart_type", "candlestick")
            )

        elif tool_name == "technical_analysis":
            result = technical_analysis(
                symbol=tool_input.get("symbol", ""),
                period=tool_input.get("period", "3mo")
            )

        elif tool_name == "get_weather":
            result = get_weather(
                location=tool_input.get("location", ""),
                units=tool_input.get("units", "imperial")
            )

        elif tool_name == "get_news":
            result = get_news(
                query=tool_input.get("query", ""),
                category=tool_input.get("category", "general"),
                max_results=tool_input.get("max_results", 5)
            )

        elif tool_name == "create_chart":
            result = create_chart(
                chart_type=tool_input.get("chart_type", "bar"),
                title=tool_input.get("title", "Chart"),
                data=tool_input.get("data", []),
                x_label=tool_input.get("x_label", ""),
                y_label=tool_input.get("y_label", ""),
                colors=tool_input.get("colors")
            )

        elif tool_name == "code_sandbox":
            result = code_sandbox(
                code=tool_input.get("code", ""),
                language=tool_input.get("language", "python"),
                title=tool_input.get("title", "Code Sandbox"),
                run_immediately=tool_input.get("run_immediately", True)
            )

        else:
            logger.warning(f"Unknown tool requested: {tool_name}")
            result = {"error": f"Unknown tool: {tool_name}"}

        # Add timing info
        result["_tool_time_ms"] = round((time.time() - start_time) * 1000, 2)
        
        logger.debug(f"Tool call {tool_name} completed in {result['_tool_time_ms']}ms")
        return json.dumps(result, indent=2, default=str)

    except Exception as e:
        logger.error(f"Error in tool call {tool_name}: {str(e)}", exc_info=True)
        return json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()[:500]
        })


@lru_cache(maxsize=1)
def get_custom_tools() -> List[Dict]:
    """Return only custom tool definitions. Cached."""
    return [tool for tool in TOOL_DEFINITIONS if "input_schema" in tool]


@lru_cache(maxsize=1)
def get_all_tools() -> List[Dict]:
    """Return all tool definitions. Cached."""
    return TOOL_DEFINITIONS.copy()
