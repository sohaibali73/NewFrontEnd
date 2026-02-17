# AFL_Code_Generator Skill Implementation Guide

## Overview

This guide provides detailed implementation instructions for the AFL_Code_Generator skill, including core logic, integration points, error handling, and best practices.

## Core Logic Implementation

### 1. Natural Language Processing

```python
def parse_strategy_description(description: str) -> Dict[str, Any]:
    """Parse natural language description into structured components"""
    
    # Extract strategy type indicators
    strategy_indicators = {
        'trend_following': ['trend', 'moving average', 'crossover', 'breakout'],
        'mean_reversion': ['mean reversion', 'oversold', 'overbought', 'reversal'],
        'range_trading': ['range', 'support', 'resistance', 'channel'],
        'momentum': ['momentum', 'strength', 'acceleration']
    }
    
    # Extract indicators mentioned
    indicators = extract_indicators(description)
    
    # Extract timeframes
    timeframes = extract_timeframes(description)
    
    # Extract complexity indicators
    complexity_indicators = extract_complexity_indicators(description)
    
    return {
        'strategy_type': detect_strategy_type(description, strategy_indicators),
        'indicators': indicators,
        'timeframes': timeframes,
        'complexity': determine_complexity(description, complexity_indicators),
        'entry_criteria': extract_entry_criteria(description),
        'exit_criteria': extract_exit_criteria(description)
    }
```

### 2. Code Generation Logic

```python
def generate_afl_code(
    parsed_description: Dict[str, Any],
    strategy_type: str,
    complexity: str,
    include_optimization: bool,
    include_comments: bool
) -> str:
    """Generate AFL code based on parsed description and parameters"""
    
    # Start with standard AFL structure
    afl_code = generate_standard_structure()
    
    # Add indicators based on parsed description
    for indicator in parsed_description['indicators']:
        afl_code += generate_indicator_code(indicator, complexity)
    
    # Add signal logic
    afl_code += generate_signal_logic(
        parsed_description['entry_criteria'],
        parsed_description['exit_criteria'],
        strategy_type
    )
    
    # Add optimization parameters if requested
    if include_optimization:
        afl_code += generate_optimization_parameters(parsed_description)
    
    # Add comments if requested
    if include_comments:
        afl_code = add_explanatory_comments(afl_code, parsed_description)
    
    return afl_code
```

### 3. Parameter Optimization

```python
def generate_optimization_parameters(parsed_description: Dict[str, Any]) -> str:
    """Generate optimization parameters for the strategy"""
    
    parameters = []
    
    # Generate MA parameters
    if 'moving_average' in parsed_description['indicators']:
        parameters.append({
            'name': 'MA_Period',
            'default': 20,
            'min': 5,
            'max': 100,
            'step': 1,
            'description': 'Moving Average Period'
        })
    
    # Generate RSI parameters
    if 'rsi' in parsed_description['indicators']:
        parameters.append({
            'name': 'RSI_Period',
            'default': 14,
            'min': 5,
            'max': 50,
            'step': 1,
            'description': 'RSI Period'
        })
        parameters.append({
            'name': 'RSI_Overbought',
            'default': 70,
            'min': 50,
            'max': 90,
            'step': 1,
            'description': 'RSI Overbought Level'
        })
        parameters.append({
            'name': 'RSI_Oversold',
            'default': 30,
            'min': 10,
            'max': 50,
            'step': 1,
            'description': 'RSI Oversold Level'
        })
    
    # Generate stop loss parameters
    parameters.append({
        'name': 'Stop_Loss_Percent',
        'default': 3.0,
        'min': 1.0,
        'max': 10.0,
        'step': 0.5,
        'description': 'Stop Loss Percentage'
    })
    
    # Generate take profit parameters
    parameters.append({
        'name': 'Take_Profit_Percent',
        'default': 5.0,
        'min': 1.0,
        'max': 20.0,
        'step': 0.5,
        'description': 'Take Profit Percentage'
    })
    
    return format_optimization_parameters(parameters)
```

## Integration Points

### 1. Backend Integration

```python
# Integrate with existing validation function
def validate_generated_code(afl_code: str) -> Dict[str, Any]:
    """Validate generated AFL code using existing validation"""
    from core.tools import validate_afl
    
    validation_result = validate_afl(afl_code)
    
    return {
        'syntax_valid': validation_result['is_valid'],
        'best_practices': validation_result.get('best_practices', []),
        'optimization_ready': check_optimization_readiness(afl_code),
        'errors': validation_result.get('errors', [])
    }
```

### 2. Knowledge Base Integration

```python
# Search for similar strategies in knowledge base
def search_similar_strategies(description: str, user_id: str) -> List[Dict[str, Any]]:
    """Search knowledge base for similar strategies"""
    from core.knowledge_base import search_knowledge_base
    
    # Search for similar strategies
    kb_results = search_knowledge_base(
        query=description,
        category="afl",
        user_id=user_id
    )
    
    # Filter for strategies
    strategies = [result for result in kb_results if 'strategy' in result.get('tags', [])]
    
    return strategies[:5]  # Return top 5 results
```

### 3. Context Manager Integration

```python
# Use user preferences and context
def get_user_context(user_id: str) -> Dict[str, Any]:
    """Get user-specific context and preferences"""
    
    # Get user preferences
    user_preferences = get_user_preferences(user_id)
    
    # Get user's trading style
    trading_style = user_preferences.get('trading_style', 'intermediate')
    
    # Get user's preferred indicators
    preferred_indicators = user_preferences.get('preferred_indicators', [])
    
    # Get user's risk tolerance
    risk_tolerance = user_preferences.get('risk_tolerance', 'moderate')
    
    return {
        'trading_style': trading_style,
        'preferred_indicators': preferred_indicators,
        'risk_tolerance': risk_tolerance,
        'user_id': user_id
    }
```

## Error Handling

### 1. Input Validation Errors

```python
class AFLCodeGeneratorError(Exception):
    """Base exception for AFL code generator errors"""
    pass

class InvalidInputError(AFLCodeGeneratorError):
    """Raised when input validation fails"""
    pass

def validate_inputs(inputs: Dict[str, Any]) -> None:
    """Validate input parameters"""
    
    # Check description length
    if len(inputs.get('description', '')) < 10:
        raise InvalidInputError("Description must be at least 10 characters long")
    
    # Check strategy type
    valid_strategy_types = ['standalone', 'composite', 'indicator', 'scan']
    if inputs.get('strategy_type') not in valid_strategy_types:
        raise InvalidInputError(f"Invalid strategy type. Must be one of: {valid_strategy_types}")
    
    # Check complexity
    valid_complexities = ['basic', 'intermediate', 'advanced']
    if inputs.get('complexity') not in valid_complexities:
        raise InvalidInputError(f"Invalid complexity. Must be one of: {valid_complexities}")
    
    # Check timeframe
    valid_timeframes = ['intraday', 'daily', 'weekly', 'monthly']
    if inputs.get('timeframe') not in valid_timeframes:
        raise InvalidInputError(f"Invalid timeframe. Must be one of: {valid_timeframes}")
```

### 2. Code Generation Errors

```python
class CodeGenerationError(AFLCodeGeneratorError):
    """Raised when code generation fails"""
    pass

def handle_code_generation_error(error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
    """Handle code generation errors gracefully"""
    
    error_response = {
        'error': {
            'type': type(error).__name__,
            'message': str(error),
            'context': context
        },
        'suggestions': []
    }
    
    # Provide specific suggestions based on error type
    if isinstance(error, SyntaxError):
        error_response['suggestions'].append("Check the syntax of your description")
        error_response['suggestions'].append("Try simplifying your strategy description")
    
    elif isinstance(error, ValueError):
        error_response['suggestions'].append("Review your input parameters")
        error_response['suggestions'].append("Ensure all required fields are provided")
    
    return error_response
```

### 3. Validation Errors

```python
def handle_validation_errors(validation_result: Dict[str, Any]) -> List[str]:
    """Handle validation errors and provide suggestions"""
    
    errors = []
    
    if not validation_result.get('syntax_valid', False):
        errors.append("Generated code has syntax errors")
        errors.append("Review the generated code for syntax issues")
    
    best_practices = validation_result.get('best_practices', [])
    if best_practices:
        for practice in best_practices:
            if practice.get('level') == 'error':
                errors.append(f"Best practice violation: {practice.get('message')}")
    
    return errors
```

## Best Practices

### 1. Code Quality

```python
def ensure_code_quality(afl_code: str) -> str:
    """Ensure generated code follows best practices"""
    
    # Check for common issues
    issues = []
    
    # Check for reserved word usage
    reserved_words = ['Buy', 'Sell', 'MA', 'RSI', 'Close', 'Open', 'High', 'Low']
    for word in reserved_words:
        if f"{word} =" in afl_code:
            issues.append(f"Variable name '{word}' conflicts with AFL reserved word")
    
    # Check for proper Param/Optimize structure
    if 'Param(' in afl_code and 'Optimize(' not in afl_code:
        issues.append("Missing Optimize() function for parameters")
    
    # Check for proper commenting
    if '//' not in afl_code and '/*' not in afl_code:
        issues.append("Consider adding comments to explain the strategy")
    
    # Return code with warnings if issues found
    if issues:
        warning_comment = "/* WARNING: Code quality issues detected:\n"
        for issue in issues:
            warning_comment += f"   - {issue}\n"
        warning_comment += "*/\n\n"
        
        return warning_comment + afl_code
    
    return afl_code
```

### 2. Performance Optimization

```python
def optimize_generated_code(afl_code: str) -> str:
    """Optimize generated code for performance"""
    
    # Replace inefficient patterns
    optimizations = [
        # Replace multiple MA calculations with single calculation
        (r'MA\(Close, (\d+)\)', r'MA_Close_\1'),
        # Optimize array operations
        (r'Close\[\d+\]', r'Close'),
    ]
    
    optimized_code = afl_code
    
    for pattern, replacement in optimizations:
        optimized_code = re.sub(pattern, replacement, optimized_code)
    
    return optimized_code
```

### 3. Security Considerations

```python
def sanitize_generated_code(afl_code: str) -> str:
    """Sanitize generated code to prevent security issues"""
    
    # Remove potentially dangerous functions
    dangerous_functions = ['ShellExecute', 'CreateFile', 'WriteFile']
    for func in dangerous_functions:
        afl_code = afl_code.replace(func, '')
    
    # Remove external file operations
    afl_code = re.sub(r'fopen\([^)]+\)', '', afl_code)
    afl_code = re.sub(r'fwrite\([^)]+\)', '', afl_code)
    
    return afl_code
```

## Testing Strategy

### 1. Unit Tests

```python
import unittest
from unittest.mock import Mock, patch

class TestAFLCodeGenerator(unittest.TestCase):
    
    def test_parse_strategy_description(self):
        """Test strategy description parsing"""
        description = "Create a moving average crossover strategy"
        result = parse_strategy_description(description)
        
        self.assertIn('moving_average', result['indicators'])
        self.assertEqual(result['strategy_type'], 'trend_following')
    
    def test_generate_optimization_parameters(self):
        """Test optimization parameter generation"""
        parsed_description = {'indicators': ['moving_average', 'rsi']}
        parameters = generate_optimization_parameters(parsed_description)
        
        self.assertIsInstance(parameters, list)
        self.assertTrue(any('MA_Period' in str(p) for p in parameters))
    
    def test_validate_inputs(self):
        """Test input validation"""
        with self.assertRaises(InvalidInputError):
            validate_inputs({'description': 'short'})
```

### 2. Integration Tests

```python
class TestAFLCodeGeneratorIntegration(unittest.TestCase):
    
    @patch('core.tools.validate_afl')
    def test_full_generation_flow(self, mock_validate):
        """Test complete code generation flow"""
        mock_validate.return_value = {'is_valid': True}
        
        inputs = {
            'description': 'Create a simple moving average crossover strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        result = generate_afl_code_from_inputs(inputs)
        
        self.assertIn('afl_code', result)
        self.assertIn('explanation', result)
        self.assertTrue(result['validation']['syntax_valid'])
```

## Deployment Considerations

### 1. Environment Setup

```python
# Environment variables for skill configuration
SKILL_CONFIG = {
    'max_execution_time': 30,  # seconds
    'max_memory_usage': 256,   # MB
    'token_limit': 4000,
    'enable_caching': True,
    'cache_ttl': 3600,  # 1 hour
}
```

### 2. Monitoring and Logging

```python
import logging

logger = logging.getLogger(__name__)

def log_skill_execution(inputs: Dict[str, Any], result: Dict[str, Any], execution_time: float):
    """Log skill execution for monitoring"""
    
    logger.info(f"Skill execution completed in {execution_time:.2f}s", extra={
        'inputs': inputs,
        'result_summary': {
            'has_code': bool(result.get('afl_code')),
            'has_explanation': bool(result.get('explanation')),
            'validation_passed': result.get('validation', {}).get('syntax_valid', False)
        }
    })
```

This implementation guide provides a comprehensive foundation for building the AFL_Code_Generator skill with proper error handling, integration points, and best practices.