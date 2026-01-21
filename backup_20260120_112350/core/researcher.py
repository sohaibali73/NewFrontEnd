import os
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

class StrategyResearcher:
    def __init__(self):
        api_key = os.environ.get("TAVILY_API_KEY")
        self.client = TavilyClient(api_key=api_key)

    def research_strategy(self, query: str):
        """
        Performs a deep search for strategy logic and technical specs.
        """
        search_query = f"technical trading rules and indicators for {query} strategy AFL"

        # We use 'advanced' search for better quality quantitative data
        search_result = self.client.search(query=search_query, search_depth="advanced")

        # Combine the results into a single context string for Claude
        context = ""
        for result in search_result['results']:
            context += f"Source: {result['url']}\nContent: {result['content']}\n\n"

        return context