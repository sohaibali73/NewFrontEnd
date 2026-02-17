"""
Enhanced API Routes for Skill Integration

This module provides FastAPI routes for skill execution, orchestration, and management.
It integrates with the Claude Skill Gateway and provides endpoints for both individual
skill execution and multi-skill workflows.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import logging

from core.dependencies import get_current_user_id, get_user_api_keys
from backend_integration.skill_gateway.claude_skill_gateway import (
    ClaudeSkillGateway, 
    SkillExecutionResult, 
    SkillExecutionStatus
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/skills", tags=["Skills"])

# Pydantic models for API requests and responses

class SkillExecutionRequest(BaseModel):
    """Request model for skill execution"""
    skill_name: str = Field(..., description="Name of the skill to execute")
    inputs: Dict[str, Any] = Field(..., description="Input parameters for the skill")
    user_context: Optional[Dict[str, Any]] = Field(None, description="User context and preferences")


class MultiSkillOrchestrationRequest(BaseModel):
    """Request model for multi-skill orchestration"""
    skills: List[Dict[str, Any]] = Field(..., description="List of skills to execute")
    execution_strategy: str = Field(
        "sequential", 
        description="Execution strategy: sequential, parallel, or conditional"
    )
    user_context: Optional[Dict[str, Any]] = Field(None, description="User context and preferences")


class SkillExecutionResponse(BaseModel):
    """Response model for skill execution"""
    success: bool
    result: Optional[SkillExecutionResult] = None
    error: Optional[Dict[str, Any]] = None
    execution_time: float = 0.0
    enhancements_applied: List[str] = []


class MultiSkillOrchestrationResponse(BaseModel):
    """Response model for multi-skill orchestration"""
    success: bool
    results: List[SkillExecutionResult] = []
    orchestration_strategy: str
    total_execution_time: float = 0.0


class AvailableSkill(BaseModel):
    """Model for available skills"""
    name: str
    description: str
    category: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    triggers: List[str]
    dependencies: List[str]


# Global skill gateway instance
_skill_gateway: Optional[ClaudeSkillGateway] = None


def get_skill_gateway() -> ClaudeSkillGateway:
    """Get the skill gateway instance"""
    global _skill_gateway
    if _skill_gateway is None:
        # Initialize with API key from environment or config
        import os
        api_key = os.getenv("CLAUDE_API_KEY", "your-api-key-here")
        _skill_gateway = ClaudeSkillGateway(api_key)
    return _skill_gateway


@router.post("/execute", response_model=SkillExecutionResponse)
async def execute_skill(
    request: SkillExecutionRequest,
    user_id: str = Depends(get_current_user_id),
    api_keys: dict = Depends(get_user_api_keys),
    skill_gateway: ClaudeSkillGateway = Depends(get_skill_gateway)
):
    """
    Execute a single skill with backend enhancement
    
    This endpoint executes a Claude Developer Portal skill with additional
    backend validation, enhancement, and integration with existing tools.
    """
    
    try:
        # Build user context
        user_context = {
            "user_id": user_id,
            "preferences": await get_user_preferences(user_id),
            "api_keys": api_keys
        }
        
        # Execute skill
        result = await skill_gateway.execute_skill(
            skill_name=request.skill_name,
            inputs=request.inputs,
            user_context=user_context
        )
        
        # Return appropriate response based on result status
        if result.status == SkillExecutionStatus.COMPLETED:
            return SkillExecutionResponse(
                success=True,
                result=result,
                execution_time=result.execution_time,
                enhancements_applied=result.enhancements_applied or []
            )
        else:
            return SkillExecutionResponse(
                success=False,
                error=result.error,
                execution_time=result.execution_time
            )
            
    except Exception as e:
        logger.error(f"Error executing skill {request.skill_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orchestrate", response_model=MultiSkillOrchestrationResponse)
async def orchestrate_skills(
    request: MultiSkillOrchestrationRequest,
    user_id: str = Depends(get_current_user_id),
    api_keys: dict = Depends(get_user_api_keys),
    skill_gateway: ClaudeSkillGateway = Depends(get_skill_gateway)
):
    """
    Orchestrate multiple skills in sequence or parallel
    
    This endpoint allows executing multiple skills with different strategies:
    - sequential: Execute skills one after another
    - parallel: Execute all skills concurrently
    - conditional: Execute skills based on conditions
    """
    
    try:
        # Build user context
        user_context = {
            "user_id": user_id,
            "preferences": await get_user_preferences(user_id),
            "api_keys": api_keys
        }
        
        start_time = time.time()
        
        # Execute skills based on orchestration strategy
        if request.execution_strategy == "sequential":
            results = await execute_skills_sequentially(
                request.skills, user_context, skill_gateway
            )
        elif request.execution_strategy == "parallel":
            results = await execute_skills_parallel(
                request.skills, user_context, skill_gateway
            )
        elif request.execution_strategy == "conditional":
            results = await execute_skills_conditional(
                request.skills, user_context, skill_gateway
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid execution strategy: {request.execution_strategy}"
            )
        
        total_execution_time = time.time() - start_time
        
        return MultiSkillOrchestrationResponse(
            success=True,
            results=results,
            orchestration_strategy=request.execution_strategy,
            total_execution_time=total_execution_time
        )
        
    except Exception as e:
        logger.error(f"Error orchestrating skills: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available", response_model=List[AvailableSkill])
async def get_available_skills():
    """
    Get list of available skills
    
    Returns metadata about all available skills including their input/output schemas,
    triggers, and dependencies.
    """
    
    available_skills = [
        AvailableSkill(
            name="AFL_Code_Generator",
            description="Generates optimized AFL code from natural language descriptions",
            category="Code Generation",
            input_schema={
                "type": "object",
                "properties": {
                    "description": {"type": "string", "minLength": 10},
                    "strategy_type": {"type": "string", "enum": ["standalone", "composite", "indicator", "scan"]},
                    "complexity": {"type": "string", "enum": ["basic", "intermediate", "advanced"]},
                    "include_optimization": {"type": "boolean", "default": False}
                },
                "required": ["description", "strategy_type", "complexity"]
            },
            output_schema={
                "type": "object",
                "properties": {
                    "afl_code": {"type": "string"},
                    "explanation": {"type": "string"},
                    "validation": {"type": "object"},
                    "parameters": {"type": "array", "items": {"type": "object"}}
                },
                "required": ["afl_code", "explanation", "validation"]
            },
            triggers=["generate afl code", "create trading strategy", "build indicator"],
            dependencies=["Syntax Keywords", "Common Mistakes", "Param Optimize Standard"]
        ),
        AvailableSkill(
            name="AFL_Code_Analyzer",
            description="Analyzes AFL code for issues and improvement opportunities",
            category="Code Analysis",
            input_schema={
                "type": "object",
                "properties": {
                    "afl_code": {"type": "string", "minLength": 10},
                    "analysis_type": {"type": "string", "enum": ["syntax", "logic", "performance", "best_practices", "all"]},
                    "context": {"type": "string", "enum": ["backtest", "exploration", "chart", "scan"]}
                },
                "required": ["afl_code"]
            },
            output_schema={
                "type": "object",
                "properties": {
                    "issues": {"type": "array", "items": {"type": "object"}},
                    "suggestions": {"type": "array", "items": {"type": "object"}},
                    "best_practices_score": {"type": "number", "minimum": 0, "maximum": 100}
                },
                "required": ["issues", "suggestions", "best_practices_score"]
            },
            triggers=["analyze this code", "check for mistakes", "review strategy"],
            dependencies=["Common Mistakes", "Best Practices"]
        ),
        AvailableSkill(
            name="Strategy_Designer",
            description="Designs complete trading strategies with proper structure and risk management",
            category="Strategy Design",
            input_schema={
                "type": "object",
                "properties": {
                    "strategy_type": {"type": "string", "enum": ["trend_following", "mean_reversion", "breakout", "range_trading", "multi_strategy"]},
                    "market": {"type": "string", "enum": ["stocks", "forex", "crypto", "commodities", "indices"]},
                    "timeframe": {"type": "string", "enum": ["intraday", "daily", "weekly", "monthly"]},
                    "risk_tolerance": {"type": "string", "enum": ["conservative", "moderate", "aggressive"]},
                    "capital": {"type": "number", "minimum": 1000}
                },
                "required": ["strategy_type", "market", "timeframe", "risk_tolerance"]
            },
            output_schema={
                "type": "object",
                "properties": {
                    "strategy_design": {"type": "object"},
                    "components": {"type": "array", "items": {"type": "object"}},
                    "implementation_plan": {"type": "object"},
                    "risk_assessment": {"type": "object"}
                },
                "required": ["strategy_design", "components", "implementation_plan", "risk_assessment"]
            },
            triggers=["design a strategy", "build a system", "create trading algorithm"],
            dependencies=["AFL_Code_Generator", "Risk Management"]
        )
    ]
    
    return available_skills


@router.get("/status/{skill_name}")
async def get_skill_status(
    skill_name: str,
    skill_gateway: ClaudeSkillGateway = Depends(get_skill_gateway)
):
    """
    Get status information for a specific skill
    
    Returns information about skill availability, performance metrics,
    and configuration.
    """
    
    # This would typically check skill availability, performance metrics, etc.
    # For now, return basic status
    
    return {
        "skill_name": skill_name,
        "status": "available",
        "config": skill_gateway.config,
        "cache_size": len(skill_gateway.skill_cache),
        "last_updated": "2024-01-01T00:00:00Z"
    }


@router.delete("/cache/clear")
async def clear_skill_cache(
    skill_gateway: ClaudeSkillGateway = Depends(get_skill_gateway)
):
    """
    Clear the skill execution cache
    
    Useful for debugging or when skill definitions have changed.
    """
    
    cache_size = len(skill_gateway.skill_cache)
    skill_gateway.skill_cache.clear()
    
    return {
        "message": "Skill cache cleared successfully",
        "cleared_entries": cache_size
    }


# Helper functions for skill orchestration

async def execute_skills_sequentially(
    skills: List[Dict[str, Any]], 
    user_context: Dict[str, Any], 
    skill_gateway: ClaudeSkillGateway
) -> List[SkillExecutionResult]:
    """Execute skills sequentially"""
    
    results = []
    
    for skill_request in skills:
        result = await skill_gateway.execute_skill(
            skill_request['skill_name'],
            skill_request['inputs'],
            user_context
        )
        results.append(result)
        
        # If a skill fails, stop execution (configurable behavior)
        if result.status == SkillExecutionStatus.FAILED:
            logger.warning(f"Skill {skill_request['skill_name']} failed, stopping sequential execution")
            break
    
    return results


async def execute_skills_parallel(
    skills: List[Dict[str, Any]], 
    user_context: Dict[str, Any], 
    skill_gateway: ClaudeSkillGateway
) -> List[SkillExecutionResult]:
    """Execute skills in parallel"""
    
    tasks = []
    for skill_request in skills:
        task = skill_gateway.execute_skill(
            skill_request['skill_name'],
            skill_request['inputs'],
            user_context
        )
        tasks.append(task)
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Convert exceptions to failed results
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            failed_result = SkillExecutionResult(
                status=SkillExecutionStatus.FAILED,
                skill_name=skills[i]['skill_name'],
                inputs=skills[i]['inputs'],
                error={
                    'type': type(result).__name__,
                    'message': str(result)
                }
            )
            processed_results.append(failed_result)
        else:
            processed_results.append(result)
    
    return processed_results


async def execute_skills_conditional(
    skills: List[Dict[str, Any]], 
    user_context: Dict[str, Any], 
    skill_gateway: ClaudeSkillGateway
) -> List[SkillExecutionResult]:
    """Execute skills conditionally based on previous results"""
    
    results = []
    
    for skill_request in skills:
        # Check conditions before executing
        if 'conditions' in skill_request:
            should_execute = await evaluate_conditions(
                skill_request['conditions'], 
                results, 
                user_context
            )
            
            if not should_execute:
                logger.info(f"Skipping skill {skill_request['skill_name']} due to conditions")
                continue
        
        # Execute skill
        result = await skill_gateway.execute_skill(
            skill_request['skill_name'],
            skill_request['inputs'],
            user_context
        )
        results.append(result)
        
        # If a skill fails and is marked as critical, stop execution
        if (result.status == SkillExecutionStatus.FAILED and 
            skill_request.get('critical', False)):
            logger.warning(f"Critical skill {skill_request['skill_name']} failed, stopping execution")
            break
    
    return results


async def evaluate_conditions(
    conditions: List[Dict[str, Any]], 
    previous_results: List[SkillExecutionResult], 
    user_context: Dict[str, Any]
) -> bool:
    """Evaluate conditions for conditional skill execution"""
    
    for condition in conditions:
        condition_type = condition.get('type')
        
        if condition_type == 'skill_success':
            skill_name = condition.get('skill_name')
            required_success = condition.get('required', True)
            
            # Find the skill result
            skill_result = next(
                (r for r in previous_results if r.skill_name == skill_name), 
                None
            )
            
            if skill_result is None:
                return False
            
            if required_success and skill_result.status != SkillExecutionStatus.COMPLETED:
                return False
            elif not required_success and skill_result.status == SkillExecutionStatus.COMPLETED:
                return False
        
        elif condition_type == 'user_preference':
            preference_key = condition.get('key')
            expected_value = condition.get('value')
            
            user_preferences = user_context.get('preferences', {})
            actual_value = user_preferences.get(preference_key)
            
            if actual_value != expected_value:
                return False
        
        # Add more condition types as needed
    
    return True


# Background task for skill monitoring and cleanup

@router.post("/monitor/start")
async def start_skill_monitoring(
    background_tasks: BackgroundTasks,
    skill_gateway: ClaudeSkillGateway = Depends(get_skill_gateway)
):
    """Start background monitoring of skill execution"""
    
    background_tasks.add_task(monitor_skill_performance, skill_gateway)
    
    return {"message": "Skill monitoring started"}


async def monitor_skill_performance(skill_gateway: ClaudeSkillGateway):
    """Monitor skill performance and clean up cache"""
    
    while True:
        try:
            # Clean up old cache entries
            current_time = time.time()
            cache_ttl = skill_gateway.config['cache_ttl']
            
            expired_keys = [
                key for key, value in skill_gateway.skill_cache.items()
                if current_time - value['timestamp'] > cache_ttl
            ]
            
            for key in expired_keys:
                del skill_gateway.skill_cache[key]
            
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
            
            # Sleep for monitoring interval
            await asyncio.sleep(300)  # Check every 5 minutes
            
        except Exception as e:
            logger.error(f"Error in skill monitoring: {str(e)}")
            await asyncio.sleep(60)  # Wait 1 minute before retrying


# Import time for the time functions used above
import time
import asyncio