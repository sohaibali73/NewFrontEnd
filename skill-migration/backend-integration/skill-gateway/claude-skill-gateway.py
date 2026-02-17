"""
Claude Skill Gateway

This module provides the gateway for executing Claude Developer Portal skills with backend enhancement.
It serves as the bridge between the frontend requests and the Claude API, adding validation, 
enhancement, and integration with existing backend tools.
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
from enum import Enum

from core.claude_engine import ClaudeAFLEngine
from core.tools import validate_afl, generate_afl_examples
from core.context_manager import build_optimized_context
from core.knowledge_base import search_knowledge_base
from core.dependencies import get_user_preferences

logger = logging.getLogger(__name__)


class SkillExecutionStatus(Enum):
    """Status of skill execution"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


@dataclass
class SkillExecutionResult:
    """Result of skill execution"""
    status: SkillExecutionStatus
    skill_name: str
    inputs: Dict[str, Any]
    outputs: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    execution_time: float = 0.0
    enhancements_applied: List[str] = None


class ClaudeSkillGateway:
    """Gateway for executing Claude Developer Portal skills with backend enhancement"""
    
    def __init__(self, claude_api_key: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the skill gateway
        
        Args:
            claude_api_key: Claude API key for skill execution
            config: Configuration for the gateway
        """
        self.claude_engine = ClaudeAFLEngine(claude_api_key)
        self.skill_cache = {}
        self.config = config or self._get_default_config()
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration for the gateway"""
        return {
            'max_execution_time': 30,  # seconds
            'max_memory_usage': 256,   # MB
            'token_limit': 4000,
            'enable_caching': True,
            'cache_ttl': 3600,  # 1 hour
            'retry_attempts': 3,
            'retry_delay': 1.0  # seconds
        }
    
    async def execute_skill(
        self, 
        skill_name: str, 
        inputs: Dict[str, Any], 
        user_context: Dict[str, Any]
    ) -> SkillExecutionResult:
        """
        Execute a skill with backend enhancement
        
        Args:
            skill_name: Name of the skill to execute
            inputs: Input parameters for the skill
            user_context: User-specific context and preferences
            
        Returns:
            SkillExecutionResult containing the result of execution
        """
        start_time = time.time()
        execution_id = f"{skill_name}_{int(start_time)}"
        
        logger.info(f"Starting skill execution: {execution_id}")
        
        try:
            # 1. Execute skill via Claude Developer Portal
            skill_output = await self._execute_claude_skill(skill_name, inputs, user_context)
            
            # 2. Enhance with backend capabilities
            enhanced_output = await self._enhance_with_backend(skill_name, skill_output, user_context)
            
            # 3. Validate and cache results
            validated_output = self._validate_skill_output(skill_name, enhanced_output)
            
            execution_time = time.time() - start_time
            
            result = SkillExecutionResult(
                status=SkillExecutionStatus.COMPLETED,
                skill_name=skill_name,
                inputs=inputs,
                outputs=validated_output,
                execution_time=execution_time,
                enhancements_applied=list(enhanced_output.keys()) if enhanced_output != skill_output else []
            )
            
            logger.info(f"Skill execution completed: {execution_id} in {execution_time:.2f}s")
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            error_result = SkillExecutionResult(
                status=SkillExecutionStatus.FAILED,
                skill_name=skill_name,
                inputs=inputs,
                error={
                    'type': type(e).__name__,
                    'message': str(e),
                    'execution_time': execution_time
                },
                execution_time=execution_time
            )
            
            logger.error(f"Skill execution failed: {execution_id} - {str(e)}")
            
            return error_result
    
    async def _execute_claude_skill(
        self, 
        skill_name: str, 
        inputs: Dict[str, Any],
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute skill via Claude API
        
        Args:
            skill_name: Name of the skill
            inputs: Input parameters
            user_context: User context for personalization
            
        Returns:
            Raw skill output from Claude API
        """
        # Check cache first
        cache_key = self._generate_cache_key(skill_name, inputs, user_context)
        if self.config['enable_caching'] and cache_key in self.skill_cache:
            cached_result = self.skill_cache[cache_key]
            if time.time() - cached_result['timestamp'] < self.config['cache_ttl']:
                logger.info(f"Returning cached result for skill: {skill_name}")
                return cached_result['result']
        
        # Build skill-specific context
        skill_context = self._build_skill_context(skill_name, inputs, user_context)
        
        # Execute skill with retry logic
        for attempt in range(self.config['retry_attempts']):
            try:
                response = await self.claude_engine.generate_response(
                    prompt=skill_context,
                    user_id=user_context.get('user_id', 'system'),
                    api_keys={"anthropic": "your-api-key"}  # Should be passed securely
                )
                
                skill_output = self._parse_skill_response(response)
                
                # Cache the result
                if self.config['enable_caching']:
                    self.skill_cache[cache_key] = {
                        'result': skill_output,
                        'timestamp': time.time()
                    }
                
                return skill_output
                
            except Exception as e:
                if attempt == self.config['retry_attempts'] - 1:
                    raise e
                
                logger.warning(f"Skill execution attempt {attempt + 1} failed: {str(e)}")
                await asyncio.sleep(self.config['retry_delay'] * (2 ** attempt))  # Exponential backoff
    
    def _build_skill_context(self, skill_name: str, inputs: Dict[str, Any], user_context: Dict[str, Any]) -> str:
        """
        Build context for skill execution
        
        Args:
            skill_name: Name of the skill
            inputs: Input parameters
            user_context: User context
            
        Returns:
            Formatted context string for Claude API
        """
        # Get skill-specific system prompt
        system_prompt = self._get_skill_system_prompt(skill_name)
        
        # Add user context
        user_context_str = self._format_user_context(user_context)
        
        # Add skill-specific instructions
        skill_instructions = self._get_skill_instructions(skill_name)
        
        # Combine context
        context = f"""
{system_prompt}

USER CONTEXT:
{user_context_str}

SKILL INSTRUCTIONS:
{skill_instructions}

INPUT PARAMETERS:
{self._format_inputs(inputs)}

IMPORTANT: Follow the skill instructions exactly and return the output in the specified format.
        """.strip()
        
        return context
    
    def _get_skill_system_prompt(self, skill_name: str) -> str:
        """Get system prompt for specific skill"""
        
        skill_prompts = {
            "AFL_Code_Generator": """
You are an expert AFL developer. Generate high-quality AmiBroker AFL code from natural language descriptions.
Follow these guidelines:
1. Use proper Param/Optimize structure for all configurable variables
2. Include appropriate comments explaining the strategy logic
3. Follow best practices for AFL development
4. Ensure code is optimized for performance
5. Include error handling where appropriate
6. Use meaningful variable names that don't conflict with AFL functions
7. Return output in the specified JSON format with all required fields
            """,
            "AFL_Code_Analyzer": """
You are an expert AFL code reviewer. Analyze the provided AFL code for:
1. Syntax errors and compilation issues
2. Logic errors and potential bugs
3. Performance bottlenecks and optimization opportunities
4. Best practices violations
5. Security and stability issues
Provide specific, actionable feedback with examples where possible.
Return output in the specified JSON format with all required fields.
            """,
            "Strategy_Designer": """
You are a professional trading strategy designer. Design complete trading strategies that include:
1. Clear strategy logic and rationale
2. Well-defined entry and exit criteria
3. Appropriate risk management rules
4. Realistic performance expectations
5. Implementation roadmap
Consider market conditions, risk tolerance, and practical constraints.
Return output in the specified JSON format with all required fields.
            """
        }
        
        return skill_prompts.get(skill_name, "Execute the skill according to its defined purpose.")
    
    def _format_user_context(self, user_context: Dict[str, Any]) -> str:
        """Format user context for skill execution"""
        
        context_parts = []
        
        if user_context.get('user_id'):
            context_parts.append(f"User ID: {user_context['user_id']}")
        
        if user_context.get('preferences'):
            preferences = user_context['preferences']
            if preferences.get('trading_style'):
                context_parts.append(f"Trading Style: {preferences['trading_style']}")
            if preferences.get('preferred_indicators'):
                context_parts.append(f"Preferred Indicators: {', '.join(preferences['preferred_indicators'])}")
            if preferences.get('risk_tolerance'):
                context_parts.append(f"Risk Tolerance: {preferences['risk_tolerance']}")
        
        if user_context.get('knowledge_base'):
            context_parts.append("Knowledge Base: Available")
        
        return '\n'.join(context_parts) if context_parts else "No specific user context available."
    
    def _get_skill_instructions(self, skill_name: str) -> str:
        """Get skill-specific instructions"""
        
        instructions = {
            "AFL_Code_Generator": """
Generate AFL code based on the description provided. Include:
1. Proper Param/Optimize structure for all parameters
2. Clear variable naming that avoids AFL function conflicts
3. Explanatory comments for complex logic
4. Appropriate error handling
5. Optimization-ready structure

Required output fields: afl_code, explanation, validation
Optional output fields: parameters, complexity_score
            """,
            "AFL_Code_Analyzer": """
Analyze the provided AFL code and provide:
1. List of detected issues with severity levels
2. Specific suggestions for improvement
3. Auto-fixed version if possible
4. Performance analysis
5. Best practices score

Required output fields: issues, suggestions, best_practices_score
Optional output fields: fixed_code, performance_analysis
            """,
            "Strategy_Designer": """
Design a complete trading strategy based on the requirements. Include:
1. Strategy overview and logic
2. Entry and exit criteria
3. Position sizing rules
4. Risk management approach
5. Implementation plan

Required output fields: strategy_design, components, implementation_plan, risk_assessment
            """
        }
        
        return instructions.get(skill_name, "Follow standard skill execution procedures.")
    
    def _format_inputs(self, inputs: Dict[str, Any]) -> str:
        """Format input parameters for context"""
        
        formatted_inputs = []
        for key, value in inputs.items():
            formatted_inputs.append(f"{key}: {value}")
        
        return '\n'.join(formatted_inputs)
    
    def _parse_skill_response(self, response: str) -> Dict[str, Any]:
        """
        Parse skill response from Claude API
        
        Args:
            response: Raw response from Claude API
            
        Returns:
            Parsed skill output
        """
        # This would parse the JSON response from Claude
        # For now, return a placeholder structure
        # In real implementation, this would parse the actual JSON response
        
        return {
            "afl_code": response,  # Placeholder
            "explanation": "Generated explanation",
            "validation": {"syntax_valid": True},
            "parameters": []
        }
    
    async def _enhance_with_backend(
        self, 
        skill_name: str, 
        skill_output: Dict[str, Any], 
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enhance skill output with backend capabilities
        
        Args:
            skill_name: Name of the skill
            skill_output: Raw skill output
            user_context: User context
            
        Returns:
            Enhanced skill output
        """
        
        enhancements = {}
        
        # AFL Code Generator enhancements
        if skill_name == "AFL_Code_Generator":
            if 'afl_code' in skill_output:
                # Validate code
                validation = validate_afl(skill_output['afl_code'])
                enhancements['validation'] = validation
                
                # Generate additional examples
                examples = generate_afl_examples(skill_output['afl_code'])
                enhancements['additional_examples'] = examples
                
                # Add KB context
                kb_context = await self._search_kb_for_skill(
                    skill_name, 
                    skill_output.get('description', ''), 
                    user_context.get('user_id')
                )
                enhancements['kb_context'] = kb_context
        
        # AFL Code Analyzer enhancements
        elif skill_name == "AFL_Code_Analyzer":
            if 'afl_code' in skill_output:
                # Additional validation
                detailed_validation = validate_afl(skill_output['afl_code'], detailed=True)
                enhancements['detailed_validation'] = detailed_validation
                
                # Performance analysis
                performance_analysis = self._analyze_afl_performance(skill_output['afl_code'])
                enhancements['performance_analysis'] = performance_analysis
        
        # Strategy Designer enhancements
        elif skill_name == "Strategy_Designer":
            # Risk assessment enhancement
            if 'strategy_design' in skill_output:
                risk_enhancement = self._enhance_risk_assessment(
                    skill_output['strategy_design'], 
                    user_context
                )
                enhancements['enhanced_risk_assessment'] = risk_enhancement
        
        return {**skill_output, **enhancements}
    
    async def _search_kb_for_skill(
        self, 
        skill_name: str, 
        query: str, 
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Search knowledge base with skill context"""
        
        try:
            # Use existing KB search
            kb_results = search_knowledge_base(query, category="afl", user_id=user_id)
            
            # Add skill-specific context
            skill_context = {
                "skill_name": skill_name,
                "kb_results": kb_results,
                "user_preferences": await get_user_preferences(user_id) if user_id else {},
                "related_skills": self._get_related_skills(skill_name)
            }
            
            return skill_context
            
        except Exception as e:
            logger.error(f"Error searching knowledge base for skill {skill_name}: {str(e)}")
            return {"error": str(e)}
    
    def _analyze_afl_performance(self, afl_code: str) -> Dict[str, Any]:
        """Analyze AFL code performance characteristics"""
        
        analysis = {
            "bottlenecks": [],
            "optimization_opportunities": [],
            "estimated_complexity": "medium",
            "memory_usage": "low",
            "execution_speed": "medium"
        }
        
        # Simple performance analysis
        if "MA(" in afl_code and afl_code.count("MA(") > 5:
            analysis["bottlenecks"].append("Multiple MA calculations may be inefficient")
            analysis["optimization_opportunities"].append("Consider caching MA values")
        
        if "Cross(" in afl_code:
            analysis["optimization_opportunities"].append("Cross function is efficient for crossovers")
        
        if "for " in afl_code.lower():
            analysis["bottlenecks"].append("For loops can be slow in AFL")
            analysis["optimization_opportunities"].append("Consider vectorized operations")
        
        return analysis
    
    def _enhance_risk_assessment(self, strategy_design: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance risk assessment based on user context"""
        
        risk_assessment = strategy_design.get('risk_management', {})
        
        # Adjust based on user risk tolerance
        user_risk_tolerance = user_context.get('preferences', {}).get('risk_tolerance', 'moderate')
        
        if user_risk_tolerance == 'conservative':
            risk_assessment['suggested_position_size'] = '1-2%'
            risk_assessment['max_drawdown_target'] = '5-10%'
        elif user_risk_tolerance == 'aggressive':
            risk_assessment['suggested_position_size'] = '5-10%'
            risk_assessment['max_drawdown_target'] = '20-30%'
        else:  # moderate
            risk_assessment['suggested_position_size'] = '2-5%'
            risk_assessment['max_drawdown_target'] = '10-20%'
        
        return risk_assessment
    
    def _get_related_skills(self, skill_name: str) -> List[str]:
        """Get related skills for the given skill"""
        
        related_skills = {
            "AFL_Code_Generator": ["AFL_Code_Analyzer", "Strategy_Designer"],
            "AFL_Code_Analyzer": ["AFL_Code_Generator", "Performance_Analyzer"],
            "Strategy_Designer": ["AFL_Code_Generator", "Parameter_Optimizer"]
        }
        
        return related_skills.get(skill_name, [])
    
    def _validate_skill_output(
        self, 
        skill_name: str, 
        skill_output: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate skill output against schema"""
        
        validation_rules = {
            "AFL_Code_Generator": self._validate_afl_code_generator_output,
            "AFL_Code_Analyzer": self._validate_afl_code_analyzer_output,
            "Strategy_Designer": self._validate_strategy_designer_output
        }
        
        validator = validation_rules.get(skill_name)
        if validator:
            return validator(skill_output)
        
        return skill_output
    
    def _validate_afl_code_generator_output(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """Validate AFL Code Generator output"""
        
        errors = []
        
        if not output.get('afl_code'):
            errors.append("Missing required afl_code field")
        
        if not output.get('explanation'):
            errors.append("Missing required explanation field")
        
        if not output.get('validation'):
            errors.append("Missing required validation field")
        
        if errors:
            output['validation_errors'] = errors
        
        return output
    
    def _validate_afl_code_analyzer_output(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """Validate AFL Code Analyzer output"""
        
        errors = []
        
        if not output.get('issues'):
            errors.append("Missing required issues field")
        
        if not output.get('suggestions'):
            errors.append("Missing required suggestions field")
        
        if not output.get('best_practices_score'):
            errors.append("Missing required best_practices_score field")
        
        if errors:
            output['validation_errors'] = errors
        
        return output
    
    def _validate_strategy_designer_output(self, output: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Strategy Designer output"""
        
        errors = []
        
        required_fields = ['strategy_design', 'components', 'implementation_plan', 'risk_assessment']
        
        for field in required_fields:
            if not output.get(field):
                errors.append(f"Missing required {field} field")
        
        if errors:
            output['validation_errors'] = errors
        
        return output
    
    def _generate_cache_key(self, skill_name: str, inputs: Dict[str, Any], user_context: Dict[str, Any]) -> str:
        """Generate cache key for skill execution"""
        
        import hashlib
        import json
        
        cache_data = {
            'skill_name': skill_name,
            'inputs': inputs,
            'user_id': user_context.get('user_id')
        }
        
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    async def execute_skill_batch(
        self, 
        skills: List[Dict[str, Any]], 
        user_context: Dict[str, Any]
    ) -> List[SkillExecutionResult]:
        """
        Execute multiple skills in batch
        
        Args:
            skills: List of skill execution requests
            user_context: User context
            
        Returns:
            List of skill execution results
        """
        
        tasks = []
        for skill_request in skills:
            task = self.execute_skill(
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