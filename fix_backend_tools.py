"""Fix stubbed tool handlers in the backend tools.py"""
import os

TOOLS_PATH = r"C:\Users\SohaibAli\PycharmProjects\Potomac-Analyst-Workbench\core\tools.py"

with open(TOOLS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

count = 0

# ── 1. Replace get_live_scores ──────────────────────────────────────────
old_live = '''def get_live_scores(sport: str = None, league: str = None, date: str = None) -> Dict[str, Any]:
    """Get live sports scores (mock implementation for now)."""'''
new_live = '''def get_live_scores(sport: str = None, league: str = None, date: str = None) -> Dict[str, Any]:
    """Get live sports scores using Tavily web search."""'''
if old_live in content:
    content = content.replace(old_live, new_live)
    count += 1

# Replace the mock_games block with Tavily search
old_mock_games = '''        # Mock sports data - in production this would connect to a sports API
        mock_games = {
            "nba": [
                {"home_team": "Lakers", "away_team": "Warriors", "home_score": 108, "away_score": 112, "status": "Final", "quarter": "4th"},
                {"home_team": "Celtics", "away_team": "Heat", "home_score": 95, "away_score": 88, "status": "3rd 6:42", "quarter": "3rd"},
            ],
            "nfl": [
                {"home_team": "Chiefs", "away_team": "Bills", "home_score": 21, "away_score": 17, "status": "4th 2:15", "quarter": "4th"},
            ],
            "mlb": [
                {"home_team": "Yankees", "away_team": "Red Sox", "home_score": 7, "away_score": 4, "status": "Bottom 8th", "inning": "8th"},
            ]
        }

        selected_sport = sport or "nba"
        games = mock_games.get(selected_sport, [])

        return {
            "success": True,
            "tool": "get_live_scores",
            "sport": selected_sport,
            "league": league or selected_sport.upper(),
            "date": date or datetime.now().strftime("%Y-%m-%d"),
            "games": games,
            "games_count": len(games),
            "note": "Mock data - integrate with ESPN/The Score API for real data",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }'''
new_mock_games = '''        selected_sport = sport or "nba"
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
        }'''
if old_mock_games in content:
    content = content.replace(old_mock_games, new_mock_games)
    count += 1

# ── 2. Replace get_search_trends ─────────────────────────────────────────
old_trends = '''def get_search_trends(region: str = "US", category: str = None, period: str = "today") -> Dict[str, Any]:
    """Get search trends (mock implementation)."""
    try:
        start_time = time.time()

        # Mock trending topics - in production this would connect to Google Trends API
        mock_trends = [
            {"query": "AI earnings report", "volume": "500K+", "change": "+1200%", "category": "technology"},
            {"query": "Super Bowl highlights", "volume": "2M+", "change": "+800%", "category": "sports"},
            {"query": "Stock market crash", "volume": "100K+", "change": "+400%", "category": "finance"},
            {"query": "New iPhone release", "volume": "300K+", "change": "+200%", "category": "technology"},
            {"query": "Crypto bull run", "volume": "150K+", "change": "+150%", "category": "finance"},
        ]

        filtered_trends = mock_trends
        if category:
            filtered_trends = [t for t in mock_trends if t["category"] == category]

        return {
            "success": True,
            "tool": "get_search_trends",
            "region": region,
            "category": category,
            "period": period,
            "trends": filtered_trends,
            "trends_count": len(filtered_trends),
            "note": "Mock data - integrate with Google Trends API for real data",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}'''

new_trends = '''def get_search_trends(region: str = "US", category: str = None, period: str = "today") -> Dict[str, Any]:
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
        return {"success": False, "error": str(e)}'''

if old_trends in content:
    content = content.replace(old_trends, new_trends)
    count += 1

# ── 3. Replace order_food ────────────────────────────────────────────────
old_food = '''def order_food(query: str, cuisine: str = None, location: str = None) -> Dict[str, Any]:
    """Search for food delivery (mock implementation)."""
    try:
        start_time = time.time()

        # Mock restaurant data
        mock_restaurants = [
            {"name": "Tony's Pizza", "rating": 4.5, "cuisine": "italian", "delivery_time": "25-35 min", "price": "$$", "popular_items": ["Margherita Pizza", "Pepperoni Pizza"]},
            {"name": "Sakura Sushi", "rating": 4.7, "cuisine": "japanese", "delivery_time": "30-40 min", "price": "$$$", "popular_items": ["California Roll", "Salmon Sashimi"]},
            {"name": "Burger Joint", "rating": 4.2, "cuisine": "american", "delivery_time": "20-30 min", "price": "$", "popular_items": ["Classic Burger", "Fries"]},
        ]

        filtered_restaurants = mock_restaurants
        if cuisine:
            filtered_restaurants = [r for r in mock_restaurants if r["cuisine"] == cuisine]

        return {
            "success": True,
            "tool": "order_food",
            "query": query,
            "cuisine": cuisine,
            "location": location or "Your area",
            "restaurants": filtered_restaurants,
            "restaurant_count": len(filtered_restaurants),
            "note": "Mock data - integrate with DoorDash/Uber Eats API for real restaurants",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}'''

new_food = '''def order_food(query: str, cuisine: str = None, location: str = None) -> Dict[str, Any]:
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
        return {"success": False, "error": str(e)}'''

if old_food in content:
    content = content.replace(old_food, new_food)
    count += 1

# ── 4. Replace track_flight ──────────────────────────────────────────────
old_flight = '''def track_flight(flight_number: str, date: str = None) -> Dict[str, Any]:
    """Track flight status (mock implementation)."""
    try:
        from datetime import datetime
        start_time = time.time()

        # Mock flight data
        mock_flight = {
            "flight_number": flight_number.upper(),
            "airline": flight_number[:2].upper(),
            "status": "On Time",
            "departure": {
                "airport": "JFK - New York",
                "scheduled": "14:30",
                "actual": "14:35",
                "gate": "A12",
                "terminal": "4"
            },
            "arrival": {
                "airport": "LAX - Los Angeles",
                "scheduled": "17:45",
                "estimated": "17:50",
                "gate": "B8",
                "terminal": "6"
            },
            "aircraft": "Boeing 737-800",
            "progress": 65
        }

        return {
            "success": True,
            "tool": "track_flight",
            "flight_number": flight_number.upper(),
            "date": date or datetime.now().strftime("%Y-%m-%d"),
            "flight_info": mock_flight,
            "note": "Mock data - integrate with FlightAware/FlightStats API for real tracking",
            "fetch_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}'''

new_flight = '''def track_flight(flight_number: str, date: str = None) -> Dict[str, Any]:
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
        return {"success": False, "error": str(e)}'''

if old_flight in content:
    content = content.replace(old_flight, new_flight)
    count += 1

with open(TOOLS_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Replaced {count} stubbed tool handlers in tools.py")
