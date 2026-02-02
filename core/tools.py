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
