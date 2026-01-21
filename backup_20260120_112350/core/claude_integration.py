"""
Enhanced Claude Integration with MCP
====================================
Integrates MCP server with Claude SDK for advanced context
"""

import anthropic
import json
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class EnhancedClaudeClient:
    """Claude client with MCP integration."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514", mcp_client: Optional[Any] = None):
        """Initialize Claude client with MCP support.

        Args:
            api_key: Anthropic API key
            model: Claude model to use
            mcp_client: Optional MCP client for KB access
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model
        self.mcp_client = mcp_client

    async def generate_with_kb_context(
            self,
            prompt: str,
            kb_query: Optional[str] = None,
            include_kb_context: bool = True,
            max_tokens: int = 4096,
    ) -> str:
        """Generate response with KB context through MCP.

        Args:
            prompt: User prompt
            kb_query: Optional query to search KB
            include_kb_context: Whether to include KB context
            max_tokens: Max tokens in response

        Returns:
            Generated text
        """
        try:
            # Build context from KB if MCP client available
            kb_context = ""
            if include_kb_context and self.mcp_client:
                search_query = kb_query or prompt
                kb_results = await self.mcp_client.search_kb(search_query, top_k=5)

                kb_context = self._format_kb_context(kb_results)

            # Build system prompt with KB context
            system_prompt = f"""You are Analyst by Potomac, an expert AFL code generator for AmiBroker.
You have access to a knowledge base with AFL templates, strategies, and best practices.

{kb_context}

Provide professional, production-ready code with proper error handling and validation."""

            # Call Claude with context
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Generation error: {e}")
            raise

    def _format_kb_context(self, kb_results: List[Dict]) -> str:
        """Format KB results for inclusion in prompt."""
        if not kb_results:
            return ""

        context = "## Knowledge Base References:\n\n"
        for result in kb_results[:3]:
            context += f"- {result.get('document', 'Unknown')}: {result.get('text', '')[:200]}...\n"

        return context

    async def analyze_code_with_context(
            self,
            code: str,
            analysis_type: str = "general",
    ) -> Dict[str, Any]:
        """Analyze AFL code with KB context.

        Args:
            code: AFL code to analyze
            analysis_type: Type of analysis (general, optimization, validation)

        Returns:
            Analysis results
        """
        try:
            # Get relevant templates from KB
            kb_context = ""
            if self.mcp_client:
                templates = await self.mcp_client.call_tool(
                    "get_afl_templates",
                    count=3
                )
                kb_context = f"Reference templates:\n{templates}"

            prompt = f"""Analyze this AFL code for {analysis_type}:

```afl
{code}
    response = await self.generate_with_kb_context(
        prompt,
        kb_query="AFL code validation best practices",
        max_tokens=2000,
    )

    return {
            "analysis_type": analysis_type,
        "code_length": len(code),
        "analysis": response,
    }

except Exception as e:
    logger.error(f"Analysis error: {e}")
    raise
