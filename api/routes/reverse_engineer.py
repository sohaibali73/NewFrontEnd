# -*- coding: utf-8 -*-
"""Reverse engineering workflow routes."""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
import logging
import json

from api.dependencies import get_current_user_id, get_user_api_keys
from core.claude_engine import ClaudeAFLEngine, StrategyType
from core.researcher import StrategyResearcher
from core.context_manager import truncate_context, get_recent_messages, CONDENSED_CONTEXT_LIMITS
from core.prompts.condensed_prompts import get_condensed_clarification_prompt, get_condensed_reverse_engineer_prompt
from core.prompts import (
    get_clarification_prompt,
    get_research_synthesis_prompt,
    get_schematic_generation_prompt,
    get_findings_summary_prompt,
    get_schematic_prompt,
    get_reverse_engineer_prompt,
)
from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reverse-engineer", tags=["Reverse Engineer"])

class StartRequest(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None
    description: Optional[str] = None
    
    @field_validator('query', 'message', 'description', mode='before')
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v
    
    def get_query(self) -> str:
        result = self.query or self.message or self.description or ""
        if not result:
            raise ValueError("One of 'query', 'message', or 'description' field is required")
        return result
    
    class Config:
        extra = "allow"

class ContinueRequest(BaseModel):
    strategy_id: Optional[str] = None
    strategyId: Optional[str] = None
    id: Optional[str] = None
    message: Optional[str] = None
    content: Optional[str] = None
    
    def get_strategy_id(self) -> str:
        result = self.strategy_id or self.strategyId or self.id
        if not result:
            raise ValueError("One of 'strategy_id', 'strategyId', or 'id' is required")
        return result
    
    def get_message(self) -> str:
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

    try:
        query = data.get_query()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    conv_result = db.table("conversations").insert({
        "user_id": user_id,
        "title": f"RE: {query[:40]}..." if len(query) > 40 else f"RE: {query}",
        "conversation_type": "reverse_engineer",
    }).execute()
    conversation_id = conv_result.data[0]["id"]

    strategy_result = db.table("strategies").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "name": query[:100] if len(query) > 100 else query,
        "source_query": query,
        "status": "clarification",
    }).execute()
    strategy_id = strategy_result.data[0]["id"]

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        prompt = get_condensed_clarification_prompt(query)

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 3
            }]
        )

        clarification = ""
        for block in response.content:
            if hasattr(block, 'text'):
                clarification += block.text

        db.table("messages").insert([
            {"conversation_id": conversation_id, "role": "user", "content": query},
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

    try:
        try:
            strategy_id = data.get_strategy_id()
            message = data.get_message()
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        
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
        db.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "user",
            "content": message,
        }).execute()

        logger.info("Fetching conversation history")
        messages = get_recent_messages(conversation_id, limit=10)
        logger.info(f"Retrieved {len(messages)} recent messages")

        import anthropic
        
        if not api_keys.get("claude"):
            raise HTTPException(status_code=400, detail="Claude API key not configured")
            
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        phase = strategy_data.get("status", "clarification")
        research_data = strategy_data.get("research_data") or {}
        synthesis = research_data.get("synthesis", "") if isinstance(research_data, dict) else ""
        
        research_context = ""
        if phase == "clarification" and not synthesis:
            logger.info("Conducting live web research...")
            try:
                researcher = StrategyResearcher(tavily_api_key=api_keys.get("tavily"))
                research_context = researcher.research_strategy(strategy_data.get("source_query", ""))
                logger.info(f"Research completed: {len(research_context)} chars")
                research_context = truncate_context(research_context, max_tokens=CONDENSED_CONTEXT_LIMITS["research_context_max_tokens"])
            except Exception as e:
                logger.warning(f"Research failed: {e}")
                research_context = ""
        
        full_context = synthesis
        if research_context:
            full_context = f"{synthesis}\n\n## Live Research Results:\n{research_context}" if synthesis else research_context
        
        full_context = truncate_context(full_context, max_tokens=CONDENSED_CONTEXT_LIMITS["total_context_budget"] // 2)

        logger.info(f"Generating response for phase: {phase}")
        prompt = get_condensed_reverse_engineer_prompt(phase)
        
        system_prompt = f'''{prompt}

Strategy: {strategy_data.get("source_query", "")}

Context: {full_context[:2000] if full_context else "No context yet"}'''

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,
            system=system_prompt,
            messages=messages,
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 3
            }]
        )

        assistant_response = ""
        for block in response.content:
            if hasattr(block, 'text'):
                assistant_response += block.text
        logger.info(f"Got response from Claude: {len(assistant_response)} chars")

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

    strategy = db.table("strategies").select("*").eq("id", strategy_id).execute()
    if not strategy.data:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy_data = strategy.data[0]

    research_context = ""
    if api_keys.get("tavily"):
        try:
            researcher = StrategyResearcher()
            researcher.client.api_key = api_keys["tavily"]
            research_context = researcher.research_strategy(strategy_data["source_query"])
            research_context = truncate_context(research_context, max_tokens=CONDENSED_CONTEXT_LIMITS["research_context_max_tokens"])
        except Exception as e:
            research_context = f"Research unavailable: {str(e)}"

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        synthesis_prompt = f"""Synthesize research for: {strategy_data['source_query']}

Research: {research_context[:3000]}

Provide: Strategy overview, key components, parameters with confidence, implementation notes."""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2500,
            messages=[{"role": "user", "content": synthesis_prompt}],
        )

        synthesis = response.content[0].text

        db.table("strategies").update({
            "status": "findings",
            "research_data": {
                "web_context": research_context[:5000],
                "synthesis": synthesis,
            },
        }).eq("id", strategy_id).execute()

        db.table("messages").insert({
            "conversation_id": strategy_data["conversation_id"],
            "role": "assistant",
            "content": f"## Research Findings\n\n{synthesis}",
        }).execute()

        return {
            "strategy_id": strategy_id,
            "phase": "findings",
            "response": synthesis,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_mermaid_from_schematic(schematic: dict) -> str:
    """Generate a Mermaid flowchart diagram from a strategy schematic."""
    try:
        strategy_name = schematic.get("strategy_name", "Trading Strategy")
        components = schematic.get("components", [])
        connections = schematic.get("connections", [])
        entry_logic = schematic.get("entry_logic", {})
        exit_logic = schematic.get("exit_logic", {})
        
        mermaid = ["flowchart TD"]
        
        indicators = [c for c in components if c.get("type") == "indicator"]
        entries = [c for c in components if c.get("type") == "entry"]
        exits = [c for c in components if c.get("type") == "exit"]
        filters = [c for c in components if c.get("type") == "filter"]
        
        if indicators:
            mermaid.append("    subgraph Indicators")
            for ind in indicators:
                ind_id = ind.get("id", "ind")
                ind_name = ind.get("name", "Indicator")
                params = ind.get("parameters", [])
                param_str = ", ".join([f"{p.get('name', '')}: {p.get('default', '')}" for p in params[:2]])
                mermaid.append(f'        {ind_id}["{ind_name}<br/>{param_str}"]')
            mermaid.append("    end")
        
        mermaid.append("    subgraph Entry_Logic[Entry Logic]")
        entry_long = entry_logic.get("long", "Long Entry Condition")
        mermaid.append(f'        ENTRY_COND{{"Entry Condition<br/>{entry_long[:50]}..."}}')
        mermaid.append('        BUY[("BUY SIGNAL")]')
        mermaid.append("    end")
        
        mermaid.append("    subgraph Exit_Logic[Exit Logic]")
        exit_long = exit_logic.get("long_exit", "Exit Condition")
        mermaid.append(f'        EXIT_COND{{"Exit Condition<br/>{exit_long[:50]}..."}}')
        mermaid.append('        SELL[("SELL SIGNAL")]')
        mermaid.append("    end")
        
        for ind in indicators:
            mermaid.append(f"    {ind.get('id', 'ind')} --> ENTRY_COND")
        
        mermaid.append("    ENTRY_COND -->|Yes| BUY")
        mermaid.append("    BUY --> EXIT_COND")
        mermaid.append("    EXIT_COND -->|Yes| SELL")
        
        for conn in connections:
            from_id = conn.get("from", "")
            to_id = conn.get("to", "")
            label = conn.get("label", "")
            if from_id and to_id:
                mermaid.append(f"    {from_id} -->|{label}| {to_id}")
        
        mermaid.append("")
        mermaid.append("    style BUY fill:#22C55E,color:#fff,stroke:#16A34A")
        mermaid.append("    style SELL fill:#EF4444,color:#fff,stroke:#DC2626")
        for ind in indicators:
            mermaid.append(f"    style {ind.get('id', 'ind')} fill:#FEC00F,color:#000,stroke:#EAB308")
        
        return "\n".join(mermaid)
    except Exception as e:
        logger.warning(f"Failed to generate Mermaid diagram: {e}")
        return ""


FALLBACK_MERMAID = '''flowchart TD
    subgraph Indicators["Indicators"]
        IND1["Technical Indicator"]
    end
    
    subgraph Entry_Logic["Entry Logic"]
        ENTRY{{"Entry Condition"}}
        BUY(("BUY"))
    end
    
    subgraph Exit_Logic["Exit Logic"]
        EXIT{{"Exit Condition"}}
        SELL(("SELL"))
    end
    
    IND1 --> ENTRY
    ENTRY -->|Signal| BUY
    BUY --> EXIT
    EXIT -->|Signal| SELL
    
    style BUY fill:#22C55E,color:#fff,stroke:#16A34A
    style SELL fill:#EF4444,color:#fff,stroke:#DC2626
    style IND1 fill:#FEC00F,color:#000'''

SIMPLE_FALLBACK_MERMAID = '''flowchart TD
    A["Strategy Analysis"] --> B{{"Analysis"}}
    B --> C(("BUY"))
    B --> D(("SELL"))
    style C fill:#22C55E,color:#fff
    style D fill:#EF4444,color:#fff'''


@router.post("/schematic/{strategy_id}")
async def generate_schematic(
        strategy_id: str,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Generate strategy schematic with Mermaid diagram."""
    db = get_supabase()

    strategy = db.table("strategies").select("*").eq("id", strategy_id).execute()
    if not strategy.data:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy_data = strategy.data[0]
    research = strategy_data.get("research_data") or {}
    synthesis = research.get("synthesis", "") if isinstance(research, dict) else ""
    
    if len(synthesis) > 2000:
        synthesis = synthesis[:2000] + "..."

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        strategy_name = strategy_data.get('source_query', 'Trading Strategy')
        prompt = f"""Create a visual schematic for this trading strategy.

Strategy: {strategy_name}
Research Summary: {synthesis[:1500] if synthesis else 'No research available'}

Generate a Mermaid flowchart diagram that shows:
1. Entry indicators and conditions
2. Buy signal generation
3. Exit indicators and conditions  
4. Sell signal generation

Use this exact format:

```mermaid
flowchart TD
    subgraph Indicators
        IND1["Indicator 1"]
        IND2["Indicator 2"]
    end
    
    subgraph Entry_Logic["Entry Logic"]
        ENTRY{{"Entry Condition"}}
        BUY(("BUY"))
    end
    
    subgraph Exit_Logic["Exit Logic"]
        EXIT{{"Exit Condition"}}
        SELL(("SELL"))
    end
    
    IND1 --> ENTRY
    IND2 --> ENTRY
    ENTRY -->|Yes| BUY
    BUY --> EXIT
    EXIT -->|Yes| SELL
    
    style BUY fill:#22C55E,color:#fff
    style SELL fill:#EF4444,color:#fff
```

Also provide a brief JSON summary:
```json
{{
    "strategy_name": "{strategy_name[:50]}",
    "strategy_type": "momentum/mean_reversion/trend_following",
    "timeframe": "daily/weekly/intraday",
    "indicators": ["list of indicators"],
    "entry_logic": "brief description",
    "exit_logic": "brief description"
}}
```
"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text

        schematic = {}
        mermaid_diagram = ""
        
        try:
            if "```mermaid" in raw:
                mermaid_parts = raw.split("```mermaid")
                if len(mermaid_parts) > 1:
                    mermaid_diagram = mermaid_parts[1].split("```")[0].strip()
                    mermaid_diagram = mermaid_diagram.replace("\\n", "\n")
            
            if "```json" in raw:
                json_part = raw.split("```json")[1].split("```")[0]
                schematic = json.loads(json_part)
            else:
                schematic = {
                    "strategy_name": strategy_name,
                    "strategy_type": "unknown",
                    "timeframe": "unknown"
                }
            
            if not mermaid_diagram:
                mermaid_diagram = FALLBACK_MERMAID
                
        except Exception as parse_error:
            logger.warning(f"Schematic parse error: {parse_error}")
            schematic = {"strategy_name": strategy_name, "error": "Could not parse response"}
            mermaid_diagram = SIMPLE_FALLBACK_MERMAID

        schematic["mermaid_diagram"] = mermaid_diagram

        db.table("strategies").update({
            "status": "schematic",
            "schematic_data": schematic,
        }).eq("id", strategy_id).execute()

        schematic_message = f"## Strategy Schematic\n\n"
        schematic_message += f"```mermaid\n{mermaid_diagram}\n```\n\n"
        schematic_message += f"**Strategy:** {schematic.get('strategy_name', 'Unknown')}\n"
        schematic_message += f"**Type:** {schematic.get('strategy_type', 'Unknown')}\n"
        schematic_message += f"**Timeframe:** {schematic.get('timeframe', 'Unknown')}\n"
        
        if strategy_data.get("conversation_id"):
            db.table("messages").insert({
                "conversation_id": strategy_data["conversation_id"],
                "role": "assistant",
                "content": schematic_message,
            }).execute()

        return {
            "strategy_id": strategy_id,
            "phase": "schematic",
            "schematic": schematic,
            "mermaid_diagram": mermaid_diagram,
            "response": schematic_message,
        }

    except Exception as e:
        logger.error(f"Schematic generation error: {e}")
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
        engine = ClaudeAFLEngine(api_key=api_keys["claude"], use_condensed_prompts=True)

        research_data = strategy_data.get("research_data") or {}
        synthesis = research_data.get("synthesis", "") if isinstance(research_data, dict) else ""
        
        schematic_data = strategy_data.get("schematic_data") or {}
        schematic_json = json.dumps(schematic_data, indent=2) if isinstance(schematic_data, dict) else "{}"

        synthesis = truncate_context(synthesis, max_tokens=1000)
        schematic_json = truncate_context(schematic_json, max_tokens=800)

        prompt = f"""Generate AFL code:

Name: {strategy_data.get('name', 'Unknown Strategy')}
Research: {synthesis}
Schematic: {schematic_json}

Production-ready AFL code with all sections."""

        result = engine.generate_afl(
            request=prompt,
            strategy_type=StrategyType.STANDALONE,
        )

        afl_code = result.get("afl_code", "")

        db.table("strategies").update({
            "status": "coding",
            "afl_code": afl_code,
        }).eq("id", strategy_id).execute()

        db.table("afl_codes").insert({
            "user_id": user_id,
            "strategy_id": strategy_id,
            "name": strategy_data["name"],
            "description": strategy_data.get("description", ""),
            "code": afl_code,
            "quality_score": result.get("stats", {}).get("quality_score", 0),
        }).execute()

        db.table("messages").insert({
            "conversation_id": strategy_data["conversation_id"],
            "role": "assistant",
            "content": f"## Generated AFL Code\n\n```afl\n{afl_code}\n```",
        }).execute()

        try:
            db.table("reverse_engineer_history").insert({
                "user_id": user_id,
                "strategy_name": strategy_data.get("name", "")[:100],
                "research_summary": synthesis,
                "generated_code": afl_code,
                "schematic": schematic_data,
                "timestamp": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save reverse engineer history: {e}")

        return {
            "strategy_id": strategy_id,
            "phase": "coding",
            "code": afl_code,
            "response": synthesis,
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


class ReverseEngineerHistoryEntry(BaseModel):
    """Request model for reverse engineer history entry."""
    strategy_name: str
    research_summary: str
    generated_code: str
    schematic: Optional[dict] = None
    timestamp: Optional[str] = None


@router.post("/history")
async def save_reverse_engineer_history(
    entry: ReverseEngineerHistoryEntry,
    user_id: str = Depends(get_current_user_id),
):
    """Save reverse engineering session to history."""
    db = get_supabase()
    
    result = db.table("reverse_engineer_history").insert({
        "user_id": user_id,
        "strategy_name": entry.strategy_name,
        "research_summary": entry.research_summary,
        "generated_code": entry.generated_code,
        "schematic": entry.schematic,
        "timestamp": entry.timestamp or datetime.utcnow().isoformat(),
    }).execute()
    
    return result.data[0]


@router.get("/history")
async def get_reverse_engineer_history(
    user_id: str = Depends(get_current_user_id),
    limit: int = 50,
):
    """Get reverse engineering history for user."""
    db = get_supabase()
    
    result = db.table("reverse_engineer_history").select("*").eq(
        "user_id", user_id
    ).order("timestamp", desc=True).limit(limit).execute()
    
    return result.data


@router.delete("/history/{history_id}")
async def delete_reverse_engineer_history(
    history_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a reverse engineer history entry."""
    db = get_supabase()
    
    entry = db.table("reverse_engineer_history").select("user_id").eq("id", history_id).execute()
    
    if not entry.data or entry.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="History entry not found")
    
    db.table("reverse_engineer_history").delete().eq("id", history_id).execute()
    
    return {"status": "deleted", "id": history_id}
