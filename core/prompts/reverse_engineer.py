"""
Reverse Engineering Prompts
Prompts for strategy reverse engineering workflow.
"""

from typing import Optional
from datetime import datetime


def get_current_date_context() -> str:
    """Get the current date context to include in prompts."""
    now = datetime.now()
    return f"""
CURRENT DATE CONTEXT (CRITICAL):
- Today's date is: {now.strftime('%B %d, %Y')} ({now.strftime('%m/%d/%Y')})
- The current year is: {now.year}
- Do NOT confuse the date - your training data may be outdated
- When analyzing recent events, use the CURRENT date above as reference
"""


# Output formatting rules to prevent emojis and hashtags
OUTPUT_FORMATTING_RULES = '''
OUTPUT FORMATTING RULES (CRITICAL):
- Do NOT use emojis or emoji checkboxes in responses
- Do NOT use markdown hashtags (## or ###) for headers
- Use plain text headers with colons instead (e.g., "Strategy Logic:" not "## Strategy Logic")
- Use simple dashes (-) for bullet points
- Keep responses clean and professional without special characters

IMPORTANT - DO NOT SAY THESE THINGS:
- Do NOT say "I cannot access the internet" or "I cannot browse websites"
- Do NOT say "I don't have access to real-time data"
- Do NOT say "I cannot access current market data"
- Do NOT list limitations about internet access
- This system HAS research tools (Tavily, SEC EDGAR, Yahoo Finance) - you can request research be conducted
- If you need current data, simply ask for it or tell the user you will conduct research
'''


def get_clarification_prompt(query: str) -> str:
    """Get prompt for initial clarification questions."""
    date_context = get_current_date_context()
    return f'''You are a quantitative trading strategy analyst. A user wants to reverse engineer this strategy:

"{query}"

{date_context}

Before conducting research or writing code, ask 3-5 targeted clarification questions to understand:

1. Strategy Type: Is this a momentum, mean-reversion, trend-following, or breakout strategy?
2. Timeframe: What timeframe is this designed for (intraday, daily, weekly)?
3. Markets: What markets/instruments should this work on?
4. Entry/Exit Logic: Are there specific rules mentioned that you need to clarify?
5. Risk Management: Any position sizing or stop loss requirements?

Be conversational and helpful. Ask questions that will help you understand the strategy well enough to implement it accurately.

IMPORTANT: Do NOT generate any code yet. Just ask clarification questions.

{OUTPUT_FORMATTING_RULES}
'''


def get_research_synthesis_prompt(query: str, research_context: str) -> str:
    """Get prompt for synthesizing web research about a strategy."""
    return f'''You are a quantitative trading strategy analyst. Synthesize this research about the trading strategy.

TARGET STRATEGY:
"{query}"

WEB RESEARCH RESULTS:
{research_context}

YOUR TASK:
Analyze the research and provide:

1. Strategy Overview:
- What does this strategy do?
- What is the core trading hypothesis?
- What market conditions does it target?

2. Key Components Identified:
For each component found in the research:
- Indicators used and their typical parameters
- Entry conditions/signals
- Exit conditions/signals
- Filters or regime detection

3. Parameter Estimates:
For unknown parameters, provide:
- Best estimate value
- Reasonable min/max range
- Confidence level (High/Medium/Low)
- Source or reasoning

4. Implementation Notes:
- Any gotchas or common mistakes to avoid
- Variations mentioned in the research
- What aspects need clarification

Be thorough but concise. Focus on actionable information for AFL implementation.

{OUTPUT_FORMATTING_RULES}
'''


def get_schematic_generation_prompt(query: str, synthesis: str) -> str:
    """Get prompt for generating strategy schematic JSON."""
    return f'''Based on the research synthesis, create a detailed strategy schematic in JSON format.

## STRATEGY: {query}

## RESEARCH SYNTHESIS:
{synthesis}

## OUTPUT FORMAT:
Return a JSON object with this exact structure:

```json
{{
    "strategy_name": "Strategy Name",
    "strategy_type": "momentum|mean-reversion|trend-following|breakout|hybrid",
    "timeframe": "daily|weekly|intraday|multi-timeframe",
    "description": "One-sentence strategy description",
    
    "components": [
        {{
            "id": "unique_id",
            "type": "indicator|entry|exit|filter|sizing|risk",
            "name": "Component Name",
            "description": "What this component does",
            "afl_function": "RSI|MA|ATR|etc",
            "parameters": [
                {{
                    "name": "period",
                    "default": 14,
                    "min": 5,
                    "max": 30,
                    "step": 1,
                    "confidence": "high|medium|low",
                    "source": "Research source or reasoning"
                }}
            ]
        }}
    ],
    
    "entry_logic": {{
        "long": "Complete long entry condition",
        "short": "Complete short entry condition (if applicable)"
    }},
    
    "exit_logic": {{
        "long_exit": "Complete long exit condition",
        "short_exit": "Complete short exit condition (if applicable)"
    }},
    
    "risk_management": {{
        "stop_loss": "Stop loss approach",
        "take_profit": "Take profit approach (if any)",
        "position_sizing": "Position sizing method"
    }},
    
    "notes": [
        "Implementation note 1",
        "Implementation note 2"
    ]
}}
```

Return ONLY valid JSON, no additional text.
'''


def get_code_generation_prompt(query: str, schematic: dict, strategy_type: str = "standalone") -> str:
    """Get prompt for generating AFL code from schematic."""
    import json
    schematic_str = json.dumps(schematic, indent=2)

    return f'''Generate complete, production-ready AFL code for this strategy.

## STRATEGY: {query}

## STRATEGY SCHEMATIC:
{schematic_str}

## STRATEGY TYPE: {strategy_type.upper()}

## REQUIREMENTS:

### If STANDALONE:
- Include all sections (_SECTION_BEGIN/_SECTION_END)
- Include backtest settings (SetOption, SetTradeDelays)
- Include visualization (Plot, PlotShapes)
- Include exploration output (AddColumn, Filter)
- Full Param()/Optimize() structure for all parameters

### If COMPOSITE:
- Only strategy logic, no backtest settings
- Prefix all variables with strategy identifier
- Use Buy[StrategyName], Sell[StrategyName] for signals
- No Plot() or exploration code

## AFL SYNTAX RULES - CRITICAL:
1. RSI(14) NOT RSI(Close, 14) - single-arg functions
2. MA(Close, 20) NOT MA(20) - double-arg functions
3. RSI_Val NOT RSI - never shadow built-in functions
4. Always ExRem(Buy, Sell) and ExRem(Sell, Buy) for signal cleanup
5. Use Param()/Optimize() pattern for all parameters

Generate the complete AFL code now.
'''


def get_findings_summary_prompt(query: str, conversation_history: str) -> str:
    """Get prompt for summarizing findings from conversation."""
    return f'''Summarize the findings from this reverse engineering conversation.

ORIGINAL QUERY:
"{query}"

CONVERSATION:
{conversation_history}

SUMMARY FORMAT:

Strategy Understanding:
- What we learned about the strategy
- Key parameters identified
- Entry/exit logic clarified

Remaining Questions:
- What still needs clarification
- Assumptions we're making

Ready for Implementation:
- YES/NO
- If NO, what's missing?

Be concise but complete.

{OUTPUT_FORMATTING_RULES}
'''


def get_iteration_prompt(query: str, current_code: str, feedback: str) -> str:
    """Get prompt for iterating on generated code based on feedback."""
    return f'''Improve this AFL code based on user feedback.

## STRATEGY: {query}

## CURRENT CODE:
```afl
{current_code}
```

## USER FEEDBACK:
{feedback}

## INSTRUCTIONS:
1. Address all points in the feedback
2. Maintain correct AFL syntax (RSI(14) not RSI(Close, 14), etc.)
3. Keep Param()/Optimize() structure
4. Maintain ExRem() signal cleanup
5. Preserve section organization

Provide the improved code with comments explaining what changed.
'''


# Phase-specific prompts for the workflow
PHASE_PROMPTS = {
    "clarification": get_clarification_prompt,
    "research": get_research_synthesis_prompt,
    "schematic": get_schematic_generation_prompt,
    "coding": get_code_generation_prompt,
    "findings": get_findings_summary_prompt,
    "iteration": get_iteration_prompt,
}


def get_phase_prompt(phase: str, **kwargs) -> str:
    """Get the appropriate prompt for a workflow phase."""
    if phase not in PHASE_PROMPTS:
        raise ValueError(f"Unknown phase: {phase}. Valid phases: {list(PHASE_PROMPTS.keys())}")

    prompt_func = PHASE_PROMPTS[phase]

    # Filter kwargs to only pass what the function expects
    import inspect
    sig = inspect.signature(prompt_func)
    filtered_kwargs = {k: v for k, v in kwargs.items() if k in sig.parameters}

    return prompt_func(**filtered_kwargs)