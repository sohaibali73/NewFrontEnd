# AFL_Code_Generator Skill Interface Specification

## Overview

The AFL_Code_Generator skill generates optimized AmiBroker AFL code from natural language descriptions. This skill serves as the primary interface for users to create trading strategies, indicators, and scans without needing to write AFL code manually.

## Input Interface

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `description` | string | Natural language description of the trading strategy | "Generate a moving average crossover strategy" |
| `strategy_type` | string | Type of AFL code to generate | "standalone", "composite", "indicator", "scan" |
| `complexity` | string | Complexity level of the strategy | "basic", "intermediate", "advanced" |

### Optional Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `include_optimization` | boolean | false | Whether to include optimization parameters | true |
| `include_comments` | boolean | true | Whether to include explanatory comments | true |
| `timeframe` | string | "daily" | Target timeframe for the strategy | "intraday", "daily", "weekly", "monthly" |

### Input Validation Rules

1. **Description Length**: Minimum 10 characters
2. **Strategy Type**: Must be one of the enum values
3. **Complexity**: Must be one of the enum values
4. **Timeframe**: Must be one of the enum values

## Output Interface

### Required Output Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `afl_code` | string | Generated AFL code | "MA(Close, 20);" |
| `explanation` | string | Plain English explanation of the strategy | "This strategy uses a 20-period moving average..." |
| `validation` | object | Validation results for the generated code | {syntax_valid: true, best_practices: [...]} |

### Optional Output Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `parameters` | array | Suggested optimization parameters | [{name: "MA_Period", default: 20, min: 5, max: 100}] |
| `complexity_score` | number | Complexity score of generated code (1-10) | 6 |

### Output Validation Rules

1. **AFL Code**: Must be valid AFL syntax
2. **Explanation**: Must be non-empty and descriptive
3. **Validation**: Must contain syntax_valid boolean field
4. **Complexity Score**: Must be between 1 and 10 if provided

## Error Handling

### Error Types

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_INPUT` | Input validation failed | Check input parameters and try again |
| `SYNTAX_ERROR` | Generated code has syntax errors | Review and fix the generated code |
| `TIMEOUT` | Skill execution exceeded time limit | Try with simpler requirements |
| `RATE_LIMIT` | Too many requests | Wait and try again later |

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Description must be at least 10 characters long",
    "details": {
      "field": "description",
      "value": "short"
    }
  }
}
```

## Usage Examples

### Basic Usage

```json
{
  "description": "Create a simple moving average crossover strategy",
  "strategy_type": "standalone",
  "complexity": "basic"
}
```

### Advanced Usage with Optimization

```json
{
  "description": "Build a RSI-based mean reversion strategy with optimization parameters",
  "strategy_type": "standalone",
  "complexity": "intermediate",
  "include_optimization": true,
  "timeframe": "daily"
}
```

### Indicator Generation

```json
{
  "description": "Generate a custom momentum indicator",
  "strategy_type": "indicator",
  "complexity": "advanced",
  "include_comments": true
}
```

## Integration Points

### Backend Integration

- **Validation**: Use existing `validate_afl()` function
- **Examples**: Use existing `generate_afl_examples()` function
- **Knowledge Base**: Search for similar strategies and patterns
- **Context**: Use user preferences and history

### Frontend Integration

- **Skill Detection**: Auto-detect when users request code generation
- **Input Form**: Provide structured input form with validation
- **Result Display**: Show generated code with syntax highlighting
- **Export Options**: Allow export to various formats (AFL, PDF, etc.)

## Performance Considerations

### Execution Time

- **Basic strategies**: < 10 seconds
- **Intermediate strategies**: < 20 seconds
- **Advanced strategies**: < 30 seconds

### Memory Usage

- **Context size**: Limited to 4000 tokens
- **Caching**: Enable for repeated similar requests
- **Parallel processing**: Disabled to maintain code quality

### Rate Limiting

- **Concurrent requests**: Maximum 5 per user
- **Request frequency**: Maximum 10 requests per minute
- **Daily limit**: Maximum 100 requests per day

## Security Considerations

### Input Sanitization

- **Code injection**: Prevent malicious code generation
- **Sensitive data**: Avoid including sensitive information in generated code
- **External dependencies**: Validate any external function calls

### Output Validation

- **Syntax checking**: Always validate generated AFL code
- **Best practices**: Ensure generated code follows best practices
- **Security scanning**: Check for potential security issues

## Monitoring and Analytics

### Key Metrics

- **Success rate**: Percentage of successful code generations
- **Execution time**: Average time to generate code
- **User satisfaction**: Feedback on generated code quality
- **Error rate**: Percentage of failed requests

### Logging

- **Input logging**: Log user inputs for analysis
- **Output logging**: Log generated code for quality control
- **Error logging**: Log errors for debugging and improvement
- **Performance logging**: Log execution times and resource usage

## Version History

### v1.0.0 (Current)

- Initial release
- Basic AFL code generation
- Parameter optimization support
- Validation and error handling
- Integration with existing backend tools