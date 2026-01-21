"""
Claude Tools - Custom tools for the AI agent
Implements: Code Execution, Knowledge Base Search, Stock Data
"""

import json
import traceback
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta


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
    # Custom: Knowledge Base Search
    {
        "name": "search_knowledge_base",
        "description": "Search the user's uploaded documents and knowledge base for relevant information about AFL, trading strategies, indicators, or any uploaded content. Use this when you need to reference the user's specific documents or previously uploaded trading knowledge.",
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
                    "default": 5
                }
            },
            "required": ["query"]
        }
    },
    # Custom: Stock Data
    {
        "name": "get_stock_data",
        "description": "Fetch real-time or historical stock market data for a given ticker symbol. Use this when discussing specific stocks, analyzing price movements, or when the user asks about current market conditions for a particular security.",
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
                    "enum": ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"],
                    "default": "1mo"
                },
                "info_type": {
                    "type": "string",
                    "description": "Type of information to retrieve",
                    "enum": ["price", "history", "info", "financials"],
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
    # Custom: Strategy Research
    {
        "name": "research_strategy",
        "description": "Conduct comprehensive research on a trading strategy. Searches the web, SEC EDGAR filings, and financial databases to find strategy rules, methodology, and implementation details. Use this when the user asks about a specific trading strategy, fund, or wants to reverse engineer a strategy.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Strategy name or description to research (e.g., 'Dual Momentum strategy', 'ARKK ETF holdings', 'Renaissance Technologies')"
                },
                "research_type": {
                    "type": "string",
                    "description": "Type of research to conduct",
                    "enum": ["strategy", "fund", "trading_rules", "general"],
                    "default": "strategy"
                }
            },
            "required": ["query"]
        }
    },
    # Custom: SEC EDGAR Search
    {
        "name": "search_sec_filings",
        "description": "Search SEC EDGAR database for fund filings, prospectuses, 13F holdings reports, and regulatory documents. Use this to find official fund holdings, strategy disclosures, and compliance documents.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Fund name, company name, or CIK number to search"
                },
                "filing_type": {
                    "type": "string",
                    "description": "Type of filing to search for",
                    "enum": ["all", "holdings", "prospectus", "annual_report"],
                    "default": "all"
                }
            },
            "required": ["query"]
        }
    },
    # Custom: Market Context
    {
        "name": "get_market_context",
        "description": "Get current market context including major indices (SPY, QQQ), volatility (VIX), treasuries (TLT), and commodities (GLD). Use this to provide market backdrop when discussing trading strategies or market conditions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "include_details": {
                    "type": "boolean",
                    "description": "Whether to include detailed analysis",
                    "default": True
                }
            },
            "required": []
        }
    },
    # Custom: Generate AFL
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
        "description": "Debug and fix errors in AFL code. Analyzes the code, identifies issues, and returns corrected code. Use this when the user has AFL code that isn't working or has errors.",
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
    # Custom: Optimize AFL
    {
        "name": "optimize_afl_code",
        "description": "Optimize AFL code for better performance, readability, and best practices. Improves code structure, efficiency, and adds documentation. Use this when the user wants to improve existing AFL code.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The AFL code to optimize"
                }
            },
            "required": ["code"]
        }
    },
    # Custom: Explain AFL
    {
        "name": "explain_afl_code",
        "description": "Explain AFL code in plain English. Provides a detailed breakdown of what each section does, the trading logic, and how signals are generated. Use this when the user wants to understand existing AFL code.",
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
        "description": "Performs comprehensive sanity check on AFL code and automatically fixes common issues. Validates colors (only official AmiBroker colors), function signatures (prevents hallucinations like RSI(Close,14)), and reserved words. Returns fixed code with list of corrections made. USE THIS BEFORE PRESENTING ANY AFL CODE TO THE USER.",
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
# TOOL HANDLERS
# ============================================================================

def execute_python(code: str, description: str = "") -> Dict[str, Any]:
    """
    Execute Python code in a sandboxed environment.
    Only allows safe computational operations.
    """
    # Allowed modules for sandboxed execution
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
    
    # Import safe modules
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
        "rm ", "del ", "remove"
    ]
    
    code_lower = code.lower()
    for keyword in dangerous_keywords:
        if keyword.lower() in code_lower:
            return {
                "success": False,
                "error": f"Unsafe operation detected: {keyword}",
                "output": None
            }
    
    # Execute the code
    try:
        local_vars = {}
        exec(code, allowed_globals, local_vars)
        
        # Get the result (last expression or 'result' variable)
        output = local_vars.get("result", None)
        
        # If no explicit result, try to capture printed output
        if output is None and "output" in local_vars:
            output = local_vars["output"]
        
        return {
            "success": True,
            "output": str(output) if output is not None else "Code executed successfully (no return value)",
            "variables": {k: str(v) for k, v in local_vars.items() if not k.startswith("_")}
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


def search_knowledge_base(query: str, category: Optional[str] = None, limit: int = 5, supabase_client=None) -> Dict[str, Any]:
    """
    Search the knowledge base for relevant documents.
    """
    if supabase_client is None:
        return {
            "success": False,
            "error": "Database connection not available",
            "results": []
        }
    
    try:
        # Build query
        db_query = supabase_client.table("brain_documents").select(
            "id, title, category, summary, tags, raw_content, created_at"
        )
        
        if category:
            db_query = db_query.eq("category", category)
        
        # Search in title, summary, and content
        db_query = db_query.or_(
            f"title.ilike.%{query}%,summary.ilike.%{query}%,raw_content.ilike.%{query}%"
        )
        
        result = db_query.limit(limit).execute()
        
        # Format results
        documents = []
        for doc in result.data:
            # Truncate content for display
            content_preview = doc.get("raw_content", "")[:500] + "..." if len(doc.get("raw_content", "")) > 500 else doc.get("raw_content", "")
            
            documents.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "summary": doc.get("summary", ""),
                "tags": doc.get("tags", []),
                "content_preview": content_preview,
                "created_at": doc["created_at"]
            })
        
        return {
            "success": True,
            "query": query,
            "category_filter": category,
            "results_count": len(documents),
            "results": documents
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "results": []
        }


def get_stock_data(symbol: str, period: str = "1mo", info_type: str = "price") -> Dict[str, Any]:
    """
    Fetch stock market data using yfinance.
    """
    try:
        import yfinance as yf
        
        ticker = yf.Ticker(symbol.upper())
        
        if info_type == "price":
            # Get current price info
            info = ticker.info
            return {
                "success": True,
                "symbol": symbol.upper(),
                "data_type": "price",
                "data": {
                    "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                    "previous_close": info.get("previousClose"),
                    "open": info.get("open") or info.get("regularMarketOpen"),
                    "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
                    "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
                    "volume": info.get("volume") or info.get("regularMarketVolume"),
                    "market_cap": info.get("marketCap"),
                    "52_week_high": info.get("fiftyTwoWeekHigh"),
                    "52_week_low": info.get("fiftyTwoWeekLow"),
                    "pe_ratio": info.get("trailingPE"),
                    "dividend_yield": info.get("dividendYield"),
                    "company_name": info.get("longName") or info.get("shortName"),
                }
            }
            
        elif info_type == "history":
            # Get historical data
            hist = ticker.history(period=period)
            
            if hist.empty:
                return {
                    "success": False,
                    "error": f"No historical data found for {symbol}"
                }
            
            # Convert to simple format
            history_data = []
            for date, row in hist.tail(20).iterrows():  # Last 20 entries
                history_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"])
                })
            
            return {
                "success": True,
                "symbol": symbol.upper(),
                "data_type": "history",
                "period": period,
                "data": history_data
            }
            
        elif info_type == "info":
            # Get company info
            info = ticker.info
            return {
                "success": True,
                "symbol": symbol.upper(),
                "data_type": "info",
                "data": {
                    "name": info.get("longName"),
                    "sector": info.get("sector"),
                    "industry": info.get("industry"),
                    "description": info.get("longBusinessSummary", "")[:500],
                    "website": info.get("website"),
                    "employees": info.get("fullTimeEmployees"),
                    "country": info.get("country"),
                    "exchange": info.get("exchange"),
                }
            }
            
        elif info_type == "financials":
            # Get financial data
            info = ticker.info
            return {
                "success": True,
                "symbol": symbol.upper(),
                "data_type": "financials",
                "data": {
                    "revenue": info.get("totalRevenue"),
                    "gross_profit": info.get("grossProfits"),
                    "net_income": info.get("netIncomeToCommon"),
                    "total_debt": info.get("totalDebt"),
                    "total_cash": info.get("totalCash"),
                    "profit_margins": info.get("profitMargins"),
                    "operating_margins": info.get("operatingMargins"),
                    "return_on_equity": info.get("returnOnEquity"),
                    "debt_to_equity": info.get("debtToEquity"),
                }
            }
        
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
    """
    Comprehensive AFL code validation with hallucination prevention.
    Validates colors, function signatures, reserved words, and syntax.
    """
    from core.afl_validator import AFLValidator, get_valid_colors
    
    validator = AFLValidator()
    result = validator.validate(code)
    
    # Basic info
    lines = code.split("\n")
    code_upper = code.upper()
    
    # Combine all errors for backward compatibility
    all_errors = result.errors + result.color_issues + result.function_issues
    all_warnings = result.warnings + result.reserved_word_issues + result.style_issues
    
    return {
        "success": result.is_valid,
        "valid": result.is_valid,
        "errors": all_errors,
        "warnings": all_warnings,
        "color_issues": result.color_issues,
        "function_issues": result.function_issues,
        "reserved_word_issues": result.reserved_word_issues,
        "style_issues": result.style_issues,
        "suggestions": result.suggestions,
        "line_count": len(lines),
        "has_buy_sell": "BUY" in code_upper or "SELL" in code_upper,
        "has_plot": "PLOT" in code_upper,
        "valid_colors": get_valid_colors() if not result.is_valid else None
    }


# ============================================================================
# NEW TOOL HANDLERS - Strategy Research, AFL Generation, etc.
# ============================================================================

def research_strategy(query: str, research_type: str = "strategy") -> Dict[str, Any]:
    """
    Conduct comprehensive research on a trading strategy using the StrategyResearcher.
    """
    try:
        import os
        from core.researcher import StrategyResearcher
        
        tavily_key = os.environ.get("TAVILY_API_KEY")
        researcher = StrategyResearcher(tavily_api_key=tavily_key)
        
        if research_type == "strategy":
            result = researcher.research_strategy(query)
        elif research_type == "fund":
            result = researcher.research_fund(query)
        elif research_type == "trading_rules":
            result = researcher.search_trading_rules(query)
        else:
            result = researcher.search_web(query, search_type="general")
        
        return {
            "success": True,
            "query": query,
            "research_type": research_type,
            "research": result
        }
        
    except ImportError as e:
        return {
            "success": False,
            "error": f"Research module not available: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def search_sec_filings(query: str, filing_type: str = "all") -> Dict[str, Any]:
    """
    Search SEC EDGAR database for fund filings.
    """
    try:
        from core.researcher import StrategyResearcher
        
        researcher = StrategyResearcher()
        result = researcher.search_sec_edgar(query)
        
        return {
            "success": True,
            "query": query,
            "filing_type": filing_type,
            "filings": result if result else "No filings found"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_market_context_tool(include_details: bool = True) -> Dict[str, Any]:
    """
    Get current market context including major indices.
    """
    try:
        from core.researcher import StrategyResearcher
        
        researcher = StrategyResearcher()
        context = researcher.get_market_context("")
        
        return {
            "success": True,
            "market_context": context if context else "Market data unavailable"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def generate_afl_code(description: str, strategy_type: str = "standalone", api_key: str = None) -> Dict[str, Any]:
    """
    Generate AFL code using the ClaudeAFLEngine.
    """
    if not api_key:
        return {
            "success": False,
            "error": "API key required for AFL generation"
        }
    
    try:
        from core.claude_engine import ClaudeAFLEngine, StrategyType
        
        engine = ClaudeAFLEngine(api_key=api_key)
        
        strat_type = StrategyType.STANDALONE
        if strategy_type.lower() == "composite":
            strat_type = StrategyType.COMPOSITE
        
        result = engine.generate_afl(
            request=description,
            strategy_type=strat_type
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
    """
    Debug and fix AFL code using the ClaudeAFLEngine.
    """
    if not api_key:
        return {
            "success": False,
            "error": "API key required for AFL debugging"
        }
    
    try:
        from core.claude_engine import ClaudeAFLEngine
        
        engine = ClaudeAFLEngine(api_key=api_key)
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


def optimize_afl_code(code: str, api_key: str = None) -> Dict[str, Any]:
    """
    Optimize AFL code using the ClaudeAFLEngine.
    """
    if not api_key:
        return {
            "success": False,
            "error": "API key required for AFL optimization"
        }
    
    try:
        from core.claude_engine import ClaudeAFLEngine
        
        engine = ClaudeAFLEngine(api_key=api_key)
        optimized_code = engine.optimize_code(code)
        
        return {
            "success": True,
            "original_code": code[:200] + "..." if len(code) > 200 else code,
            "optimized_code": optimized_code
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def explain_afl_code(code: str, api_key: str = None) -> Dict[str, Any]:
    """
    Explain AFL code using the ClaudeAFLEngine.
    """
    if not api_key:
        return {
            "success": False,
            "error": "API key required for AFL explanation"
        }
    
    try:
        from core.claude_engine import ClaudeAFLEngine
        
        engine = ClaudeAFLEngine(api_key=api_key)
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
    """
    Comprehensive AFL sanity check with auto-fix capability.
    Validates colors, function signatures, reserved words, and fixes common issues.
    """
    from core.afl_validator import AFLValidator, fix_afl_code, get_valid_colors, get_valid_styles, get_valid_shapes
    
    validator = AFLValidator()
    
    # First, validate the original code
    original_validation = validator.validate(code)
    
    result = {
        "success": original_validation.is_valid,
        "original_valid": original_validation.is_valid,
        "original_issues": {
            "errors": original_validation.errors,
            "color_issues": original_validation.color_issues,
            "function_issues": original_validation.function_issues,
            "reserved_word_issues": original_validation.reserved_word_issues,
            "style_issues": original_validation.style_issues,
            "warnings": original_validation.warnings,
        },
        "total_issues_found": (
            len(original_validation.errors) +
            len(original_validation.color_issues) +
            len(original_validation.function_issues) +
            len(original_validation.reserved_word_issues)
        )
    }
    
    # If auto_fix is enabled and there are issues, try to fix them
    if auto_fix and not original_validation.is_valid:
        fixed_code, fixes_applied = validator.fix_code(code)
        fixed_validation = validator.validate(fixed_code)
        
        result.update({
            "auto_fixed": True,
            "fixes_applied": fixes_applied,
            "fixed_code": fixed_code,
            "fixed_valid": fixed_validation.is_valid,
            "remaining_issues": {
                "errors": fixed_validation.errors,
                "color_issues": fixed_validation.color_issues,
                "function_issues": fixed_validation.function_issues,
                "reserved_word_issues": fixed_validation.reserved_word_issues,
            },
            "success": fixed_validation.is_valid
        })
        
        # If still has issues, provide helpful info
        if not fixed_validation.is_valid:
            result["valid_colors_reference"] = get_valid_colors()
            result["valid_styles_reference"] = get_valid_styles()[:10]  # Top 10
            result["valid_shapes_reference"] = get_valid_shapes()[:10]
            result["manual_fixes_needed"] = True
    else:
        result["auto_fixed"] = False
        result["fixed_code"] = code
    
    # Always include summary
    result["summary"] = _generate_sanity_check_summary(result)
    
    return result


def _generate_sanity_check_summary(result: Dict[str, Any]) -> str:
    """Generate a human-readable summary of the sanity check."""
    if result["original_valid"]:
        return " AFL code passed all sanity checks. No hallucinations or invalid colors detected."
    
    issues = []
    orig = result["original_issues"]
    
    if orig["color_issues"]:
        issues.append(f"<¨ {len(orig['color_issues'])} invalid color(s)")
    if orig["function_issues"]:
        issues.append(f"  {len(orig['function_issues'])} function hallucination(s)")
    if orig["reserved_word_issues"]:
        issues.append(f"=Û {len(orig['reserved_word_issues'])} reserved word conflict(s)")
    if orig["errors"]:
        issues.append(f"L {len(orig['errors'])} syntax error(s)")
    
    summary = f"Found {result['total_issues_found']} issue(s): " + ", ".join(issues)
    
    if result.get("auto_fixed"):
        if result.get("fixed_valid"):
            summary += f"\n Auto-fixed {len(result['fixes_applied'])} issue(s). Code is now valid."
        else:
            summary += f"\n  Auto-fixed {len(result['fixes_applied'])} issue(s), but manual fixes still needed."
    
    return summary


# ============================================================================
# TOOL DISPATCHER
# ============================================================================

def handle_tool_call(tool_name: str, tool_input: Dict[str, Any], supabase_client=None, api_key: str = None) -> str:
    """
    Dispatch tool calls to appropriate handlers.
    Returns JSON string result.
    """
    try:
        if tool_name == "execute_python":
            result = execute_python(
                code=tool_input.get("code", ""),
                description=tool_input.get("description", "")
            )
        
        elif tool_name == "search_knowledge_base":
            result = search_knowledge_base(
                query=tool_input.get("query", ""),
                category=tool_input.get("category"),
                limit=tool_input.get("limit", 5),
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
        
        elif tool_name == "research_strategy":
            result = research_strategy(
                query=tool_input.get("query", ""),
                research_type=tool_input.get("research_type", "strategy")
            )
        
        elif tool_name == "search_sec_filings":
            result = search_sec_filings(
                query=tool_input.get("query", ""),
                filing_type=tool_input.get("filing_type", "all")
            )
        
        elif tool_name == "get_market_context":
            result = get_market_context_tool(
                include_details=tool_input.get("include_details", True)
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
        
        elif tool_name == "optimize_afl_code":
            result = optimize_afl_code(
                code=tool_input.get("code", ""),
                api_key=api_key
            )
        
        elif tool_name == "explain_afl_code":
            result = explain_afl_code(
                code=tool_input.get("code", ""),
                api_key=api_key
            )
        
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        
        return json.dumps(result, indent=2, default=str)
        
    except Exception as e:
        return json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        })


# Get only custom tools (not built-in like web_search)
def get_custom_tools() -> List[Dict]:
    """Return only custom tool definitions (not built-in Claude tools)."""
    return [tool for tool in TOOL_DEFINITIONS if "input_schema" in tool]


def get_all_tools() -> List[Dict]:
    """Return all tool definitions including built-in."""
    return TOOL_DEFINITIONS