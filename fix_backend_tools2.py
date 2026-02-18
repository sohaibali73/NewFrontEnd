"""Fix remaining stubbed tool handlers using line-number-based replacement."""
TOOLS_PATH = r"C:\Users\SohaibAli\PycharmProjects\Potomac-Analyst-Workbench\core\tools.py"

with open(TOOLS_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the exact line numbers of each function
def find_func(name):
    for i, line in enumerate(lines):
        if line.strip().startswith(f"def {name}("):
            return i
    return None

def find_next_func_or_comment(start):
    """Find the next def or # === line after start"""
    for i in range(start + 1, len(lines)):
        stripped = lines[i].strip()
        if stripped.startswith("def ") or stripped.startswith("# ==="):
            return i
    return len(lines)

replacements = {
    "get_search_trends": '''def get_search_trends(region: str = "US", category: str = None, period: str = "today") -> Dict[str, Any]:
    """Get search trends using Tavily web search."""
    try:
        start_time = time.time()
        query = "trending topics today " + (category or "all") + " " + region
        try:
            from config import settings
            tavily_key = getattr(settings, "TAVILY_API_KEY", None)
            if tavily_key:
                import requests as _req
                resp = _req.post("https://api.tavily.com/search", json={
                    "api_key": tavily_key, "query": query, "max_results": 8,
                    "search_depth": "basic", "include_answer": True
                }, timeout=10)
                data = resp.json()
                return {
                    "success": True, "tool": "get_search_trends",
                    "region": region, "category": category, "period": period,
                    "answer": data.get("answer", ""),
                    "sources": [{"title": r.get("title",""), "url": r.get("url",""), "snippet": r.get("content","")[:200]} for r in data.get("results", [])[:8]],
                    "source": "tavily_live",
                    "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
                }
        except Exception:
            pass
        return {
            "success": True, "tool": "get_search_trends",
            "region": region, "category": category, "period": period,
            "message": "Trending topics available when Tavily API key is configured. Check Google Trends.",
            "links": ["https://trends.google.com/trending"],
            "source": "fallback",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

''',
    "order_food": '''def order_food(query: str, cuisine: str = None, location: str = None) -> Dict[str, Any]:
    """Search for restaurants and food delivery using Tavily web search."""
    try:
        start_time = time.time()
        search_query = query + (" " + cuisine if cuisine else "") + " restaurants " + (location or "near me") + " delivery"
        try:
            from config import settings
            tavily_key = getattr(settings, "TAVILY_API_KEY", None)
            if tavily_key:
                import requests as _req
                resp = _req.post("https://api.tavily.com/search", json={
                    "api_key": tavily_key, "query": search_query, "max_results": 5,
                    "search_depth": "basic", "include_answer": True
                }, timeout=10)
                data = resp.json()
                return {
                    "success": True, "tool": "order_food",
                    "query": query, "cuisine": cuisine, "location": location or "Your area",
                    "answer": data.get("answer", ""),
                    "restaurants": [{"name": r.get("title",""), "url": r.get("url",""), "description": r.get("content","")[:200]} for r in data.get("results", [])[:5]],
                    "order_links": {
                        "doordash": "https://www.doordash.com/search/store/" + query.replace(" ", "%20"),
                        "ubereats": "https://www.ubereats.com/search?q=" + query.replace(" ", "%20"),
                        "grubhub": "https://www.grubhub.com/search?queryText=" + query.replace(" ", "%20")
                    },
                    "source": "tavily_live",
                    "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
                }
        except Exception:
            pass
        return {
            "success": True, "tool": "order_food",
            "query": query, "cuisine": cuisine, "location": location or "Your area",
            "message": "Restaurant search available when Tavily API key is configured.",
            "order_links": {
                "doordash": "https://www.doordash.com/search/store/" + query.replace(" ", "%20"),
                "ubereats": "https://www.ubereats.com/search?q=" + query.replace(" ", "%20"),
                "grubhub": "https://www.grubhub.com/search?queryText=" + query.replace(" ", "%20")
            },
            "source": "fallback",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

''',
    "track_flight": '''def track_flight(flight_number: str, date: str = None) -> Dict[str, Any]:
    """Track flight status using Tavily web search."""
    try:
        from datetime import datetime
        start_time = time.time()
        query = "flight status " + flight_number.upper() + " " + (date or datetime.now().strftime("%Y-%m-%d"))
        try:
            from config import settings
            tavily_key = getattr(settings, "TAVILY_API_KEY", None)
            if tavily_key:
                import requests as _req
                resp = _req.post("https://api.tavily.com/search", json={
                    "api_key": tavily_key, "query": query, "max_results": 5,
                    "search_depth": "basic", "include_answer": True
                }, timeout=10)
                data = resp.json()
                return {
                    "success": True, "tool": "track_flight",
                    "flight_number": flight_number.upper(),
                    "date": date or datetime.now().strftime("%Y-%m-%d"),
                    "answer": data.get("answer", ""),
                    "sources": [{"title": r.get("title",""), "url": r.get("url",""), "snippet": r.get("content","")[:200]} for r in data.get("results", [])[:5]],
                    "tracking_links": {
                        "flightaware": "https://flightaware.com/live/flight/" + flight_number.upper(),
                        "flightradar24": "https://www.flightradar24.com/" + flight_number.upper().lower(),
                        "google": "https://www.google.com/search?q=flight+" + flight_number.upper()
                    },
                    "source": "tavily_live",
                    "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
                }
        except Exception:
            pass
        return {
            "success": True, "tool": "track_flight",
            "flight_number": flight_number.upper(),
            "date": date or datetime.now().strftime("%Y-%m-%d"),
            "message": "Flight tracking available when Tavily API key is configured.",
            "tracking_links": {
                "flightaware": "https://flightaware.com/live/flight/" + flight_number.upper(),
                "flightradar24": "https://www.flightradar24.com/" + flight_number.upper().lower(),
                "google": "https://www.google.com/search?q=flight+" + flight_number.upper()
            },
            "source": "fallback",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

''',
}

count = 0
for func_name, new_code in replacements.items():
    start = find_func(func_name)
    if start is None:
        print(f"  SKIP: {func_name} not found")
        continue
    end = find_next_func_or_comment(start)
    old_code = "".join(lines[start:end])
    if "mock" in old_code.lower() or "Mock" in old_code or "fallback" not in old_code:
        # Only replace if it still has mock data (not already replaced)
        lines[start:end] = [new_code]
        count += 1
        print(f"  REPLACED: {func_name} (lines {start+1}-{end})")
    else:
        print(f"  ALREADY FIXED: {func_name}")

with open(TOOLS_PATH, "w", encoding="utf-8") as f:
    f.writelines(lines)

print(f"\nTotal: {count} functions replaced")
