"""
Vercel AI SDK Streaming Support

This module implements the Vercel AI SDK Data Stream Protocol for streaming
AI responses with support for:
- Text streaming
- Tool calls (Generative UI)
- Tool results
- Finish signals

Protocol reference: https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
"""

import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from enum import Enum
from dataclasses import dataclass, asdict
import uuid


class StreamPartType(Enum):
    """Vercel AI SDK stream part types."""
    TEXT = "0"           # Text delta
    TOOL_CALL = "9"      # Tool call (start)
    TOOL_RESULT = "a"    # Tool result
    DATA = "2"           # Custom data
    ERROR = "3"          # Error
    FINISH_MESSAGE = "d" # Finish message with metadata
    FINISH_STEP = "e"    # Finish step


@dataclass
class ToolCall:
    """Represents a tool call in progress."""
    tool_call_id: str
    tool_name: str
    args: Dict[str, Any]
    state: str = "partial-call"  # partial-call, call, result


@dataclass
class ToolResult:
    """Represents a tool call result."""
    tool_call_id: str
    result: Any


class VercelAIStreamEncoder:
    """Encodes responses in Vercel AI SDK Data Stream Protocol format."""
    
    @staticmethod
    def encode_text(text: str) -> str:
        """Encode a text chunk."""
        return f"0:{json.dumps(text)}\n"
    
    @staticmethod
    def encode_tool_call(tool_call_id: str, tool_name: str, args: Dict[str, Any]) -> str:
        """Encode a tool call."""
        data = {
            "toolCallId": tool_call_id,
            "toolName": tool_name,
            "args": args
        }
        return f"9:{json.dumps(data)}\n"
    
    @staticmethod
    def encode_tool_result(tool_call_id: str, result: Any) -> str:
        """Encode a tool result."""
        data = {
            "toolCallId": tool_call_id,
            "result": result
        }
        return f"a:{json.dumps(data)}\n"
    
    @staticmethod
    def encode_data(data: Any) -> str:
        """Encode custom data."""
        return f"2:{json.dumps([data])}\n"
    
    @staticmethod
    def encode_error(error: str) -> str:
        """Encode an error."""
        return f"3:{json.dumps(error)}\n"
    
    @staticmethod
    def encode_finish_message(
        finish_reason: str = "stop",
        usage: Optional[Dict[str, int]] = None
    ) -> str:
        """Encode finish message with metadata."""
        data = {
            "finishReason": finish_reason,
            "usage": usage or {"promptTokens": 0, "completionTokens": 0}
        }
        return f"d:{json.dumps(data)}\n"
    
    @staticmethod
    def encode_finish_step(
        finish_reason: str = "stop",
        is_continue: bool = False
    ) -> str:
        """Encode finish step."""
        data = {
            "finishReason": finish_reason,
            "isContinued": is_continue
        }
        return f"e:{json.dumps(data)}\n"


class GenerativeUIStreamBuilder:
    """Builds streaming responses with Generative UI tool parts."""
    
    def __init__(self):
        self.encoder = VercelAIStreamEncoder()
        self.tool_calls: List[ToolCall] = []
        self.accumulated_text = ""
        
    def add_text(self, text: str) -> str:
        """Add text to the stream."""
        self.accumulated_text += text
        return self.encoder.encode_text(text)
    
    def start_tool_call(self, tool_name: str, args: Dict[str, Any]) -> tuple[str, str]:
        """
        Start a tool call (for Generative UI component rendering).
        Returns the encoded string and the tool_call_id.
        """
        tool_call_id = f"call_{uuid.uuid4().hex[:12]}"
        tool_call = ToolCall(
            tool_call_id=tool_call_id,
            tool_name=tool_name,
            args=args,
            state="call"
        )
        self.tool_calls.append(tool_call)
        return self.encoder.encode_tool_call(tool_call_id, tool_name, args), tool_call_id
    
    def complete_tool_call(self, tool_call_id: str, result: Any) -> str:
        """Complete a tool call with its result."""
        # Update state
        for tc in self.tool_calls:
            if tc.tool_call_id == tool_call_id:
                tc.state = "result"
                break
        return self.encoder.encode_tool_result(tool_call_id, result)
    
    def add_generative_ui_component(
        self, 
        component_type: str, 
        code: str, 
        language: str = None,
        component_id: str = None
    ) -> str:
        """
        Add a Generative UI component (rendered as tool result).
        
        Args:
            component_type: Type of component (react, mermaid, chart, code, etc.)
            code: The code/content for the component
            language: Optional language for code blocks
            component_id: Optional unique ID for the component
        
        Returns:
            Encoded stream data for the component
        """
        tool_call_id = f"call_{uuid.uuid4().hex[:12]}"
        component_id = component_id or f"artifact_{uuid.uuid4().hex[:8]}"
        
        # Encode as tool call with component type
        tool_name = f"render_{component_type}"
        args = {
            "code": code,
            "language": language or component_type,
            "id": component_id
        }
        
        # Send tool call start
        call_data = self.encoder.encode_tool_call(tool_call_id, tool_name, args)
        
        # Immediately send tool result (component is ready)
        result_data = self.encoder.encode_tool_result(tool_call_id, {
            "type": f"tool-{component_type}",
            "state": "output-available",
            "output": {
                "code": code,
                "language": language or component_type,
                "id": component_id
            }
        })
        
        return call_data + result_data
    
    def finish(self, finish_reason: str = "stop", usage: Dict[str, int] = None) -> str:
        """Finish the stream."""
        return self.encoder.encode_finish_message(finish_reason, usage)


async def stream_claude_response(
    client,
    messages: List[Dict[str, Any]],
    system_prompt: str,
    tools: List[Dict] = None,
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 4096,
    on_tool_call: callable = None
) -> AsyncGenerator[str, None]:
    """
    Stream Claude response in Vercel AI SDK format.
    
    Args:
        client: Anthropic client
        messages: Conversation messages
        system_prompt: System prompt
        tools: Available tools
        model: Model to use
        max_tokens: Maximum tokens
        on_tool_call: Callback for tool calls
        
    Yields:
        Vercel AI SDK formatted stream chunks
    """
    builder = GenerativeUIStreamBuilder()
    encoder = VercelAIStreamEncoder()
    
    try:
        # Create streaming message
        with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages,
            tools=tools or [],
        ) as stream:
            current_text = ""
            pending_tool_calls = []
            
            for event in stream:
                if event.type == "content_block_start":
                    if hasattr(event.content_block, 'type'):
                        if event.content_block.type == "tool_use":
                            # Start of tool call
                            pending_tool_calls.append({
                                "id": event.content_block.id,
                                "name": event.content_block.name,
                                "input": ""
                            })
                            
                elif event.type == "content_block_delta":
                    if hasattr(event.delta, 'type'):
                        if event.delta.type == "text_delta":
                            # Stream text
                            text = event.delta.text
                            current_text += text
                            yield encoder.encode_text(text)
                            
                        elif event.delta.type == "input_json_delta":
                            # Accumulate tool input
                            if pending_tool_calls:
                                pending_tool_calls[-1]["input"] += event.delta.partial_json
                                
                elif event.type == "content_block_stop":
                    # Check if we completed a tool call
                    if pending_tool_calls:
                        tool_call = pending_tool_calls[-1]
                        try:
                            tool_input = json.loads(tool_call["input"]) if tool_call["input"] else {}
                        except json.JSONDecodeError:
                            tool_input = {}
                        
                        tool_call_id = tool_call["id"]
                        tool_name = tool_call["name"]
                        
                        # Encode tool call
                        yield encoder.encode_tool_call(tool_call_id, tool_name, tool_input)
                        
                        # Handle tool call if callback provided
                        if on_tool_call:
                            result = await on_tool_call(tool_name, tool_input)
                            yield encoder.encode_tool_result(tool_call_id, result)
                        
                        pending_tool_calls.pop()
                        
                elif event.type == "message_stop":
                    # Message complete
                    pass
            
            # Get final message for usage stats
            final_message = stream.get_final_message()
            usage = {
                "promptTokens": final_message.usage.input_tokens if final_message else 0,
                "completionTokens": final_message.usage.output_tokens if final_message else 0
            }
            
            # Send finish
            yield encoder.encode_finish_message("stop", usage)
            
    except Exception as e:
        yield encoder.encode_error(str(e))
        yield encoder.encode_finish_message("error")


async def stream_with_artifacts(
    response_text: str,
    artifacts: List[Dict[str, Any]]
) -> AsyncGenerator[str, None]:
    """
    Stream a pre-generated response with artifacts in Vercel AI SDK format.
    
    Args:
        response_text: The text response (may contain artifact placeholders)
        artifacts: List of artifacts to stream as UI components
        
    Yields:
        Vercel AI SDK formatted stream chunks
    """
    encoder = VercelAIStreamEncoder()
    builder = GenerativeUIStreamBuilder()
    
    # Track artifact positions
    artifact_map = {a['id']: a for a in artifacts}
    
    # Simple approach: stream text, then stream artifacts
    # For a more sophisticated approach, parse and interleave
    
    # Stream the text content
    # Remove artifact code blocks from text for cleaner streaming
    import re
    clean_text = re.sub(r'```\w*\n.*?```', '[ARTIFACT]', response_text, flags=re.DOTALL)
    
    # Stream text in chunks
    chunk_size = 50  # Characters per chunk
    for i in range(0, len(clean_text), chunk_size):
        chunk = clean_text[i:i + chunk_size]
        yield encoder.encode_text(chunk)
        await asyncio.sleep(0.01)  # Small delay for realistic streaming
    
    yield encoder.encode_text("\n\n")
    
    # Stream artifacts as tool results (Generative UI components)
    for artifact in artifacts:
        artifact_type = artifact.get('type', 'code')
        code = artifact.get('code', '')
        language = artifact.get('language', artifact_type)
        artifact_id = artifact.get('id', f"artifact_{uuid.uuid4().hex[:8]}")
        
        # Create tool call for the artifact
        yield builder.add_generative_ui_component(
            component_type=artifact_type,
            code=code,
            language=language,
            component_id=artifact_id
        )
        await asyncio.sleep(0.05)
    
    # Finish
    yield encoder.encode_finish_message("stop")
