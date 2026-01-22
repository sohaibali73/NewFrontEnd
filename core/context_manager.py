"""
Context Manager - Optimize context window usage for Claude API calls.
Prevents context overload and enables faster responses.
"""

import logging
from typing import List, Dict, Any, Optional
from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

# Configuration
MAX_RECENT_MESSAGES = 10  # Keep only recent messages in context
MAX_TRAINING_EXAMPLES = 5  # Reduced from 20
MAX_CONTEXT_TOKENS = 8000  # Soft limit for total context

# Condensed context limits for performance optimization
CONDENSED_CONTEXT_LIMITS = {
    "system_prompt_max_tokens": 500,  # Reduced from ~2000
    "training_context_max_tokens": 800,  # Reduced from 2000
    "kb_context_max_tokens": 600,  # Reduced from 1500
    "research_context_max_tokens": 1000,  # Reduced from 2000
    "total_context_budget": 5000,  # Reduced from 8000
}


def get_recent_messages(
    conversation_id: str,
    limit: int = MAX_RECENT_MESSAGES,
    include_system: bool = False
) -> List[Dict[str, str]]:
    """
    Get recent messages from a conversation with limit.
    
    Args:
        conversation_id: The conversation ID
        limit: Maximum number of messages to retrieve
        include_system: Whether to include system messages
        
    Returns:
        List of message dictionaries with role and content
    """
    try:
        db = get_supabase()
        
        query = db.table("messages").select("role, content").eq(
            "conversation_id", conversation_id
        ).order("created_at", desc=True).limit(limit)
        
        result = query.execute()
        
        # Reverse to get chronological order
        messages = [{"role": m["role"], "content": m["content"]} for m in reversed(result.data)]
        
        if not include_system:
            messages = [m for m in messages if m["role"] != "system"]
        
        logger.debug(f"Retrieved {len(messages)} recent messages (limit: {limit})")
        return messages
        
    except Exception as e:
        logger.error(f"Error getting recent messages: {e}")
        return []


def estimate_tokens(text: str) -> int:
    """
    Rough estimate of token count (4 chars ≈ 1 token).
    
    Args:
        text: Text to estimate
        
    Returns:
        Estimated token count
    """
    return len(text) // 4


def truncate_context(
    context: str,
    max_tokens: int = 2000,
    preserve_start: bool = True
) -> str:
    """
    Truncate context to fit within token budget.
    
    Args:
        context: Context string to truncate
        max_tokens: Maximum tokens allowed
        preserve_start: If True, keep start; if False, keep end
        
    Returns:
        Truncated context
    """
    estimated_tokens = estimate_tokens(context)
    
    if estimated_tokens <= max_tokens:
        return context
    
    # Calculate character limit (max_tokens * 4 chars per token)
    char_limit = max_tokens * 4
    
    if preserve_start:
        truncated = context[:char_limit] + "\n\n[... context truncated for brevity ...]"
    else:
        truncated = "[... earlier context truncated ...]\n\n" + context[-char_limit:]
    
    logger.debug(f"Truncated context from ~{estimated_tokens} to ~{max_tokens} tokens")
    return truncated


def optimize_training_context(
    training_context: str,
    max_examples: int = MAX_TRAINING_EXAMPLES
) -> str:
    """
    Optimize training context by limiting examples.
    
    Args:
        training_context: Full training context
        max_examples: Maximum examples to include
        
    Returns:
        Optimized training context
    """
    if not training_context:
        return ""
    
    # Simple optimization: truncate to reasonable size
    return truncate_context(training_context, max_tokens=2000, preserve_start=True)


def build_optimized_context(
    conversation_history: Optional[List[Dict]] = None,
    system_prompt: Optional[str] = None,
    kb_context: Optional[str] = None,
    training_context: Optional[str] = None,
    research_context: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build optimized context package with token budget management.
    
    Args:
        conversation_history: List of conversation messages
        system_prompt: System prompt text
        kb_context: Knowledge base context
        training_context: Training examples context
        research_context: Research/web search context
        
    Returns:
        Dictionary with optimized context components and token estimates
    """
    total_tokens = 0
    optimized = {}
    
    # System prompt (required, but can be condensed)
    if system_prompt:
        prompt_tokens = estimate_tokens(system_prompt)
        total_tokens += prompt_tokens
        optimized["system_prompt"] = system_prompt
        logger.debug(f"System prompt: ~{prompt_tokens} tokens")
    
    # Conversation history (limit to recent messages)
    if conversation_history:
        # Keep only recent messages
        recent_history = conversation_history[-MAX_RECENT_MESSAGES:]
        history_tokens = sum(estimate_tokens(m.get("content", "")) for m in recent_history)
        total_tokens += history_tokens
        optimized["conversation_history"] = recent_history
        logger.debug(f"Conversation history: {len(recent_history)} messages, ~{history_tokens} tokens")
    
    # Training context (conditional, truncated)
    if training_context:
        optimized_training = optimize_training_context(training_context)
        training_tokens = estimate_tokens(optimized_training)
        total_tokens += training_tokens
        optimized["training_context"] = optimized_training
        logger.debug(f"Training context: ~{training_tokens} tokens")
    
    # KB context (truncated if needed)
    if kb_context:
        kb_truncated = truncate_context(kb_context, max_tokens=1500)
        kb_tokens = estimate_tokens(kb_truncated)
        total_tokens += kb_tokens
        optimized["kb_context"] = kb_truncated
        logger.debug(f"KB context: ~{kb_tokens} tokens")
    
    # Research context (truncated if needed)
    if research_context:
        research_truncated = truncate_context(research_context, max_tokens=2000)
        research_tokens = estimate_tokens(research_truncated)
        total_tokens += research_tokens
        optimized["research_context"] = research_truncated
        logger.debug(f"Research context: ~{research_tokens} tokens")
    
    optimized["total_estimated_tokens"] = total_tokens
    
    if total_tokens > MAX_CONTEXT_TOKENS:
        logger.warning(f"Total context (~{total_tokens} tokens) exceeds recommended limit ({MAX_CONTEXT_TOKENS})")
    else:
        logger.info(f"Optimized context: ~{total_tokens} tokens (within budget)")
    
    return optimized


def should_include_training_context(endpoint: str, request_type: str) -> bool:
    """
    Determine if training context should be included based on endpoint.
    
    Args:
        endpoint: The API endpoint being called
        request_type: Type of request (generate, debug, optimize, chat, etc.)
        
    Returns:
        True if training context should be included
    """
    # Only include training context for AFL generation tasks
    afl_tasks = ["generate", "debug", "optimize", "afl", "reverse_engineer"]
    
    return request_type.lower() in afl_tasks or "afl" in endpoint.lower()