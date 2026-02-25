"""
Condensed System Prompts - Optimized for Speed
Reduced token count by 60-70% while maintaining all critical information.
"""

from datetime import datetime


# Condensed AFL reference - removed verbose examples and explanations
AFL_RULES = '''AFL SYNTAX RULES:
Single-arg: RSI(14), ATR(14), ADX(14), CCI(20), MFI(14)
Double-arg: MA(Close,20), EMA(Close,12), HHV(High,20), LLV(Low,20)

❌ RSI(Close,14) → ✅ RSI(14)
❌ MA(20) → ✅ MA(Close,20)
❌ RSI = RSI(14) → ✅ RSI_Val = RSI(14)

Required: ExRem(Buy,Sell), Param/Optimize pattern, _SECTION_BEGIN/END
'''


# Condensed base prompt
def get_condensed_base_prompt() -> str:
    """Ultra-condensed base prompt - 70% smaller."""
    return f'''Expert AFL developer. Follow these rules:

{AFL_RULES}

Param/Optimize pattern:
```
len_Dflt = Param("Period", 14, 2, 50, 1);
len = Optimize("Period", len_Dflt, 2, 50, 1);
RSI_Val = RSI(len);
```

Structure: Parameters → Settings → Indicators → Logic → ExRem → Plot

Before coding ask: STANDALONE/COMPOSITE? OPEN/CLOSE execution?
'''


# Condensed generation prompt
def get_condensed_generate_prompt(strategy_type: str = "standalone") -> str:
    """Condensed generation prompt."""
    if strategy_type.lower() == "standalone":
        return '''Generate STANDALONE AFL: Include all sections, backtest settings, plots, exploration.
SetTradeDelays(0,0,0,0) for CLOSE or (1,1,1,1) for OPEN.'''
    else:
        return '''Generate COMPOSITE AFL: Only logic, no settings/plots. Prefix variables with strategy name.'''


# Condensed optimization prompt
def get_condensed_optimize_prompt() -> str:
    """Condensed optimize prompt."""
    return '''Optimize AFL code:
1. Fix signatures: RSI(14) not RSI(Close,14)
2. Fix naming: RSI_Val not RSI
3. Add Param/Optimize if missing
4. Add ExRem(Buy,Sell); ExRem(Sell,Buy);
5. Add sections if missing'''


# Condensed debug prompt
def get_condensed_debug_prompt() -> str:
    """Condensed debug prompt."""
    return '''Debug AFL:
Check: Function signatures, reserved word conflicts, ExRem cleanup, TimeFrame expansion
Fix errors and return corrected code.'''


# Condensed explain prompt
def get_condensed_explain_prompt() -> str:
    """Condensed explain prompt."""
    return '''Explain AFL code: What strategy? What indicators? Entry/exit logic? Parameters? Risk management?'''


# Condensed chat prompt
def get_condensed_chat_prompt() -> str:
    """Condensed chat prompt."""
    return f'''AFL expert. Help with code, strategies, indicators, optimization.

{AFL_RULES}

Be concise. Ask STANDALONE/COMPOSITE and OPEN/CLOSE before coding.'''


# Condensed reverse engineer prompt
def get_condensed_reverse_engineer_prompt(phase: str = "clarification") -> str:
    """Condensed reverse engineer prompt by phase."""
    
    prompts = {
        "clarification": '''Ask 3-5 targeted questions about: strategy type, timeframe, markets, entry/exit rules, risk management. No code yet.''',
        
        "research": '''Synthesize research: Strategy overview, components (indicators/signals), parameter estimates with confidence, implementation notes.''',
        
        "schematic": '''Create JSON schematic: strategy_name, type, components with parameters, entry/exit logic, risk management.''',
        
        "coding": f'''Generate AFL from schematic. Follow:
{AFL_RULES}
STANDALONE: all sections. COMPOSITE: logic only.''',
        
        "findings": '''Summarize: What learned, parameters identified, logic clarified, remaining questions, ready for implementation?'''
    }
    
    return prompts.get(phase, prompts["clarification"])


# Condensed clarification prompt
def get_condensed_clarification_prompt(query: str) -> str:
    """Condensed clarification prompt."""
    now = datetime.now()
    return f'''Reverse engineer strategy: "{query}"

Today: {now.strftime('%B %d, %Y')}

Ask 3-5 questions: type, timeframe, markets, entry/exit, risk. No code yet. Be concise.'''


# Context optimization settings
CONDENSED_CONTEXT_LIMITS = {
    "system_prompt_max_tokens": 500,  # Reduced from ~2000
    "training_context_max_tokens": 800,  # Reduced from 2000
    "kb_context_max_tokens": 600,  # Reduced from 1500
    "research_context_max_tokens": 1000,  # Reduced from 2000
    "total_context_budget": 5000,  # Reduced from 8000
}


def should_use_condensed_prompts(endpoint: str = "") -> bool:
    """Determine if condensed prompts should be used (default: True for performance)."""
    # Always use condensed prompts for better performance
    return True