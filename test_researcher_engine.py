#!/usr/bin/env python3
"""
Test script for the updated Researcher Engine with OpenBB integration
"""

import asyncio
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.researcher_engine import ResearcherEngine


async def test_researcher_engine():
    """Test the researcher engine with real data"""
    print("Testing Researcher Engine with OpenBB integration...")
    
    try:
        # Initialize the engine
        engine = ResearcherEngine()
        print("✓ ResearcherEngine initialized successfully")
        
        # Test company research
        print("\nTesting company research for AAPL...")
        result = await engine.get_company_research('AAPL')
        
        print("✓ Company research completed successfully")
        print(f"✓ Result keys: {list(result.keys())}")
        
        # Check fundamentals
        fundamentals = result.get('fundamentals', {})
        if fundamentals:
            print(f"✓ Fundamentals retrieved: {len(fundamentals)} attributes")
            print(f"  Sample keys: {list(fundamentals.keys())[:5]}")
        else:
            print("⚠ No fundamentals data retrieved")
        
        # Check news
        news = result.get('news', [])
        print(f"✓ News articles retrieved: {len(news)}")
        
        # Check sentiment
        sentiment = result.get('sentiment', {})
        print(f"✓ Sentiment analysis: {sentiment.get('overall_sentiment', 'unknown')}")
        
        # Check AI summary
        ai_summary = result.get('ai_summary', '')
        if ai_summary:
            print(f"✓ AI summary generated: {len(ai_summary)} characters")
        else:
            print("⚠ No AI summary generated")
        
        print("\n" + "="*50)
        print("TEST RESULTS SUMMARY:")
        print("="*50)
        print(f"✓ Company: {result.get('symbol', 'N/A')}")
        print(f"✓ Timestamp: {result.get('timestamp', 'N/A')}")
        print(f"✓ Fundamentals: {'✓' if fundamentals else '✗'}")
        print(f"✓ News: {'✓' if news else '✗'}")
        print(f"✓ Sentiment: {'✓' if sentiment else '✗'}")
        print(f"✓ AI Summary: {'✓' if ai_summary else '✗'}")
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_strategy_analysis():
    """Test strategy analysis functionality"""
    print("\n" + "="*50)
    print("Testing Strategy Analysis...")
    print("="*50)
    
    try:
        engine = ResearcherEngine()
        
        # Test momentum strategy analysis
        result = await engine.get_strategy_analysis('AAPL', 'momentum', 'daily')
        
        print("✓ Strategy analysis completed successfully")
        print(f"✓ Strategy type: {result.get('strategy_type', 'N/A')}")
        print(f"✓ Market regime: {result.get('market_regime', 'N/A')}")
        print(f"✓ Strategy fit score: {result.get('strategy_fit_score', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"✗ Strategy analysis failed: {e}")
        return False


async def main():
    """Run all tests"""
    print("Starting Researcher Engine Tests")
    print("="*50)
    
    # Test basic functionality
    success1 = await test_researcher_engine()
    
    # Test strategy analysis
    success2 = await test_strategy_analysis()
    
    print("\n" + "="*50)
    print("FINAL TEST RESULTS:")
    print("="*50)
    print(f"Company Research Test: {'✓ PASSED' if success1 else '✗ FAILED'}")
    print(f"Strategy Analysis Test: {'✓ PASSED' if success2 else '✗ FAILED'}")
    
    if success1 and success2:
        print("\n🎉 All tests passed! The researcher engine is working correctly with OpenBB integration.")
    else:
        print("\n❌ Some tests failed. Please check the error messages above.")
    
    return success1 and success2


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)