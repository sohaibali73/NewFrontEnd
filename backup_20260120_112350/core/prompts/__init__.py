"""
Prompts module - exports all prompts for the AFL engine.
"""

# Import from base
from .base import (
    get_base_prompt,
    get_chat_prompt,
    FUNCTION_REFERENCE,
    RESERVED_KEYWORDS,
)

# Import from afl - try different possible names
try:
    from .afl import get_generate_prompt
except ImportError:
    try:
        from .afl import get_afl_generation_prompt as get_generate_prompt
    except ImportError:
        def get_generate_prompt(strategy_type="standalone"):
            return "Generate complete AFL code."

try:
    from .afl import get_debug_prompt
except ImportError:
    try:
        from .afl import get_afl_debug_prompt as get_debug_prompt
    except ImportError:
        def get_debug_prompt():
            return "Debug the AFL code."

try:
    from .afl import get_explain_prompt
except ImportError:
    try:
        from .afl import get_afl_explain_prompt as get_explain_prompt
    except ImportError:
        def get_explain_prompt():
            return "Explain the AFL code."

try:
    from .afl import get_optimize_prompt
except ImportError:
    try:
        from .afl import get_afl_optimize_prompt as get_optimize_prompt
    except ImportError:
        def get_optimize_prompt():
            return "Optimize the AFL code."

try:
    from .afl import get_default_template
except ImportError:
    def get_default_template():
        return "// AFL Template"

try:
    from .afl import AFLReference
except ImportError:
    class AFLReference:
        SINGLE_ARG_FUNCTIONS = {}
        DOUBLE_ARG_FUNCTIONS = {}
        RESERVED_WORDS = []

# Import from reverse_engineer
try:
    from .reverse_engineer import get_reverse_engineer_prompt
except ImportError:
    def get_reverse_engineer_prompt(query, context="", phase="research"):
        return f"Reverse engineer: {query}"

try:
    from .reverse_engineer import get_schematic_prompt
except ImportError:
    def get_schematic_prompt():
        return "Generate strategy schematic."

try:
    from .reverse_engineer import get_backtest_analysis_prompt
except ImportError:
    def get_backtest_analysis_prompt():
        return "Analyze backtest results."

# Convenience aliases
def get_clarification_prompt(query: str) -> str:
    return get_reverse_engineer_prompt(query, "", "clarification")

def get_research_prompt(query: str, context: str = "") -> str:
    return get_reverse_engineer_prompt(query, context, "research")

__all__ = [
    "get_base_prompt",
    "get_chat_prompt",
    "FUNCTION_REFERENCE",
    "RESERVED_KEYWORDS",
    "get_generate_prompt",
    "get_debug_prompt",
    "get_explain_prompt",
    "get_optimize_prompt",
    "get_default_template",
    "AFLReference",
    "get_reverse_engineer_prompt",
    "get_clarification_prompt",
    "get_research_prompt",
    "get_schematic_prompt",
    "get_backtest_analysis_prompt",
]
