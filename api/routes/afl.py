"""AFL code generation routes."""

from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic import Field
import json
import logging

from api.dependencies import get_current_user_id, get_user_api_keys
from core.claude_engine import ClaudeAFLEngine, StrategyType, BacktestSettings
from core.context_manager import build_optimized_context
from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/afl", tags=["AFL Generation"])


class GenerationPhase(str, Enum):
    """Phases of AFL generation workflow."""
    INITIAL = "initial"
    AWAITING_ANSWERS = "awaiting_answers"
    GENERATING = "generating"
    COMPLETE = "complete"


class GenerateRequest(BaseModel):
    """Request model for AFL generation."""
    prompt: str = Field(..., min_length=10, max_length=1000, description="Strategy description")
    strategy_type: str = Field("standalone", description="Strategy type: standalone or composite")
    settings: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None
    answers: Optional[Dict[str, str]] = None  # {"strategy_type": "standalone", "trade_timing": "close"}
    stream: Optional[bool] = Field(False, description="Enable streaming responses")


class OptimizeRequest(BaseModel):
    """Request model for AFL optimization."""
    code: str


class DebugRequest(BaseModel):
    """Request model for AFL debugging."""
    code: str
    error_message: Optional[str] = ""


class ExplainRequest(BaseModel):
    """Request model for AFL explanation."""
    code: str


class ValidateRequest(BaseModel):
    """Request model for AFL validation."""
    code: str


@router.post("/generate")
async def generate_afl(
        request: GenerateRequest,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Generate AFL code with optional mandatory question flow."""

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    db = get_supabase()

    # Determine if we're using the conversation workflow or simple generation
    if request.conversation_id or request.answers:
        # Conversation-based workflow with mandatory questions
        return await _generate_with_conversation(request, user_id, api_keys, db)
    else:
        # Simple one-shot generation
        return await _generate_simple(request, user_id, api_keys, db)


async def _generate_simple(
        request: GenerateRequest,
        user_id: str,
        api_keys: dict,
        db,
) -> Dict[str, Any]:
    """Simple one-shot AFL generation without conversation workflow."""
    try:
        # Use condensed prompts for performance (default: True)
        engine = ClaudeAFLEngine(api_key=api_keys["claude"], use_condensed_prompts=True)

        # Parse strategy type
        strat_type = StrategyType.STANDALONE
        if request.strategy_type.lower() == "composite":
            strat_type = StrategyType.COMPOSITE

        # Parse backtest settings if provided
        settings = None
        if request.settings:
            settings = BacktestSettings(**request.settings)

        # Check if streaming is requested
        if request.stream:
            # Return streaming response
            async def generate_stream():
                try:
                    generator = engine.generate_afl(
                        request=request.prompt,
                        strategy_type=strat_type,
                        settings=settings,
                        stream=True,
                    )
                    
                    for chunk in generator:
                        yield f"data: {json.dumps(chunk)}\n\n"
                        
                        # Save to database when complete
                        if chunk.get("type") == "complete":
                            try:
                                db.table("afl_codes").insert({
                                    "user_id": user_id,
                                    "name": request.prompt[:100],
                                    "description": request.prompt,
                                    "code": chunk.get("afl_code", ""),
                                    "strategy_type": request.strategy_type,
                                    "quality_score": chunk.get("stats", {}).get("quality_score", 0),
                                }).execute()
                            except Exception as db_error:
                                import logging
                                logging.warning(f"Failed to save AFL code to database: {db_error}")
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                }
            )

        # Non-streaming generation
        result = engine.generate_afl(
            request=request.prompt,
            strategy_type=strat_type,
            settings=settings,
            stream=False,
        )

        afl_code = result.get("afl_code", "")

        # Save to database (with error handling for missing table)
        try:
            db.table("afl_codes").insert({
                "user_id": user_id,
                "name": request.prompt[:100],
                "description": request.prompt,
                "code": afl_code,
                "strategy_type": request.strategy_type,
                "quality_score": result.get("stats", {}).get("quality_score", 0),
            }).execute()
        except Exception as db_error:
            # Log but don't fail if DB save fails
            logger.warning(f"Failed to save AFL code to database: {db_error}")

        # Save to history (auto-save on generation)
        try:
            db.table("afl_history").insert({
                "user_id": user_id,
                "strategy_description": request.prompt,
                "generated_code": afl_code,
                "strategy_type": request.strategy_type,
                "timestamp": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save AFL history: {e}")
            # Don't fail the request if history save fails

        # Return response with 'code' field for frontend compatibility
        return {
            "code": afl_code,
            "afl_code": afl_code,  # Keep for backward compatibility
            "explanation": result.get("explanation", ""),
            "stats": result.get("stats", {}),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _generate_with_conversation(
        request: GenerateRequest,
        user_id: str,
        api_keys: dict,
        db,
) -> Dict[str, Any]:
    """AFL generation with conversation workflow and mandatory questions."""

    # Get or create conversation
    if request.conversation_id:
        conv = db.table("conversations").select("*").eq("id", request.conversation_id).execute()
        conversation = conv.data[0] if conv.data else None
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        phase = conversation.get("phase", GenerationPhase.INITIAL)
    else:
        # Create new conversation
        conv_result = db.table("conversations").insert({
            "user_id": user_id,
            "title": request.prompt[:50],
            "conversation_type": "afl_generation",
            "phase": GenerationPhase.INITIAL,
        }).execute()
        conversation = conv_result.data[0]
        request.conversation_id = conversation["id"]
        phase = GenerationPhase.INITIAL

    try:
        # Use condensed prompts for performance
        engine = ClaudeAFLEngine(api_key=api_keys["claude"], use_condensed_prompts=True)

        # PHASE 1: Ask mandatory questions
        if phase == GenerationPhase.INITIAL:
            questions_prompt = f"""The user wants to create an AFL strategy: "{request.prompt}"

⚠️ CRITICAL: Before writing ANY code, you MUST ask these two questions:

1. "Do you want this to be a **standalone strategy** in one AFL file, or part of a **composite** system?"
   - Standalone = Complete strategy with all sections (buy/sell, plotting, exploration, backtest settings)
   - Composite = Module to be included in a master template (only strategy logic, no plotting/settings)

2. "Do you want to trade on the **OPEN** or the **CLOSE** of the bar?"
   - CLOSE = SetTradeDelays(0, 0, 0, 0)
   - OPEN = SetTradeDelays(1, 1, 1, 1)

Please ask these questions clearly and wait for the user's response. Do NOT generate any code yet."""

            import anthropic
            client = anthropic.Anthropic(api_key=api_keys["claude"])

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": questions_prompt}],
            )

            questions = response.content[0].text

            # Save messages
            db.table("messages").insert([
                {"conversation_id": request.conversation_id, "role": "user", "content": request.prompt},
                {"conversation_id": request.conversation_id, "role": "assistant", "content": questions},
            ]).execute()

            # Update phase
            db.table("conversations").update({
                "phase": GenerationPhase.AWAITING_ANSWERS
            }).eq("id", request.conversation_id).execute()

            return {
                "conversation_id": request.conversation_id,
                "phase": GenerationPhase.AWAITING_ANSWERS,
                "response": questions,
                "needs_answers": True,
            }

        # PHASE 2: Generate code with answers
        elif phase == GenerationPhase.AWAITING_ANSWERS and request.answers:
            # Validate answers
            if not request.answers.get("strategy_type") or not request.answers.get("trade_timing"):
                raise HTTPException(
                    status_code=400,
                    detail="Missing required answers: strategy_type and trade_timing"
                )

            # Map answers
            strategy_type = StrategyType.STANDALONE if "standalone" in request.answers[
                "strategy_type"].lower() else StrategyType.COMPOSITE

            if "close" in request.answers["trade_timing"].lower():
                trade_delays = (0, 0, 0, 0)
            else:
                trade_delays = (1, 1, 1, 1)

            settings = BacktestSettings(trade_delays=trade_delays)
            if request.settings:
                # Merge with provided settings
                for key, value in request.settings.items():
                    if hasattr(settings, key):
                        setattr(settings, key, value)

            # Get conversation history with optimization
            from core.context_manager import get_recent_messages
            conversation_history = get_recent_messages(request.conversation_id)

            # Generate with optimized context
            result = engine.generate_afl(
                request=request.prompt,
                strategy_type=strategy_type,
                settings=settings,
                conversation_history=conversation_history,
                user_answers=request.answers,
                stream=False,  # Conversation mode uses non-streaming for now
            )

            afl_code = result.get("afl_code", "")

            # Save to database
            code_result = db.table("afl_codes").insert({
                "user_id": user_id,
                "conversation_id": request.conversation_id,
                "name": request.prompt[:100],
                "description": request.prompt,
                "code": afl_code,
                "strategy_type": strategy_type.value,
                "quality_score": result.get("stats", {}).get("quality_score", 0),
            }).execute()

            # Save assistant message
            db.table("messages").insert({
                "conversation_id": request.conversation_id,
                "role": "assistant",
                "content": f"## Generated AFL Code\n\n```afl\n{afl_code}\n```",
            }).execute()

            # Update phase
            db.table("conversations").update({
                "phase": GenerationPhase.COMPLETE
            }).eq("id", request.conversation_id).execute()

            return {
                "conversation_id": request.conversation_id,
                "phase": GenerationPhase.COMPLETE,
                "afl_code": afl_code,
                "code_id": code_result.data[0]["id"],
                "stats": result.get("stats", {}),
            }

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid phase transition. Current phase: {phase}, Has answers: {bool(request.answers)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def optimize_afl(
        request: OptimizeRequest,
        api_keys: dict = Depends(get_user_api_keys),
):
    """Optimize existing AFL code."""

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    try:
        # Use condensed prompts for faster optimization
        engine = ClaudeAFLEngine(api_key=api_keys["claude"], use_condensed_prompts=True)
        optimized = engine.optimize_code(request.code)

        return {"optimized_code": optimized}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debug")
async def debug_afl(
        request: DebugRequest,
        api_keys: dict = Depends(get_user_api_keys),
):
    """Debug AFL code and fix errors."""

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    try:
        # Use condensed prompts for faster debugging
        engine = ClaudeAFLEngine(api_key=api_keys["claude"], use_condensed_prompts=True)
        debugged = engine.debug_code(request.code, request.error_message)

        return {"debugged_code": debugged}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain")
async def explain_afl(
        request: ExplainRequest,
        api_keys: dict = Depends(get_user_api_keys),
):
    """Explain AFL code in plain English."""

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    try:
        # Use condensed prompts for faster explanations
        engine = ClaudeAFLEngine(api_key=api_keys["claude"], use_condensed_prompts=True)
        explanation = engine.explain_code(request.code)

        return {"explanation": explanation}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_afl(request: ValidateRequest):
    """Validate AFL code syntax without API call."""

    engine = ClaudeAFLEngine()  # No API key needed for validation
    result = engine.validate_code(request.code)

    return result


@router.get("/codes")
async def list_codes(
        user_id: str = Depends(get_current_user_id),
        limit: int = 50,
):
    """List user's saved AFL codes."""
    db = get_supabase()

    result = db.table("afl_codes").select(
        "id, name, description, strategy_type, quality_score, created_at"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()

    return result.data


@router.get("/codes/{code_id}")
async def get_code(
        code_id: str,
        user_id: str = Depends(get_current_user_id),
):
    """Get a specific AFL code."""
    db = get_supabase()

    result = db.table("afl_codes").select("*").eq("id", code_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Code not found")

    return result.data[0]


@router.delete("/codes/{code_id}")
async def delete_code(
        code_id: str,
        user_id: str = Depends(get_current_user_id),
):
    """Delete an AFL code."""
    db = get_supabase()

    # Verify ownership
    existing = db.table("afl_codes").select("user_id").eq("id", code_id).execute()
    if not existing.data or existing.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Code not found")

    db.table("afl_codes").delete().eq("id", code_id).execute()

    return {"status": "deleted"}


# ===== AFL History Endpoints =====

class AFLHistoryEntry(BaseModel):
    """Request model for AFL history entry."""
    strategy_description: str
    generated_code: str
    strategy_type: str
    timestamp: Optional[str] = None


@router.post("/history")
async def save_afl_history(
    entry: AFLHistoryEntry,
    user_id: str = Depends(get_current_user_id),
):
    """Save AFL generation to history."""
    db = get_supabase()
    
    result = db.table("afl_history").insert({
        "user_id": user_id,
        "strategy_description": entry.strategy_description,
        "generated_code": entry.generated_code,
        "strategy_type": entry.strategy_type,
        "timestamp": entry.timestamp or datetime.utcnow().isoformat(),
    }).execute()
    
    return result.data[0]


@router.get("/history")
async def get_afl_history(
    user_id: str = Depends(get_current_user_id),
    limit: int = 50,
):
    """Get AFL generation history for user."""
    db = get_supabase()
    
    result = db.table("afl_history").select("*").eq(
        "user_id", user_id
    ).order("timestamp", desc=True).limit(limit).execute()
    
    return result.data


@router.delete("/history/{history_id}")
async def delete_afl_history(
    history_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete an AFL history entry."""
    db = get_supabase()
    
    # Verify ownership
    entry = db.table("afl_history").select("user_id").eq("id", history_id).execute()
    
    if not entry.data or entry.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="History entry not found")
    
    db.table("afl_history").delete().eq("id", history_id).execute()
    
    return {"status": "deleted", "id": history_id}
