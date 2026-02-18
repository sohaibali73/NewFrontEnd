"""Fix get_live_scores function body."""
TOOLS_PATH = r"C:\Users\SohaibAli\PycharmProjects\Potomac-Analyst-Workbench\core\tools.py"

with open(TOOLS_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find get_live_scores
start = None
for i, line in enumerate(lines):
    if line.strip().startswith("def get_live_scores("):
        start = i
        break

if start is None:
    print("get_live_scores not found")
    exit()

# Find next function
end = start + 1
for i in range(start + 1, len(lines)):
    if lines[i].strip().startswith("def "):
        end = i
        break

old = "".join(lines[start:end])
if "mock" not in old.lower() and "Mock" not in old:
    print("get_live_scores already fixed")
    exit()

new_code = '''def get_live_scores(sport: str = None, league: str = None, date: str = None) -> Dict[str, Any]:
    """Get live sports scores using Tavily web search."""
    try:
        from datetime import datetime
        start_time = time.time()
        selected_sport = sport or "nba"
        query = selected_sport + " scores today " + (date or datetime.now().strftime("%Y-%m-%d"))
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
                    "success": True, "tool": "get_live_scores",
                    "sport": selected_sport, "league": league or selected_sport.upper(),
                    "date": date or datetime.now().strftime("%Y-%m-%d"),
                    "answer": data.get("answer", ""),
                    "sources": [{"title": r.get("title",""), "url": r.get("url",""), "snippet": r.get("content","")[:200]} for r in data.get("results", [])[:5]],
                    "source": "tavily_live",
                    "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
                }
        except Exception:
            pass
        return {
            "success": True, "tool": "get_live_scores",
            "sport": selected_sport, "league": league or selected_sport.upper(),
            "date": date or datetime.now().strftime("%Y-%m-%d"),
            "message": "Live scores available when Tavily API key is configured. Check ESPN.com or TheScore.com.",
            "links": ["https://www.espn.com/", "https://www.thescore.com/"],
            "source": "fallback",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


'''

lines[start:end] = [new_code]
with open(TOOLS_PATH, "w", encoding="utf-8") as f:
    f.writelines(lines)
print(f"REPLACED: get_live_scores (lines {start+1}-{end})")
