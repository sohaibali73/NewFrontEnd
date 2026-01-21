"""
Prompts module - exports all prompts for the AFL engine.

This module provides a clean interface to all prompt functions used throughout the application.
"""

# Import from base.py (primary source for base prompts)
from .base import (
    get_base_prompt,
    get_chat_prompt,
    FUNCTION_REFERENCE,
    RESERVED_KEYWORDS,
)

# Import from system_prompts.py (specialized prompts)
from .system_prompts import (
    get_optimize_prompt,
    get_debug_prompt,
    get_explain_prompt,
    get_backtest_analysis_prompt,
    get_reverse_engineer_prompt,
    get_schematic_prompt,
    get_validation_prompt,
    get_default_template,
)

# Import from templates.py
from .templates import (
    get_template,
    get_minimal_template,
    AFL_TEMPLATE_STANDALONE,
    AFL_TEMPLATE_COMPOSITE,
    AFL_TEMPLATE_MASTER,
)

# Import from afl_reference.py (AFL function reference data)
from .afl_reference import (
    AFLReference,
    get_function_reference_text,
    SINGLE_ARG_FUNCTIONS,
    DOUBLE_ARG_FUNCTIONS,
    MULTI_ARG_FUNCTIONS,
    AFL_COLORS,
    AFL_RESERVED_WORDS,
    AFL_PLOT_STYLES,
    AFL_SHAPES,
)

# Import from reverse_engineer.py (reverse engineering workflow prompts)
from .reverse_engineer import (
    get_clarification_prompt,
    get_research_synthesis_prompt,
    get_schematic_generation_prompt,
    get_code_generation_prompt,
    get_findings_summary_prompt,
    get_iteration_prompt,
    get_phase_prompt,
    PHASE_PROMPTS,
)


def get_generate_prompt(strategy_type: str = "standalone") -> str:
    """
    Get AFL generation prompt tailored to strategy type.

    Args:
        strategy_type: Either "standalone" or "composite"

    Returns:
        Prompt string for AFL generation
    """
    base = get_base_prompt()

    if strategy_type.lower() == "composite":
        return base + """

## COMPOSITE STRATEGY MODE

This is a COMPOSITE strategy module. Follow these specific rules:

1. **DO NOT** include backtest settings (SetOption, SetTradeDelays, PositionSize)
2. **DO NOT** include Plot() or PlotShapes() for visualization
3. **DO NOT** include AddColumn() or exploration output
4. **DO NOT** assign to Buy/Sell directly

Instead:
- Prefix ALL variables with a unique strategy identifier
- Use Buy[StrategyName], Sell[StrategyName] for signals
- Include only the core strategy logic and indicator calculations
- Document how to integrate with a master template
"""
    else:
        return base + """

## STANDALONE STRATEGY MODE

This is a STANDALONE strategy. Include ALL sections:

1. **Parameters Section** - Complete Param()/Optimize() structure
2. **Backtest Settings** - SetOption(), SetTradeDelays(), PositionSize
3. **Indicators** - All indicator calculations with proper naming
4. **Trading Logic** - Buy/Sell/Short/Cover signals
5. **Signal Cleanup** - ExRem() for all signals
6. **Visualization** - Plot() for indicators, PlotShapes() for signals
7. **Exploration** - AddColumn(), Filter for Analysis window

Generate a complete, production-ready strategy file.
"""


# Convenience aliases for common use cases
def get_afl_base_prompt() -> str:
    """Alias for get_base_prompt for backwards compatibility."""
    return get_base_prompt()


def get_afl_chat_prompt() -> str:
    """Alias for get_chat_prompt for backwards compatibility."""
    return get_chat_prompt()


# Export list - all publicly available functions and constants
__all__ = [
    # Base prompts
    "get_base_prompt",
    "get_chat_prompt",
    "get_generate_prompt",
    "FUNCTION_REFERENCE",
    "RESERVED_KEYWORDS",

    # System prompts
    "get_optimize_prompt",
    "get_debug_prompt",
    "get_explain_prompt",
    "get_backtest_analysis_prompt",
    "get_reverse_engineer_prompt",
    "get_schematic_prompt",
    "get_validation_prompt",
    "get_default_template",

    # Templates
    "get_template",
    "get_minimal_template",
    "AFL_TEMPLATE_STANDALONE",
    "AFL_TEMPLATE_COMPOSITE",
    "AFL_TEMPLATE_MASTER",

    # AFL Reference
    "AFLReference",
    "get_function_reference_text",
    "SINGLE_ARG_FUNCTIONS",
    "DOUBLE_ARG_FUNCTIONS",
    "MULTI_ARG_FUNCTIONS",
    "AFL_COLORS",
    "AFL_RESERVED_WORDS",
    "AFL_PLOT_STYLES",
    "AFL_SHAPES",

    # Reverse engineering prompts
    "get_clarification_prompt",
    "get_research_synthesis_prompt",
    "get_schematic_generation_prompt",
    "get_code_generation_prompt",
    "get_findings_summary_prompt",
    "get_iteration_prompt",
    "get_phase_prompt",
    "PHASE_PROMPTS",

    # Aliases for backwards compatibility
    "get_afl_base_prompt",
    "get_afl_chat_prompt",
]