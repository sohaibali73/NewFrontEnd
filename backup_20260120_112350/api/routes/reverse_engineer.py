"""Reverse engineering workflow routes."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from api.dependencies import get_current_user_id, get_user_api_keys
from core.claude_engine import ClaudeAFLEngine, StrategyType
from core.researcher import StrategyResearcher
from core.prompts import get_reverse_engineer_prompt, get_schematic_prompt
from db.supabase_client import get_supabase
import json

router = APIRouter(prefix="/reverse-engineer", tags=["Reverse Engineer"])

class StartRequest(BaseModel):
    query: str

class ContinueRequest(BaseModel):
    strategy_id: str
    message: str

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

    # Create conversation
    conv_result = db.table("conversations").insert({
        "user_id": user_id,
        "title": f"RE: {data.query[:40]}...",
        "conversation_type": "reverse_engineer",
        "phase": "clarification",
    }).execute()
    conversation_id = conv_result.data[0]["id"]

    # Create strategy record
    strategy_result = db.table("strategies").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "name": data.query[:100],
        "source_query": data.query,
        "status": "clarification",
    }).execute()
    strategy_id = strategy_result.data[0]["id"]

    # Update conversation with strategy_id
    db.table("conversations").update({
        "strategy_id": strategy_id
    }).eq("id", conversation_id).execute()

    # Generate clarification questions
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        prompt = get_reverse_engineer_prompt(data.query, "", "clarification")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        clarification = response.content[0].text

        # Save messages
        db.table("messages").insert([
            {"conversation_id": conversation_id, "role": "user", "content": data.query},
            {"conversation_id": conversation_id, "role": "assistant", "content": clarification},
        ]).execute()

        return {
            "strategy_id": strategy_id,
            "conversation_id": conversation_id,
            "phase": "clarification",
            "response": clarification,
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

    # Get strategy
    strategy = db.table("strategies").select("*").eq("id", data.strategy_id).execute()
    if not strategy.data:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy_data = strategy.data[0]
    conversation_id = strategy_data["conversation_id"]

    # Save user message
    db.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": data.message,
    }).execute()

    # Get history
    history = db.table("messages").select("role, content").eq(
        "conversation_id", conversation_id
    ).order("created_at").execute()

    messages = [{"role": m["role"], "content": m["content"]} for m in history.data]

    # Generate response
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        phase = strategy_data["status"]
        prompt = get_reverse_engineer_prompt(
            strategy_data["source_query"],
            strategy_data.get("research_data", {}).get("synthesis", ""),
            phase
        )

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            system=prompt,
            messages=messages,
        )

        assistant_response = response.content[0].text

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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    research = strategy_data.get("research_data", {})

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        prompt = f"""{get_schematic_prompt()}

Strategy: {strategy_data['source_query']}
Research: {research.get('synthesis', '')}
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

        # Build prompt from all gathered data
        prompt = f"""Generate complete AFL code for this strategy:

Name: {strategy_data['name']}
Description: {strategy_data.get('description', '')}
Research: {strategy_data.get('research_data', {}).get('synthesis', '')}
Schematic: {json.dumps(strategy_data.get('schematic_data', {}), indent=2)}

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
