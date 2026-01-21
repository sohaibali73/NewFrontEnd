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
    Validate AFL code for common syntax errors.
    """
    errors = []
    warnings = []
    
    # Basic syntax checks
    lines = code.split("\n")
    
    # Check for balanced parentheses and brackets
    paren_count = 0
    bracket_count = 0
    brace_count = 0
    
    for i, line in enumerate(lines, 1):
        # Skip comments
        if line.strip().startswith("//"):
            continue
        
        for char in line:
            if char == "(": paren_count += 1
            elif char == ")": paren_count -= 1
            elif char == "[": bracket_count += 1
            elif char == "]": bracket_count -= 1
            elif char == "{": brace_count += 1
            elif char == "}": brace_count -= 1
            
            if paren_count < 0:
                errors.append(f"Line {i}: Unmatched closing parenthesis")
            if bracket_count < 0:
                errors.append(f"Line {i}: Unmatched closing bracket")
            if brace_count < 0:
                errors.append(f"Line {i}: Unmatched closing brace")
    
    if paren_count != 0:
        errors.append(f"Unbalanced parentheses: {abs(paren_count)} {'open' if paren_count > 0 else 'close'} missing")
    if bracket_count != 0:
        errors.append(f"Unbalanced brackets: {abs(bracket_count)} {'open' if bracket_count > 0 else 'close'} missing")
    if brace_count != 0:
        errors.append(f"Unbalanced braces: {abs(brace_count)} {'open' if brace_count > 0 else 'close'} missing")
    
    # Check for common AFL issues
    common_issues = [
        (r"=\s*=", "Use '==' for comparison, not '= ='"),
        (r"[^=!<>]=(?!=)", None),  # Assignment in condition - skip, AFL uses = for both
    ]
    
    # Check for required elements in trading systems
    code_upper = code.upper()
    if "BUY" in code_upper or "SELL" in code_upper:
        if "BUY" in code_upper and "SELL" not in code_upper:
            warnings.append("Trading system has BUY but no SELL condition")
        if "SELL" in code_upper and "BUY" not in code_upper:
            warnings.append("Trading system has SELL but no BUY condition")
    
    # Check for common function usage
    if "PLOT" in code_upper and "GRAPHXSPACE" not in code_upper:
        warnings.append("Consider adding _SECTION_BEGIN/END and GraphXSpace for better chart organization")
    
    return {
        "success": len(errors) == 0,
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "line_count": len(lines),
        "has_buy_sell": "BUY" in code_upper or "SELL" in code_upper,
        "has_plot": "PLOT" in code_upper
    }


# ============================================================================
# TOOL DISPATCHER
# ============================================================================

def handle_tool_call(tool_name: str, tool_input: Dict[str, Any], supabase_client=None) -> str:
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