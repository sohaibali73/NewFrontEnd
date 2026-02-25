# AFL_Code_Generator Skill Test Cases

## Overview

This document contains comprehensive test cases for the AFL_Code_Generator skill, covering unit tests, integration tests, performance tests, and edge cases.

## Unit Tests

### Input Validation Tests

```python
import pytest
from afl_code_generator import validate_inputs, InvalidInputError

class TestInputValidation:
    
    def test_valid_inputs(self):
        """Test valid input parameters"""
        inputs = {
            'description': 'Create a moving average crossover strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic',
            'include_optimization': True,
            'timeframe': 'daily'
        }
        
        # Should not raise any exceptions
        validate_inputs(inputs)
    
    def test_short_description(self):
        """Test that short descriptions are rejected"""
        inputs = {
            'description': 'short',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        with pytest.raises(InvalidInputError, match="Description must be at least 10 characters long"):
            validate_inputs(inputs)
    
    def test_invalid_strategy_type(self):
        """Test that invalid strategy types are rejected"""
        inputs = {
            'description': 'Create a trading strategy',
            'strategy_type': 'invalid_type',
            'complexity': 'basic'
        }
        
        with pytest.raises(InvalidInputError, match="Invalid strategy type"):
            validate_inputs(inputs)
    
    def test_invalid_complexity(self):
        """Test that invalid complexity levels are rejected"""
        inputs = {
            'description': 'Create a trading strategy',
            'strategy_type': 'standalone',
            'complexity': 'invalid_complexity'
        }
        
        with pytest.raises(InvalidInputError, match="Invalid complexity"):
            validate_inputs(inputs)
    
    def test_invalid_timeframe(self):
        """Test that invalid timeframes are rejected"""
        inputs = {
            'description': 'Create a trading strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic',
            'timeframe': 'invalid_timeframe'
        }
        
        with pytest.raises(InvalidInputError, match="Invalid timeframe"):
            validate_inputs(inputs)
```

### Strategy Parsing Tests

```python
class TestStrategyParsing:
    
    def test_trend_following_detection(self):
        """Test detection of trend following strategies"""
        description = "Create a moving average crossover strategy"
        result = parse_strategy_description(description)
        
        assert result['strategy_type'] == 'trend_following'
        assert 'moving_average' in result['indicators']
    
    def test_mean_reversion_detection(self):
        """Test detection of mean reversion strategies"""
        description = "Build a strategy that buys when RSI is oversold and sells when overbought"
        result = parse_strategy_description(description)
        
        assert result['strategy_type'] == 'mean_reversion'
        assert 'rsi' in result['indicators']
    
    def test_range_trading_detection(self):
        """Test detection of range trading strategies"""
        description = "Create a strategy that trades between support and resistance levels"
        result = parse_strategy_description(description)
        
        assert result['strategy_type'] == 'range_trading'
        assert 'support' in result['entry_criteria'] or 'resistance' in result['entry_criteria']
    
    def test_momentum_detection(self):
        """Test detection of momentum strategies"""
        description = "Build a momentum strategy that follows price acceleration"
        result = parse_strategy_description(description)
        
        assert result['strategy_type'] == 'momentum'
        assert 'momentum' in result['indicators']
```

### Code Generation Tests

```python
class TestCodeGeneration:
    
    def test_basic_ma_crossover(self):
        """Test generation of basic moving average crossover"""
        inputs = {
            'description': 'Create a simple moving average crossover strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic',
            'include_optimization': False
        }
        
        result = generate_afl_code_from_inputs(inputs)
        
        assert 'MA(' in result['afl_code']
        assert 'Cross(' in result['afl_code']
        assert result['explanation'] is not None
        assert len(result['explanation']) > 0
    
    def test_rsi_strategy_with_optimization(self):
        """Test generation of RSI strategy with optimization parameters"""
        inputs = {
            'description': 'Build a RSI-based mean reversion strategy',
            'strategy_type': 'standalone',
            'complexity': 'intermediate',
            'include_optimization': True
        }
        
        result = generate_afl_code_from_inputs(inputs)
        
        assert 'RSI(' in result['afl_code']
        assert len(result['parameters']) > 0
        assert any('RSI_Period' in str(param) for param in result['parameters'])
        assert result['validation']['optimization_ready'] is True
    
    def test_indicator_generation(self):
        """Test generation of custom indicators"""
        inputs = {
            'description': 'Generate a custom momentum indicator',
            'strategy_type': 'indicator',
            'complexity': 'advanced',
            'include_comments': True
        }
        
        result = generate_afl_code_from_inputs(inputs)
        
        assert 'Plot(' in result['afl_code']
        assert '//' in result['afl_code'] or '/*' in result['afl_code']  # Comments present
        assert result['explanation'] is not None
```

## Integration Tests

### Full Workflow Tests

```python
class TestFullWorkflow:
    
    @pytest.mark.asyncio
    async def test_complete_skill_execution(self, skill_gateway):
        """Test complete skill execution with backend integration"""
        
        inputs = {
            'description': 'Create a simple moving average crossover strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic',
            'include_optimization': True
        }
        
        user_context = {
            'user_id': 'test-user',
            'preferences': {
                'trading_style': 'intermediate',
                'preferred_indicators': ['moving_average']
            }
        }
        
        result = await skill_gateway.execute_skill(
            'AFL_Code_Generator', inputs, user_context
        )
        
        # Verify required fields
        assert 'afl_code' in result
        assert 'explanation' in result
        assert 'validation' in result
        assert 'parameters' in result
        
        # Verify validation passed
        assert result['validation']['syntax_valid'] is True
        
        # Verify optimization parameters present
        assert len(result['parameters']) > 0
    
    @pytest.mark.asyncio
    async def test_skill_with_knowledge_base_integration(self, skill_gateway):
        """Test skill execution with knowledge base integration"""
        
        inputs = {
            'description': 'Create a moving average crossover strategy similar to my previous ones',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        user_context = {
            'user_id': 'test-user-with-history',
            'preferences': {}
        }
        
        result = await skill_gateway.execute_skill(
            'AFL_Code_Generator', inputs, user_context
        )
        
        # Verify KB context was added
        assert 'kb_context' in result
        assert 'similar_strategies' in result['kb_context']
```

### Error Handling Tests

```python
class TestErrorHandling:
    
    @pytest.mark.asyncio
    async def test_invalid_input_handling(self, skill_gateway):
        """Test handling of invalid inputs"""
        
        inputs = {
            'description': 'short',  # Too short
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        user_context = {'user_id': 'test-user'}
        
        with pytest.raises(Exception):
            await skill_gateway.execute_skill(
                'AFL_Code_Generator', inputs, user_context
            )
    
    @pytest.mark.asyncio
    async def test_code_generation_failure(self, skill_gateway, monkeypatch):
        """Test handling of code generation failures"""
        
        # Mock code generation to raise an exception
        def mock_generate_code(*args, **kwargs):
            raise ValueError("Code generation failed")
        
        monkeypatch.setattr('afl_code_generator.generate_afl_code', mock_generate_code)
        
        inputs = {
            'description': 'Create a trading strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        user_context = {'user_id': 'test-user'}
        
        result = await skill_gateway.execute_skill(
            'AFL_Code_Generator', inputs, user_context
        )
        
        # Should return error information
        assert 'error' in result
        assert result['error']['type'] == 'ValueError'
        assert 'suggestions' in result['error']
```

## Performance Tests

### Execution Time Tests

```python
import time

class TestPerformance:
    
    @pytest.mark.asyncio
    async def test_basic_strategy_performance(self, skill_gateway):
        """Test performance for basic strategy generation"""
        
        inputs = {
            'description': 'Create a simple moving average crossover strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        user_context = {'user_id': 'test-user'}
        
        start_time = time.time()
        
        result = await skill_gateway.execute_skill(
            'AFL_Code_Generator', inputs, user_context
        )
        
        execution_time = time.time() - start_time
        
        # Basic strategies should complete quickly
        assert execution_time < 10  # 10 seconds max
        assert result['afl_code'] is not None
    
    @pytest.mark.asyncio
    async def test_advanced_strategy_performance(self, skill_gateway):
        """Test performance for advanced strategy generation"""
        
        inputs = {
            'description': 'Create a complex multi-indicator strategy with advanced optimization parameters',
            'strategy_type': 'standalone',
            'complexity': 'advanced',
            'include_optimization': True
        }
        
        user_context = {'user_id': 'test-user'}
        
        start_time = time.time()
        
        result = await skill_gateway.execute_skill(
            'AFL_Code_Generator', inputs, user_context
        )
        
        execution_time = time.time() - start_time
        
        # Advanced strategies may take longer but should still be reasonable
        assert execution_time < 30  # 30 seconds max
        assert result['afl_code'] is not None
        assert len(result['parameters']) > 0
```

### Memory Usage Tests

```python
import psutil
import os

class TestMemoryUsage:
    
    @pytest.mark.asyncio
    async def test_memory_usage_within_limits(self, skill_gateway):
        """Test that memory usage stays within acceptable limits"""
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        inputs = {
            'description': 'Create a comprehensive trading strategy with multiple indicators',
            'strategy_type': 'standalone',
            'complexity': 'advanced',
            'include_optimization': True
        }
        
        user_context = {'user_id': 'test-user'}
        
        result = await skill_gateway.execute_skill(
            'AFL_Code_Generator', inputs, user_context
        )
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable
        assert memory_increase < 100  # Less than 100MB increase
        assert result['afl_code'] is not None
```

## Edge Cases

### Boundary Condition Tests

```python
class TestEdgeCases:
    
    def test_minimum_description_length(self):
        """Test with minimum valid description length"""
        inputs = {
            'description': '1234567890',  # Exactly 10 characters
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        # Should not raise an exception
        validate_inputs(inputs)
    
    def test_maximum_complexity(self):
        """Test with maximum complexity level"""
        inputs = {
            'description': 'Create an extremely complex multi-timeframe strategy',
            'strategy_type': 'standalone',
            'complexity': 'advanced'
        }
        
        # Should not raise an exception
        validate_inputs(inputs)
    
    def test_empty_optional_parameters(self):
        """Test with empty optional parameters"""
        inputs = {
            'description': 'Create a trading strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic',
            'include_optimization': False,
            'include_comments': False,
            'timeframe': 'daily'
        }
        
        # Should not raise an exception
        validate_inputs(inputs)
```

### Special Character Tests

```python
class TestSpecialCharacters:
    
    def test_description_with_special_characters(self):
        """Test with descriptions containing special characters"""
        inputs = {
            'description': 'Create a strategy with % symbols and @ mentions',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        # Should not raise an exception
        validate_inputs(inputs)
    
    def test_description_with_unicode(self):
        """Test with descriptions containing unicode characters"""
        inputs = {
            'description': 'Create a strategy with unicode: 你好世界',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        # Should not raise an exception
        validate_inputs(inputs)
```

## Regression Tests

### Known Working Cases

```python
class TestRegression:
    
    def test_known_working_strategy_1(self):
        """Test a known working strategy that should always work"""
        inputs = {
            'description': 'Create a 20-period moving average crossover strategy',
            'strategy_type': 'standalone',
            'complexity': 'basic'
        }
        
        result = generate_afl_code_from_inputs(inputs)
        
        # Verify the strategy contains expected elements
        assert 'MA(Close, 20)' in result['afl_code']
        assert 'Cross(' in result['afl_code']
        assert result['validation']['syntax_valid'] is True
    
    def test_known_working_strategy_2(self):
        """Test another known working strategy"""
        inputs = {
            'description': 'Build a RSI strategy with 14-period and 30/70 levels',
            'strategy_type': 'standalone',
            'complexity': 'intermediate'
        }
        
        result = generate_afl_code_from_inputs(inputs)
        
        # Verify the strategy contains expected elements
        assert 'RSI(Close, 14)' in result['afl_code']
        assert '30' in result['afl_code'] and '70' in result['afl_code']
        assert result['validation']['syntax_valid'] is True
```

## Load Tests

### Concurrent Execution Tests

```python
import asyncio

class TestLoad:
    
    @pytest.mark.asyncio
    async def test_concurrent_execution(self, skill_gateway):
        """Test concurrent execution of multiple skill requests"""
        
        async def execute_skill_request():
            inputs = {
                'description': 'Create a simple moving average crossover strategy',
                'strategy_type': 'standalone',
                'complexity': 'basic'
            }
            
            user_context = {'user_id': 'test-user'}
            
            return await skill_gateway.execute_skill(
                'AFL_Code_Generator', inputs, user_context
            )
        
        # Execute 5 concurrent requests
        tasks = [execute_skill_request() for _ in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All requests should succeed
        for result in results:
            assert isinstance(result, dict)
            assert 'afl_code' in result
            assert result['validation']['syntax_valid'] is True
```

## Test Data

### Sample Input Descriptions

```python
TEST_DESCRIPTIONS = {
    'basic_ma_crossover': 'Create a simple moving average crossover strategy',
    'rsi_mean_reversion': 'Build a RSI-based mean reversion strategy',
    'bollinger_bands': 'Create a strategy using Bollinger Bands',
    'macd_divergence': 'Build a MACD divergence strategy',
    'multi_indicator': 'Create a strategy combining moving averages, RSI, and MACD',
    'custom_indicator': 'Generate a custom momentum indicator',
    'scan_strategy': 'Create a scan for stocks showing bullish divergence'
}

TEST_STRATEGY_TYPES = ['standalone', 'composite', 'indicator', 'scan']
TEST_COMPLEXITIES = ['basic', 'intermediate', 'advanced']
TEST_TIMEFRAMES = ['intraday', 'daily', 'weekly', 'monthly']
```

This comprehensive test suite ensures the AFL_Code_Generator skill is robust, performant, and handles all expected use cases correctly.