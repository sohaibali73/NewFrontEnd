"""
Streaming utilities for Vercel AI SDK
=====================================
Implements the AI SDK Data Stream Protocol for real-time responses.

This module provides two streaming encoders:
1. VercelAIStreamEncoder - Legacy SSE format (for existing /chat endpoints)
2. VercelAIStreamProtocol - Native AI SDK Data Stream Protocol (new /api/ai endpoints)

See: https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
"""

import json
import logging
from typing import Dict, Any, AsyncGenerator, Optional, List
from anthropic import Anthropic

logger = logging.getLogger(__name__)


# ============================================================================
# AI SDK Data Stream Protocol Encoder (Recommended for new integrations)
# ============================================================================

class VercelAIStreamEncoder:
    """
    Encode responses for Vercel AI SDK Data Stream Protocol.
    
    This is the format expected by useChat() and useCompletion() hooks.
    Format: {type}:{JSON value}\n
    
    Type codes:
    - 0: Text delta
    - 2: Data array (custom data)
    - 3: Error
    - 7: Tool call streaming start
    - 8: Tool call argument delta  
    - 9: Complete tool call
    - a: Tool result
    - d: Finish message
    - e: Finish step
    - f: Start step
    """
    
    @staticmethod
    def encode_text(text: str) -> str:
        """
        Encode text delta using AI SDK Data Stream Protocol.
        
        Args:
            text: Text content to stream
            
        Returns:
            Data stream protocol formatted string
        """
        if not text:
            return ""
        return f"0:{json.dumps(text)}\n"
    
    @staticmethod
    def encode_tool_call(tool_id: str, tool_name: str, tool_input: Dict[str, Any]) -> str:
        """
        Encode complete tool call.
        
        Args:
            tool_id: Unique ID for this tool call
            tool_name: Name of the tool being called
            tool_input: Input parameters for the tool
            
        Returns:
            Data stream protocol formatted string
        """
        return f"9:{json.dumps({'toolCallId': tool_id, 'toolName': tool_name, 'args': tool_input})}\n"
    
    @staticmethod
    def encode_tool_call_start(tool_id: str, tool_name: str) -> str:
        """
        Signal start of streaming tool call.
        
        Args:
            tool_id: Unique ID for this tool call
            tool_name: Name of the tool
            
        Returns:
            Data stream protocol formatted string
        """
        return f"7:{json.dumps({'toolCallId': tool_id, 'toolName': tool_name})}\n"
    
    @staticmethod
    def encode_tool_call_delta(tool_id: str, args_delta: str) -> str:
        """
        Stream tool call argument delta.
        
        Args:
            tool_id: ID of the tool call
            args_delta: JSON string delta for arguments
            
        Returns:
            Data stream protocol formatted string
        """
        return f"8:{json.dumps({'toolCallId': tool_id, 'argsTextDelta': args_delta})}\n"
    
    @staticmethod
    def encode_tool_result(tool_id: str, result: str) -> str:
        """
        Encode tool result.
        
        Args:
            tool_id: ID of the tool call
            result: Result from tool execution (string or JSON string)
            
        Returns:
            Data stream protocol formatted string
        """
        return f"a:{json.dumps({'toolCallId': tool_id, 'result': result})}\n"
    
    @staticmethod
    def encode_data(data: Any) -> str:
        """
        Encode custom data (sent as array).
        
        Args:
            data: Data to send (will be wrapped in array if not already)
            
        Returns:
            Data stream protocol formatted string
        """
        if not isinstance(data, list):
            data = [data]
        return f"2:{json.dumps(data)}\n"
    
    @staticmethod
    def encode_error(error_message: str) -> str:
        """
        Encode error message.
        
        Args:
            error_message: Error description
            
        Returns:
            Data stream protocol formatted string
        """
        return f"3:{json.dumps(error_message)}\n"
    
    @staticmethod
    def encode_finish_message(
        stop_reason: str = "stop",
        usage: Optional[Dict[str, int]] = None,
        is_continued: bool = False
    ) -> str:
        """
        Encode finish message with reason and usage.
        
        Args:
            stop_reason: Why the response stopped (stop, tool-calls, length, error)
            usage: Token usage data with promptTokens and completionTokens
            is_continued: Whether more content will follow
            
        Returns:
            Data stream protocol formatted string
        """
        payload = {
            "finishReason": stop_reason,
            "usage": usage or {"promptTokens": 0, "completionTokens": 0},
            "isContinued": is_continued
        }
        return f"d:{json.dumps(payload)}\n"
    
    @staticmethod
    def encode_finish_step(
        stop_reason: str = "stop",
        usage: Optional[Dict[str, int]] = None,
        is_continued: bool = False
    ) -> str:
        """
        Encode finish step (for multi-step tool use).
        
        Args:
            stop_reason: Why the step stopped
            usage: Token usage data
            is_continued: Whether more steps will follow
            
        Returns:
            Data stream protocol formatted string
        """
        payload = {
            "finishReason": stop_reason,
            "usage": usage or {"promptTokens": 0, "completionTokens": 0},
            "isContinued": is_continued
        }
        return f"e:{json.dumps(payload)}\n"
    
    @staticmethod
    def encode_start_step(message_id: str) -> str:
        """
        Signal start of a new step.
        
        Args:
            message_id: Unique message identifier
            
        Returns:
            Data stream protocol formatted string
        """
        return f"f:{json.dumps({'messageId': message_id})}\n"


# ============================================================================
# Generative UI Stream Builder
# ============================================================================

class GenerativeUIStreamBuilder:
    """
    Build streaming Generative UI components.
    
    Supports streaming React components, charts, diagrams, and other
    interactive elements that can be rendered by the frontend.
    """
    
    @staticmethod
    def add_generative_ui_component(
        component_type: str,
        code: str,
        language: str = "jsx",
        component_id: Optional[str] = None,
        props: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add a UI component to the stream.
        
        Args:
            component_type: Type of component (react, chart, mermaid, html, svg)
            code: Component code/content
            language: Language for syntax highlighting
            component_id: Unique component identifier
            props: Additional component properties
            
        Returns:
            Data stream protocol formatted string with component data
        """
        component_data = [{
            "type": "artifact",
            "artifactType": component_type,
            "id": component_id or f"ui_{hash(code) % 100000}",
            "language": language,
            "content": code,
            "props": props or {}
        }]
        return f"2:{json.dumps(component_data)}\n"
    
    @staticmethod
    def add_react_component(
        code: str,
        component_name: str = "Component",
        component_id: Optional[str] = None
    ) -> str:
        """Add a React component artifact."""
        return GenerativeUIStreamBuilder.add_generative_ui_component(
            component_type="react",
            code=code,
            language="jsx",
            component_id=component_id,
            props={"name": component_name}
        )
    
    @staticmethod
    def add_chart(
        data: List[Dict],
        chart_type: str = "line",
        title: Optional[str] = None,
        config: Optional[Dict] = None
    ) -> str:
        """Add a chart component."""
        chart_data = [{
            "type": "component",
            "componentType": "chart",
            "chartType": chart_type,
            "data": data,
            "title": title,
            "config": config or {}
        }]
        return f"2:{json.dumps(chart_data)}\n"
    
    @staticmethod
    def add_mermaid_diagram(code: str, title: Optional[str] = None) -> str:
        """Add a Mermaid diagram."""
        return GenerativeUIStreamBuilder.add_generative_ui_component(
            component_type="mermaid",
            code=code,
            language="mermaid",
            props={"title": title}
        )
    
    @staticmethod
    def add_code_block(
        code: str,
        language: str,
        title: Optional[str] = None,
        artifact_id: Optional[str] = None
    ) -> str:
        """Add a syntax-highlighted code block."""
        return GenerativeUIStreamBuilder.add_generative_ui_component(
            component_type="code",
            code=code,
            language=language,
            component_id=artifact_id,
            props={"title": title, "showLineNumbers": True}
        )


# ============================================================================
# Claude Streaming Helper
# ============================================================================

async def stream_claude_response(
    client: Anthropic,
    model: str,
    system_prompt: str,
    messages: list,
    tools: Optional[list] = None,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """
    Stream a chat response from Anthropic API using AI SDK Data Stream Protocol.
    
    Args:
        client: Anthropic client
        model: Model to use
        system_prompt: System instructions
        messages: Message history
        tools: Available tools (optional)
        max_tokens: Maximum tokens in response
        
    Yields:
        AI SDK Data Stream Protocol formatted strings
    """
    encoder = VercelAIStreamEncoder()
    
    try:
        # Build request
        request_kwargs = {
            "model": model,
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": messages,
        }
        
        if tools:
            request_kwargs["tools"] = tools
        
        # Stream response using sync client with streaming
        with client.messages.stream(**request_kwargs) as stream:
            accumulated_content = ""
            current_tool = None
            
            for event in stream:
                # Handle content block start
                if event.type == "content_block_start":
                    if hasattr(event.content_block, "type"):
                        if event.content_block.type == "tool_use":
                            current_tool = {
                                "id": event.content_block.id,
                                "name": event.content_block.name,
                                "input": ""
                            }
                            yield encoder.encode_tool_call_start(
                                current_tool["id"],
                                current_tool["name"]
                            )
                
                # Handle content block delta
                elif event.type == "content_block_delta":
                    if hasattr(event.delta, "type"):
                        if event.delta.type == "text_delta":
                            text = event.delta.text
                            accumulated_content += text
                            yield encoder.encode_text(text)
                        
                        elif event.delta.type == "input_json_delta":
                            if current_tool:
                                delta = event.delta.partial_json
                                current_tool["input"] += delta
                                yield encoder.encode_tool_call_delta(
                                    current_tool["id"],
                                    delta
                                )
                
                # Handle content block stop
                elif event.type == "content_block_stop":
                    if current_tool and current_tool.get("input"):
                        # Emit complete tool call
                        try:
                            args = json.loads(current_tool["input"])
                        except json.JSONDecodeError:
                            args = {}
                        
                        yield encoder.encode_tool_call(
                            current_tool["id"],
                            current_tool["name"],
                            args
                        )
                        current_tool = None
            
            # Get final message for usage stats
            final_message = stream.get_final_message()
            usage = {
                "promptTokens": final_message.usage.input_tokens,
                "completionTokens": final_message.usage.output_tokens,
            }
            
            # Determine finish reason
            finish_reason = "stop"
            if final_message.stop_reason == "tool_use":
                finish_reason = "tool-calls"
            elif final_message.stop_reason == "max_tokens":
                finish_reason = "length"
            
            yield encoder.encode_finish_message(finish_reason, usage)
        
    except Exception as e:
        logger.error(f"Streaming error: {e}", exc_info=True)
        yield encoder.encode_error(str(e))


async def stream_with_artifacts(
    client: Anthropic,
    model: str,
    system_prompt: str,
    messages: list,
    tools: Optional[list] = None,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """
    Stream response with automatic artifact detection and streaming.
    
    Detects code artifacts (React, Mermaid, etc.) in the response and
    streams them as Generative UI components.
    
    Args:
        client: Anthropic client
        model: Model to use
        system_prompt: System instructions
        messages: Message history
        tools: Available tools (optional)
        max_tokens: Maximum tokens in response
        
    Yields:
        AI SDK Data Stream Protocol formatted strings including artifacts
    """
    from core.artifact_parser import ArtifactParser
    
    encoder = VercelAIStreamEncoder()
    ui_builder = GenerativeUIStreamBuilder()
    accumulated_content = ""
    
    try:
        request_kwargs = {
            "model": model,
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": messages,
        }
        
        if tools:
            request_kwargs["tools"] = tools
        
        with client.messages.stream(**request_kwargs) as stream:
            for event in stream:
                if event.type == "content_block_delta":
                    if hasattr(event.delta, "type") and event.delta.type == "text_delta":
                        text = event.delta.text
                        accumulated_content += text
                        yield encoder.encode_text(text)
            
            # Get final message
            final_message = stream.get_final_message()
            usage = {
                "promptTokens": final_message.usage.input_tokens,
                "completionTokens": final_message.usage.output_tokens,
            }
        
        # Detect and stream artifacts
        artifacts = ArtifactParser.extract_artifacts(accumulated_content)
        
        for artifact in artifacts:
            artifact_type = artifact.get('type', 'code')
            code = artifact.get('code', '')
            language = artifact.get('language', artifact_type)
            
            if artifact_type == 'react' or language in ['jsx', 'tsx']:
                yield ui_builder.add_react_component(
                    code=code,
                    component_name=artifact.get('id', 'Component'),
                    component_id=artifact.get('id')
                )
            elif artifact_type == 'mermaid':
                yield ui_builder.add_mermaid_diagram(code)
            else:
                yield ui_builder.add_code_block(
                    code=code,
                    language=language,
                    artifact_id=artifact.get('id')
                )
        
        yield encoder.encode_finish_message("stop", usage)
        
    except Exception as e:
        logger.error(f"Streaming with artifacts error: {e}", exc_info=True)
        yield encoder.encode_error(str(e))
