"""
Claude AFL Engine - Core AFL code generation using Claude API.
"""

import re
import time
import logging
from enum import Enum
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass

import anthropic

from core.prompts import (
    get_base_prompt,
    get_chat_prompt,
    get_generate_prompt,
    get_debug_prompt,
    get_explain_prompt,
    get_optimize_prompt,
    FUNCTION_REFERENCE,
    RESERVED_KEYWORDS,
)

logger = logging.getLogger(__name__)

# Default model - consistent across the application
DEFAULT_MODEL = "claude-sonnet-4-20250514"


class OperationMode(Enum):
    """Operation modes for the AFL engine."""
    GENERATE = "generate"
    DEBUG = "debug"
    OPTIMIZE = "optimize"
    EXPLAIN = "explain"
    CHAT = "chat"


class StrategyType(Enum):
    """Types of AFL strategies."""
    STANDALONE = "standalone"
    COMPOSITE = "composite"


@dataclass
class BacktestSettings:
    """Backtest configuration settings."""
    initial_equity: float = 100000
    position_size: str = "-10"
    position_size_type: str = "spsPercentOfEquity"
    max_positions: int = 10
    commission: float = 0.001
    trade_delays: Tuple[int, int, int, int] = (0, 0, 0, 0)
    margin_requirement: float = 100

    def to_afl(self) -> str:
        """Convert settings to AFL code."""
        return f'''// Backtest Settings
SetOption("InitialEquity", {self.initial_equity});
SetOption("MaxOpenPositions", {self.max_positions});
SetOption("CommissionMode", 1);
SetOption("CommissionAmount", {self.commission});
SetOption("MarginRequirement", {self.margin_requirement});
SetTradeDelays({self.trade_delays[0]}, {self.trade_delays[1]}, {self.trade_delays[2]}, {self.trade_delays[3]});
SetPositionSize({self.position_size}, {self.position_size_type});
'''


class ClaudeAFLEngine:
    """Core AFL code generation engine using Claude API."""

    # Class constants
    MODEL = DEFAULT_MODEL
    MAX_TOKENS = 8192

    # AFL function signatures for validation
    SINGLE_ARG_FUNCTIONS = {
        "RSI", "ATR", "ADX", "CCI", "MFI", "PDI", "MDI", "OBV",
        "StochK", "StochD"
    }

    DOUBLE_ARG_FUNCTIONS = {
        "MA", "EMA", "SMA", "WMA", "DEMA", "TEMA", "ROC",
        "HHV", "LLV", "StDev", "Sum", "Ref", "LinearReg"
    }

    RESERVED_WORDS = {
        "Buy", "Sell", "Short", "Cover",
        "Open", "High", "Low", "Close", "Volume", "OpenInt",
        "O", "H", "L", "C", "V", "OI", "Average", "A",
        "RSI", "MACD", "MA", "EMA", "SMA", "WMA", "ATR", "ADX",
        "Filter", "PositionSize", "PositionScore"
    }

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initialize the AFL engine.

        Args:
            api_key: Anthropic API key
            model: Claude model to use (defaults to claude-sonnet-4-20250514)
        """
        self.api_key = api_key
        self.MODEL = model or DEFAULT_MODEL
        self.client = None

        if self.api_key:
            self._init_client()

    def _init_client(self):
        """Initialize Anthropic client."""
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)

    def _ensure_client(self):
        """Ensure client is initialized."""
        if not self.client and self.api_key:
            self._init_client()
        elif not self.client:
            raise ValueError("No API key provided")

    def generate_afl(
            self,
            request: str,
            strategy_type: StrategyType = StrategyType.STANDALONE,
            settings: Optional[BacktestSettings] = None,
            kb_context: str = "",
            conversation_history: Optional[List[Dict]] = None,
            user_answers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate AFL code from natural language request.

        Args:
            request: Natural language description of the strategy
            strategy_type: STANDALONE or COMPOSITE
            settings: Optional backtest settings
            kb_context: Optional knowledge base context
            conversation_history: Optional conversation history for context
            user_answers: Optional user answers to mandatory questions

        Returns:
            Dictionary with afl_code, explanation, and stats
        """
        self._ensure_client()
        start_time = time.time()

        # Build system prompt
        system_prompt = get_base_prompt()
        system_prompt += "\n\n" + get_generate_prompt(strategy_type.value)

        # Include user answers if provided
        if user_answers:
            answer_context = self._format_user_answers(user_answers)
            system_prompt += f"\n\n{answer_context}"

        if kb_context:
            system_prompt += f"\n\n## KNOWLEDGE BASE CONTEXT:\n{kb_context}"

        if settings:
            system_prompt += f"\n\n## BACKTEST SETTINGS TO APPLY:\n{settings.to_afl()}"

        # Build messages
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": f"Generate AFL code for: {request}"})

        # Generate code
        try:
            response = self.client.messages.create(
                model=self.MODEL,
                max_tokens=self.MAX_TOKENS,
                system=system_prompt,
                messages=messages
            )

            raw_response = response.content[0].text
            code = self._extract_code(raw_response)
            code, errors, warnings = self._validate_and_fix(code)
            quality_score = self._calculate_quality(code, errors, warnings)
            generation_time = time.time() - start_time

            return {
                "afl_code": code,
                "explanation": self._extract_explanation(raw_response),
                "stats": {
                    "quality_score": quality_score,
                    "generation_time": f"{generation_time:.2f}s",
                    "errors_fixed": errors,
                    "warnings": warnings,
                }
            }

        except Exception as e:
            logger.error(f"Generation error: {e}")
            return {
                "afl_code": f"// Error generating code: {str(e)}",
                "explanation": "",
                "stats": {"quality_score": 0, "generation_time": "0s", "errors_fixed": [], "warnings": [str(e)]}
            }

    def _format_user_answers(self, user_answers: Dict[str, str]) -> str:
        """Format user answers for system prompt."""
        strategy_type = user_answers.get('strategy_type', 'Not specified')
        trade_timing = user_answers.get('trade_timing', 'Not specified')

        if 'close' in trade_timing.lower():
            delays = "SetTradeDelays(0, 0, 0, 0)"
            timing_explanation = "Trade on bar CLOSE"
        elif 'open' in trade_timing.lower():
            delays = "SetTradeDelays(1, 1, 1, 1)"
            timing_explanation = "Trade on next bar OPEN"
        else:
            delays = "SetTradeDelays(0, 0, 0, 0)"
            timing_explanation = "Default timing"

        if 'standalone' in strategy_type.lower():
            structure = "STANDALONE - Complete strategy with all sections"
        elif 'composite' in strategy_type.lower():
            structure = "COMPOSITE - Only strategy logic"
        else:
            structure = "STANDALONE (default)"

        return f"""## USER'S MANDATORY ANSWERS:

**Strategy Type:** {strategy_type}
→ {structure}

**Trade Timing:** {trade_timing}
→ {timing_explanation}
→ CODE: {delays}

⚠️ CRITICAL: Implement according to these specifications."""

    def debug_code(self, code: str, error_message: str = "") -> str:
        """
        Debug and fix AFL code.

        Args:
            code: AFL code to debug
            error_message: Optional error message from AmiBroker

        Returns:
            Fixed AFL code
        """
        self._ensure_client()

        prompt = f"{get_debug_prompt()}\n\nCode to debug:\n```afl\n{code}\n```"
        if error_message:
            prompt += f"\n\nError message: {error_message}"

        response = self.client.messages.create(
            model=self.MODEL,
            max_tokens=self.MAX_TOKENS,
            system=get_base_prompt(),
            messages=[{"role": "user", "content": prompt}]
        )

        result = response.content[0].text
        return self._extract_code(result)

    def optimize_code(self, code: str) -> str:
        """
        Optimize AFL code for performance and readability.

        Args:
            code: AFL code to optimize

        Returns:
            Optimized AFL code
        """
        self._ensure_client()

        prompt = f"{get_optimize_prompt()}\n\nCode to optimize:\n```afl\n{code}\n```"

        response = self.client.messages.create(
            model=self.MODEL,
            max_tokens=self.MAX_TOKENS,
            system=get_base_prompt(),
            messages=[{"role": "user", "content": prompt}]
        )

        result = response.content[0].text
        return self._extract_code(result)

    def explain_code(self, code: str) -> str:
        """
        Explain AFL code in plain English.

        Args:
            code: AFL code to explain

        Returns:
            Explanation text
        """
        self._ensure_client()

        response = self.client.messages.create(
            model=self.MODEL,
            max_tokens=4000,
            system=get_explain_prompt(),
            messages=[{"role": "user", "content": f"Explain this AFL code:\n```afl\n{code}\n```"}]
        )

        return response.content[0].text

    def chat(
            self,
            message: str,
            history: Optional[List[Dict[str, str]]] = None,
            context: str = ""
    ) -> str:
        """
        Interactive chat about AFL and trading strategies.

        Args:
            message: User's message
            history: Previous conversation messages
            context: Additional context from knowledge base

        Returns:
            Assistant's response
        """
        self._ensure_client()

        system_prompt = f"{get_base_prompt()}\n\n{get_chat_prompt()}"
        if context:
            system_prompt += f"\n\n## KNOWLEDGE BASE CONTEXT:\n{context}"

        messages = []
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})

        response = self.client.messages.create(
            model=self.MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=messages
        )

        return response.content[0].text

    def validate_code(self, code: str) -> Dict[str, Any]:
        """
        Validate AFL code syntax without API call.

        Args:
            code: AFL code to validate

        Returns:
            Validation result with errors and warnings
        """
        _, errors, warnings = self._validate_and_fix(code, fix=False)

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    def _extract_code(self, response: str) -> str:
        """Extract AFL code from response, handling markdown code blocks."""
        if "```" in response:
            parts = response.split("```")
            for i, part in enumerate(parts):
                if i % 2 == 1:  # Inside code block
                    code = part.strip()
                    # Remove language identifier if present
                    if code.lower().startswith("afl"):
                        code = code[3:].strip()
                    elif code.lower().startswith("c"):
                        code = code[1:].strip()
                    return code
        return response.strip()

    def _extract_explanation(self, response: str) -> str:
        """Extract explanation text from response (text outside code blocks)."""
        if "```" not in response:
            return ""

        parts = response.split("```")
        explanation_parts = []
        for i, part in enumerate(parts):
            if i % 2 == 0:  # Outside code block
                text = part.strip()
                if text:
                    explanation_parts.append(text)

        return "\n".join(explanation_parts)

    def _validate_and_fix(self, code: str, fix: bool = True) -> Tuple[str, List[str], List[str]]:
        """
        Validate AFL code and optionally fix common mistakes.

        Args:
            code: AFL code to validate
            fix: Whether to auto-fix issues

        Returns:
            Tuple of (fixed_code, errors_fixed, warnings)
        """
        errors = []
        warnings = []

        # Fix single-arg functions used with Close
        for func in self.SINGLE_ARG_FUNCTIONS:
            pattern = rf'{func}\s*\(\s*Close\s*,\s*(\w+)\s*\)'
            matches = re.findall(pattern, code)
            if matches:
                if fix:
                    code = re.sub(pattern, rf'{func}(\1)', code)
                    errors.append(f"Fixed: {func}(Close, x) → {func}(x)")
                else:
                    errors.append(f"{func}() should not have Close as first argument")

        # Check for double-arg functions missing array
        for func in self.DOUBLE_ARG_FUNCTIONS:
            pattern = rf'{func}\s*\(\s*(\d+)\s*\)'
            if re.search(pattern, code):
                warnings.append(f"{func}() may need array as first argument")

        # Check ExRem usage
        if 'Buy' in code and 'Sell' in code and 'ExRem' not in code:
            warnings.append("Consider adding ExRem() to clean duplicate signals")

        # Check for reserved words used as variables
        for word in self.RESERVED_WORDS:
            # Skip signal variables that should be assigned
            if word in ["Buy", "Sell", "Short", "Cover"]:
                continue
            # Check if used as variable assignment
            pattern = rf'\b{word}\s*=\s*[^=]'
            if re.search(pattern, code):
                warnings.append(f"'{word}' used as variable - consider '{word}_Val' instead")

        # Check for sections
        if '_SECTION_BEGIN' not in code:
            warnings.append("Consider adding _SECTION_BEGIN/_SECTION_END for organization")

        return code, errors, warnings

    def _calculate_quality(self, code: str, errors: List[str], warnings: List[str]) -> float:
        """Calculate a quality score for the generated code."""
        score = 1.0

        # Deduct for errors
        score -= len(errors) * 0.1

        # Deduct for warnings
        score -= len(warnings) * 0.05

        # Bonus for good practices
        if '_SECTION_BEGIN' in code:
            score += 0.05
        if 'ExRem' in code:
            score += 0.05
        if 'SetTradeDelays' in code:
            score += 0.05
        if 'Param(' in code:
            score += 0.05
        if 'Plot(' in code:
            score += 0.05

        return max(0.0, min(1.0, score))