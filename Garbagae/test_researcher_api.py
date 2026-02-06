#!/usr/bin/env python3
"""
Test script for the Researcher API
"""

import asyncio
import json
import requests
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
TEST_SYMBOL = "AAPL"
HEADERS = {
    "Content-Type": "application/json"
}

def print_section(title: str):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def print_result(title: str, result: Dict[str, Any]):
    """Print a formatted result"""
    print(f"\n{title}:")
    print("-" * 40)
    if result.get("success"):
        print("✅ SUCCESS")
        if "data" in result:
            print(f"Data keys: {list(result['data'].keys())}")
            if "message" in result:
                print(f"Message: {result['message']}")
    else:
        print("❌ FAILED")
        print(f"Error: {result.get('detail', 'Unknown error')}")

async def test_health_check():
    """Test the health check endpoint"""
    print_section("Testing Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/api/researcher/health")
        result = response.json()
        print_result("Health Check", result)
        return result.get("status") == "healthy"
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

async def test_company_research():
    """Test the company research endpoint"""
    print_section("Testing Company Research")
    
    try:
        response = requests.get(f"{BASE_URL}/api/researcher/company/{TEST_SYMBOL}")
        result = response.json()
        print_result("Company Research", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nCompany Data Structure:")
            for key, value in data.items():
                if isinstance(value, dict):
                    print(f"  {key}: {list(value.keys())}")
                elif isinstance(value, list):
                    print(f"  {key}: list of {len(value)} items")
                else:
                    print(f"  {key}: {type(value).__name__}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ Company research failed: {e}")
        return False

async def test_news_endpoint():
    """Test the news endpoint"""
    print_section("Testing News Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/api/researcher/news/{TEST_SYMBOL}?limit=5")
        result = response.json()
        print_result("News Endpoint", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nNews Data:")
            print(f"  Symbol: {data.get('symbol')}")
            print(f"  News count: {data.get('news_count', 0)}")
            print(f"  Sentiment score: {data.get('sentiment_score', 0)}")
            
            if "news" in data:
                print(f"  Sample news headlines:")
                for i, news_item in enumerate(data["news"][:3]):
                    print(f"    {i+1}. {news_item.get('headline', 'No headline')}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ News endpoint failed: {e}")
        return False

async def test_strategy_analysis():
    """Test the strategy analysis endpoint"""
    print_section("Testing Strategy Analysis")
    
    try:
        payload = {
            "symbol": TEST_SYMBOL,
            "strategy_type": "momentum",
            "timeframe": "daily"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/researcher/strategy-analysis",
            json=payload,
            headers=HEADERS
        )
        result = response.json()
        print_result("Strategy Analysis", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nStrategy Analysis Data:")
            for key, value in data.items():
                print(f"  {key}: {value}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ Strategy analysis failed: {e}")
        return False

async def test_peer_comparison():
    """Test the peer comparison endpoint"""
    print_section("Testing Peer Comparison")
    
    try:
        payload = {
            "symbol": TEST_SYMBOL,
            "peers": ["MSFT", "GOOGL", "AMZN"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/researcher/comparison",
            json=payload,
            headers=HEADERS
        )
        result = response.json()
        print_result("Peer Comparison", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nComparison Data:")
            if "comparison" in data:
                comparison = data["comparison"]
                print(f"  Comparison metrics: {list(comparison.keys())}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ Peer comparison failed: {e}")
        return False

async def test_macro_context():
    """Test the macro context endpoint"""
    print_section("Testing Macro Context")
    
    try:
        response = requests.get(f"{BASE_URL}/api/researcher/macro-context")
        result = response.json()
        print_result("Macro Context", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nMacro Data:")
            for key, value in data.items():
                print(f"  {key}: {value}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ Macro context failed: {e}")
        return False

async def test_sec_filings():
    """Test the SEC filings endpoint"""
    print_section("Testing SEC Filings")
    
    try:
        response = requests.get(f"{BASE_URL}/api/researcher/sec-filings/{TEST_SYMBOL}")
        result = response.json()
        print_result("SEC Filings", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nSEC Filings Data:")
            print(f"  Symbol: {data.get('symbol')}")
            print(f"  Filing count: {data.get('filing_count', 0)}")
            
            if "filings" in data:
                print(f"  Sample filings:")
                for i, filing in enumerate(data["filings"][:3]):
                    print(f"    {i+1}. {filing.get('type')} - {filing.get('date')}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ SEC filings failed: {e}")
        return False

async def test_report_generation():
    """Test the report generation endpoint"""
    print_section("Testing Report Generation")
    
    try:
        payload = {
            "symbol": TEST_SYMBOL,
            "report_type": "company",
            "sections": ["executive_summary", "fundamental_analysis"],
            "format": "json"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/researcher/generate-report",
            json=payload,
            headers=HEADERS
        )
        result = response.json()
        print_result("Report Generation", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nReport Data:")
            print(f"  Report ID: {data.get('report_id')}")
            print(f"  Title: {data.get('title')}")
            print(f"  Export options: {data.get('export_options', [])}")
            
            if "sections" in data:
                print(f"  Report sections: {len(data['sections'])}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ Report generation failed: {e}")
        return False

async def test_search_endpoint():
    """Test the search endpoint"""
    print_section("Testing Search Endpoint")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/researcher/search?query={TEST_SYMBOL}&search_type=company&limit=5"
        )
        result = response.json()
        print_result("Search Endpoint", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nSearch Data:")
            print(f"  Query: {data.get('query')}")
            print(f"  Search type: {data.get('search_type')}")
            print(f"  Total results: {data.get('total_results', 0)}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ Search endpoint failed: {e}")
        return False

async def test_trending_endpoint():
    """Test the trending endpoint"""
    print_section("Testing Trending Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/api/researcher/trending?limit=5")
        result = response.json()
        print_result("Trending Endpoint", result)
        
        if result.get("success") and "data" in result:
            data = result["data"]
            print(f"\nTrending Data:")
            print(f"  Trending companies: {len(data.get('trending_companies', []))}")
            print(f"  Trending strategies: {len(data.get('trending_strategies', []))}")
            print(f"  Trending topics: {len(data.get('trending_topics', []))}")
        
        return result.get("success", False)
    except Exception as e:
        print(f"❌ Trending endpoint failed: {e}")
        return False

async def run_all_tests():
    """Run all tests and return summary"""
    print_section("RESEARCHER API TEST SUITE")
    print(f"Testing against: {BASE_URL}")
    print(f"Test symbol: {TEST_SYMBOL}")
    
    tests = [
        ("Health Check", test_health_check),
        ("Company Research", test_company_research),
        ("News Endpoint", test_news_endpoint),
        ("Strategy Analysis", test_strategy_analysis),
        ("Peer Comparison", test_peer_comparison),
        ("Macro Context", test_macro_context),
        ("SEC Filings", test_sec_filings),
        ("Report Generation", test_report_generation),
        ("Search Endpoint", test_search_endpoint),
        ("Trending Endpoint", test_trending_endpoint),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = await test_func()
            results.append((test_name, success))
            print(f"Result: {'✅ PASSED' if success else '❌ FAILED'}")
        except Exception as e:
            print(f"❌ ERROR: {e}")
            results.append((test_name, False))
        
        # Add delay between tests
        await asyncio.sleep(1)
    
    # Print summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"Total tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success rate: {(passed/total)*100:.1f}%")
    
    print(f"\nDetailed Results:")
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    return passed == total

if __name__ == "__main__":
    print("Starting Researcher API Tests...")
    print("Make sure the FastAPI server is running on http://localhost:8000")
    
    try:
        success = asyncio.run(run_all_tests())
        if success:
            print(f"\n🎉 All tests passed!")
        else:
            print(f"\n⚠️  Some tests failed. Check the output above for details.")
    except KeyboardInterrupt:
        print(f"\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")