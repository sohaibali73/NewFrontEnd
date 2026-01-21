"""Reverse engineering workflow routes."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, field_validator
import logging

from api.dependencies import get_current_user_id, get_user_api_keys
from core.claude_engine import ClaudeAFLEngine, StrategyType
from core.researcher import StrategyResearcher
from core.prompts import (
    get_clarification_prompt,
    get_research_synthesis_prompt,
    get_schematic_generation_prompt,
    get_findings_summary_prompt,
    get_schematic_prompt,
    get_reverse_engineer_prompt,
)
from db.supabase_client import get_supabase
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reverse-engineer", tags=["Reverse Engineer"])

class StartRequest(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None  # Alternative field name
    description: Optional[str] = None  # Alternative field name from frontend
    
    @field_validator('query', 'message', 'description', mode='before')
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v
    
    def get_query(self) -> str:
        """Get the query string from any of the accepted fields."""
        result = self.query or self.message or self.description or ""
        if not result:
            raise ValueError("One of 'query', 'message', or 'description' field is required")
        return result
    
    class Config:
        extra = "allow"

class ContinueRequest(BaseModel):
    strategy_id: Optional[str] = None
    strategyId: Optional[str] = None  # camelCase alternative
    id: Optional[str] = None  # Another alternative
    message: Optional[str] = None
    content: Optional[str] = None  # Alternative field name
    
    def get_strategy_id(self) -> str:
        """Get strategy ID from any of the accepted fields."""
        result = self.strategy_id or self.strategyId or self.id
        if not result:
            raise ValueError("One of 'strategy_id', 'strategyId', or 'id' is required")
        return result
    
    def get_message(self) -> str:
        """Get message from any of the accepted fields."""
        result = self.message or self.content or ""
        if not result:
            raise ValueError("One of 'message' or 'content' is required")
        return result
    
    class Config:
        extra = "allow"

@router.post("/start")
async def start_reverse_engineer(
        data: StartRequest,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Start a new reverse engineering session."""
    db = get_supabase()

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    # Get query from either field
    try:
        query = data.get_query()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Create conversation (only use standard columns)
    conv_result = db.table("conversations").insert({
        "user_id": user_id,
        "title": f"RE: {query[:40]}..." if len(query) > 40 else f"RE: {query}",
        "conversation_type": "reverse_engineer",
    }).execute()
    conversation_id = conv_result.data[0]["id"]

    # Create strategy record
    strategy_result = db.table("strategies").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "name": query[:100] if len(query) > 100 else query,
        "source_query": query,
        "status": "clarification",
    }).execute()
    strategy_id = strategy_result.data[0]["id"]

    # Generate clarification questions
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        # Use clarification-specific prompt
        prompt = get_clarification_prompt(query)

        # Enable web search tool for real-time research
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 5
            }]
        )

        # Extract text content from response
        clarification = ""
        for block in response.content:
            if hasattr(block, 'text'):
                clarification += block.text

        # Save messages
        db.table("messages").insert([
            {"conversation_id": conversation_id, "role": "user", "content": query},
            {"conversation_id": conversation_id, "role": "assistant", "content": clarification},
        ]).execute()

        return {
            "strategy_id": strategy_id,
            "id": strategy_id,  # Alias for frontend compatibility
            "conversation_id": conversation_id,
            "phase": "clarification",
            "response": clarification,
            "research": clarification,  # Alias for frontend compatibility
            "analysis": clarification,  # Alias for frontend compatibility
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/continue")
async def continue_conversation(
        data: ContinueRequest,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Continue reverse engineering conversation."""
    db = get_supabase()

    try:
        # Get values from request (supporting multiple field names)
        try:
            strategy_id = data.get_strategy_id()
            message = data.get_message()
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        
        # Get strategy
        logger.info(f"Looking up strategy: {strategy_id}")
        strategy = db.table("strategies").select("*").eq("id", strategy_id).execute()
        if not strategy.data:
            raise HTTPException(status_code=404, detail="Strategy not found")

        strategy_data = strategy.data[0]
        conversation_id = strategy_data.get("conversation_id")
        
        if not conversation_id:
            logger.error(f"No conversation_id for strategy {strategy_id}")
            raise HTTPException(status_code=400, detail="Strategy has no conversation")

        logger.info(f"Saving user message to conversation: {conversation_id}")
        # Save user message
        db.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "user",
            "content": message,
        }).execute()

        # Get history
        logger.info("Fetching conversation history")
        history = db.table("messages").select("role, content").eq(
            "conversation_id", conversation_id
        ).order("created_at").execute()

        messages = [{"role": m["role"], "content": m["content"]} for m in history.data]
        logger.info(f"Found {len(messages)} messages in history")

        # Generate response
        import anthropic
        
        if not api_keys.get("claude"):
            raise HTTPException(status_code=400, detail="Claude API key not configured")
            
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        phase = strategy_data.get("status", "clarification")
        # Safely get research_data - handle None case
        research_data = strategy_data.get("research_data") or {}
        synthesis = research_data.get("synthesis", "") if isinstance(research_data, dict) else ""
        
        # Conduct live research if in clarification phase and no research yet
        research_context = ""
        if phase == "clarification" and not synthesis:
            logger.info("Conducting live web research...")
            try:
                researcher = StrategyResearcher(tavily_api_key=api_keys.get("tavily"))
                research_context = researcher.research_strategy(strategy_data.get("source_query", ""))
                logger.info(f"Research completed: {len(research_context)} chars")
            except Exception as e:
                logger.warning(f"Research failed: {e}")
                research_context = ""
        
        # Combine synthesis with live research
        full_context = synthesis
        if research_context:
            full_context = f"{synthesis}\n\n## Live Research Results:\n{research_context}" if synthesis else research_context

        logger.info(f"Generating response for phase: {phase}")
        prompt = get_reverse_engineer_prompt(
            strategy_data.get("source_query", ""),
            full_context,
            phase
        )

        # Enable web search tool for real-time research
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            system=prompt,
            messages=messages,
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 5
            }]
        )

        # Extract text content from response
        assistant_response = ""
        for block in response.content:
            if hasattr(block, 'text'):
                assistant_response += block.text
        logger.info(f"Got response from Claude: {len(assistant_response)} chars")

        # Save response
        db.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": assistant_response,
        }).execute()

        return {
            "strategy_id": data.strategy_id,
            "phase": phase,
            "response": assistant_response,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in continue_conversation: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

@router.post("/research/{strategy_id}")
async def conduct_research(
        strategy_id: str,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Conduct web research on the strategy."""
    db = get_supabase()

    # Get strategy
    strategy = db.table("strategies").select("*").eq("id", strategy_id).execute()
    if not strategy.data:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy_data = strategy.data[0]

    # Conduct research
    research_context = ""
    if api_keys.get("tavily"):
        try:
            researcher = StrategyResearcher()
            researcher.client.api_key = api_keys["tavily"]
            research_context = researcher.research_strategy(strategy_data["source_query"])
        except Exception as e:
            research_context = f"Research unavailable: {str(e)}"

    # Synthesize with Claude
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        synthesis_prompt = f"""Synthesize this research about the trading strategy: {strategy_data['source_query']}

Web Research Results:
{research_context}

Provide:
1. Strategy Overview - What does this strategy do?
2. Key Components - Indicators, signals, filters
3. Estimated Parameters - With confidence levels
4. Implementation Notes - For AFL coding
"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": synthesis_prompt}],
        )

        synthesis = response.content[0].text

        # Update strategy
        db.table("strategies").update({
            "status": "findings",
            "research_data": {
                "web_context": research_context[:5000],
                "synthesis": synthesis,
            },
        }).eq("id", strategy_id).execute()

        # Save as message
        db.table("messages").insert({
            "conversation_id": strategy_data["conversation_id"],
            "role": "assistant",
            "content": f"## Research Findings\n\n{synthesis}",
        }).execute()

        return {
            "strategy_id": strategy_id,
            "phase": "findings",
            "synthesis": synthesis,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schematic/{strategy_id}")
async def generate_schematic(
        strategy_id: str,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Generate strategy schematic."""
    db = get_supabase()

    strategy = db.table("strategies").select("*").eq("id", strategy_id).execute()
    if not strategy.data:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy_data = strategy.data[0]
    # Safely handle None research_data
    research = strategy_data.get("research_data") or {}
    synthesis = research.get("synthesis", "") if isinstance(research, dict) else ""

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        prompt = f"""{get_schematic_prompt()}

Strategy: {strategy_data.get('source_query', '')}
Research: {synthesis}
"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text

        # Parse JSON from response
        try:
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0]
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0]

            schematic = json.loads(raw)
        except:
            schematic = {"raw": raw, "error": "Could not parse JSON"}

        # Update strategy
        db.table("strategies").update({
            "status": "schematic",
            "schematic_data": schematic,
        }).eq("id", strategy_id).execute()

        return {
            "strategy_id": strategy_id,
            "phase": "schematic",
            "schematic": schematic,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-code/{strategy_id}")
async def generate_code(
        strategy_id: str,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Generate AFL code from strategy."""
    db = get_supabase()

    strategy = db.table("strategies").select("*").eq("id", strategy_id).execute()
    if not strategy.data:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy_data = strategy.data[0]

    try:
        engine = ClaudeAFLEngine(api_key=api_keys["claude"])

        # Safely handle None values for research_data and schematic_data
        research_data = strategy_data.get("research_data") or {}
        synthesis = research_data.get("synthesis", "") if isinstance(research_data, dict) else ""
        
        schematic_data = strategy_data.get("schematic_data") or {}
        schematic_json = json.dumps(schematic_data, indent=2) if isinstance(schematic_data, dict) else "{}"

        # Build prompt from all gathered data
        prompt = f"""Generate complete AFL code for this strategy:

Name: {strategy_data.get('name', 'Unknown Strategy')}
Description: {strategy_data.get('description', '')}
Research: {synthesis}
Schematic: {schematic_json}

Generate production-ready, complete AFL code.
"""

        result = engine.generate_afl(
            request=prompt,
            strategy_type=StrategyType.STANDALONE,
        )

        afl_code = result.get("afl_code", "")

        # Update strategy
        db.table("strategies").update({
            "status": "coding",
            "afl_code": afl_code,
        }).eq("id", strategy_id).execute()

        # Save to afl_codes
        db.table("afl_codes").insert({
            "user_id": user_id,
            "strategy_id": strategy_id,
            "name": strategy_data["name"],
            "description": strategy_data.get("description", ""),
            "code": afl_code,
            "quality_score": result.get("stats", {}).get("quality_score", 0),
        }).execute()

        # Save as message
        db.table("messages").insert({
            "conversation_id": strategy_data["conversation_id"],
            "role": "assistant",
            "content": f"## Generated AFL Code\n\n```afl\n{afl_code}\n```",
        }).execute()

        return {
            "strategy_id": strategy_id,
            "phase": "coding",
            "afl_code": afl_code,
            "code": afl_code,  # Alias for frontend compatibility
            "stats": result.get("stats", {}),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/strategy/{strategy_id}")
async def get_strategy(
        strategy_id: str,
        user_id: str = Depends(get_current_user_id),
):
    """Get strategy details."""
    db = get_supabase()

    result = db.table("strategies").select("*").eq("id", strategy_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Strategy not found")

    return result.data[0]