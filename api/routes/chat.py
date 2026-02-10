"""Chat/Agent routes with conversation history and Claude tools."""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic import Field
import json
import base64
import asyncio

from api.dependencies import get_current_user_id, get_user_api_keys
from core.claude_engine import ClaudeAFLEngine
from core.context_manager import build_optimized_context
from core.prompts import get_base_prompt, get_chat_prompt
from core.tools import get_all_tools, handle_tool_call, get_presentation_bytes
from core.artifact_parser import ArtifactParser
from core.streaming import (
    VercelAIStreamEncoder,
    GenerativeUIStreamBuilder,
    stream_claude_response,
    stream_with_artifacts
)
from db.supabase_client import get_supabase

router = APIRouter(prefix="/chat", tags=["Chat"])

class MessageCreate(BaseModel):
    content: str
    conversation_id: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"  # Default natural female voice

class ConversationCreate(BaseModel):
    title: str = "New Conversation"
    conversation_type: str = "agent"

@router.get("/conversations")
async def get_conversations(user_id: str = Depends(get_current_user_id)):
    """Get all conversations for user."""
    db = get_supabase()

    result = db.table("conversations").select("*").eq(
        "user_id", user_id
    ).order("updated_at", desc=True).execute()

    return result.data

@router.post("/conversations")
async def create_conversation(
        data: ConversationCreate,
        user_id: str = Depends(get_current_user_id),
):
    """Create a new conversation."""
    db = get_supabase()

    result = db.table("conversations").insert({
        "user_id": user_id,
        "title": data.title,
        "conversation_type": data.conversation_type,
    }).execute()

    return result.data[0]





@router.post("/conversations/{conversation_id}/upload")
async def upload_file(
        conversation_id: str,
        file: UploadFile = File(...),
        user_id: str = Depends(get_current_user_id),
):
    """Upload a file to a conversation."""
    db = get_supabase()

    # Verify conversation ownership
    conv = db.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).execute()

    if not conv.data or conv.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Read file content
    content = await file.read()

    # For images/PDFs, convert to base64
    if file.content_type.startswith('image/') or file.content_type == 'application/pdf':
        base64_content = base64.b64encode(content).decode('utf-8')
        file_data = {
            "filename": file.filename,
            "content_type": file.content_type,
            "base64_content": base64_content
        }
    else:
        # For text files, decode as text
        file_data = {
            "filename": file.filename,
            "content_type": file.content_type,
            "text_content": content.decode('utf-8', errors='ignore')
        }

    # Store file reference in database
    result = db.table("conversation_files").insert({
        "conversation_id": conversation_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "file_data": file_data
    }).execute()

    return {"file_id": result.data[0]["id"], "filename": file.filename}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
        conversation_id: str,
        user_id: str = Depends(get_current_user_id),
):
    """Get messages for a conversation."""
    db = get_supabase()

    # Verify ownership
    conv = db.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).execute()

    if not conv.data or conv.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = db.table("messages").select("*").eq(
        "conversation_id", conversation_id
    ).order("created_at").execute()

    return result.data

@router.post("/message")
async def send_message(
        data: MessageCreate,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """Send a message and get AI response with tool support."""
    db = get_supabase()

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    # Get or create conversation
    conversation_id = data.conversation_id
    is_new_conversation = False
    
    if not conversation_id:
        # Create new conversation with title from first message
        conv_result = db.table("conversations").insert({
            "user_id": user_id,
            "title": data.content[:50] + "..." if len(data.content) > 50 else data.content,
            "conversation_type": "agent",
        }).execute()
        conversation_id = conv_result.data[0]["id"]
        is_new_conversation = True
    else:
        # Check if this is the first message in an existing conversation with default title
        conv_check = db.table("conversations").select("title").eq("id", conversation_id).execute()
        if conv_check.data:
            current_title = conv_check.data[0].get("title", "")
            # Update title if it's still a default placeholder
            default_titles = ["New Conversation", "AFL Code Chat", "New Chat", "Untitled", ""]
            if current_title in default_titles or not current_title:
                new_title = data.content[:50] + "..." if len(data.content) > 50 else data.content
                db.table("conversations").update({
                    "title": new_title
                }).eq("id", conversation_id).execute()

    # Save user message
    db.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": data.content,
    }).execute()

    # Get conversation history
    history_result = db.table("messages").select("role, content").eq(
        "conversation_id", conversation_id
    ).order("created_at").execute()

    history = [{"role": m["role"], "content": m["content"]} for m in history_result.data[:-1]]

    # Generate response with tools
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_keys["claude"])

        # Enhanced system prompt with tool awareness
        system_prompt = f"""{get_base_prompt()}

{get_chat_prompt()}

## Available Tools
You have access to powerful tools to help users:

1. **Web Search** - Search the internet for real-time information, news, and data
2. **Execute Python** - Run Python code for calculations, data analysis, and complex computations
3. **Search Knowledge Base** - Search the user's uploaded documents and trading knowledge
4. **Get Stock Data** - Fetch real-time and historical stock market data
5. **Validate AFL** - Check AFL code for syntax errors before presenting it

Use these tools proactively when they would help provide better answers. For example:
- Use stock data when discussing specific securities
- Use knowledge base when the user asks about their uploaded strategies
- Use Python execution for complex calculations or backtesting math
- Use AFL validation before presenting trading system code
"""

        messages = history + [{"role": "user", "content": data.content}]

        # Get all tools (built-in + custom)
        tools = get_all_tools()
        
        # Track tool usage for the response
        tools_used = []
        
        # Initial API call with tools - reduced max_tokens for faster responses
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,  # Reduced from 4096 for faster responses
            system=system_prompt,
            messages=messages,
            tools=tools,
        )

        # Handle tool use loop (max 3 iterations for faster responses)
        max_iterations = 3
        iteration = 0

        while response.stop_reason == "tool_use" and iteration < max_iterations:
            iteration += 1
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input
                    tool_use_id = block.id

                    # Handle ONLY custom tools (Claude handles web_search internally)
                    if tool_name in ["execute_python", "search_knowledge_base", "get_stock_data",
                                     "validate_afl", "research_strategy", "search_sec_filings",
                                     "get_market_context", "generate_afl_code", "debug_afl_code",
                                     "optimize_afl_code", "explain_afl_code", "sanity_check_afl",
                                     "get_stock_chart", "technical_analysis", "get_weather",
                                     "get_news", "create_chart", "code_sandbox",
                                     "screen_stocks", "compare_stocks", "get_sector_performance",
                                     "calculate_position_size", "get_correlation_matrix",
                                     "get_dividend_info", "calculate_risk_metrics",
                                     "get_market_overview", "backtest_quick",
                                     "get_options_snapshot", "create_presentation"]:
                        result = handle_tool_call(
                            tool_name=tool_name,
                            tool_input=tool_input,
                            supabase_client=db,
                            api_key=api_keys.get("claude")
                        )

                        # Parse result for storage - include full output for UI persistence
                        try:
                            result_data = json.loads(result) if isinstance(result, str) else result
                        except (json.JSONDecodeError, TypeError):
                            result_data = {"raw": str(result)}

                        tools_used.append({
                            "tool": tool_name,
                            "input": tool_input,
                            "result": result_data,
                        })

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": result
                        })

            # Only continue loop if we have custom tool results to process
            if not tool_results:
                break

            # Add assistant's response with tool use
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # Add tool results
            messages.append({
                "role": "user",
                "content": tool_results
            })

            # Get next response (non-streaming)
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
                tools=tools,
            )

        # Extract final text content from response
        assistant_content = ""
        for block in response.content:
            if hasattr(block, 'text'):
                assistant_content += block.text

        # Parse response for artifacts and build parts array (AI SDK style)
        artifacts = ArtifactParser.extract_artifacts(assistant_content)
        
        # Build parts array following AI SDK Generative UI pattern
        parts = []
        last_index = 0
        
        for artifact in artifacts:
            # Add text part before this artifact
            if artifact['start'] > last_index:
                text_content = assistant_content[last_index:artifact['start']].strip()
                if text_content:
                    parts.append({
                        "type": "text",
                        "text": text_content
                    })
            
            # Add tool/artifact part with proper typing
            artifact_type = artifact['type']
            parts.append({
                "type": f"tool-{artifact_type}",  # e.g., "tool-mermaid", "tool-react", "tool-code"
                "state": "output-available",
                "output": {
                    "code": artifact['code'],
                    "language": artifact.get('language', artifact_type),
                    "id": artifact['id']
                }
            })
            
            last_index = artifact['end']
        
        # Add remaining text after last artifact
        if last_index < len(assistant_content):
            remaining_text = assistant_content[last_index:].strip()
            if remaining_text:
                parts.append({
                    "type": "text",
                    "text": remaining_text
                })
        
        # If no artifacts found, entire content is text
        if not artifacts:
            parts.append({
                "type": "text",
                "text": assistant_content
            })

        # Save assistant message with parts-based structure
        db.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": assistant_content,  # Keep original for reference
            "metadata": {
                "parts": parts,  # AI SDK style parts array
                "artifacts": artifacts,  # Legacy support
                "has_artifacts": len(artifacts) > 0
            }
        }).execute()

        # Update conversation timestamp
        db.table("conversations").update({
            "updated_at": "now()",
        }).eq("id", conversation_id).execute()

        # Return response with AI SDK style parts array
        return {
            "conversation_id": conversation_id,
            "response": assistant_content,  # Full content for backward compatibility
            "parts": parts,  # AI SDK Generative UI parts array
            "tools_used": tools_used if tools_used else None,
            "all_artifacts": artifacts,  # Legacy support
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_message(
        data: MessageCreate,
        user_id: str = Depends(get_current_user_id),
        api_keys: dict = Depends(get_user_api_keys),
):
    """
    Stream a message response using Vercel AI SDK Data Stream Protocol.
    
    FIXED: Now properly continues conversation after tool use by making
    follow-up API calls with tool results.
    """
    db = get_supabase()

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    # Get or create conversation
    conversation_id = data.conversation_id
    
    if not conversation_id:
        conv_result = db.table("conversations").insert({
            "user_id": user_id,
            "title": data.content[:50] + "..." if len(data.content) > 50 else data.content,
            "conversation_type": "agent",
        }).execute()
        conversation_id = conv_result.data[0]["id"]
    else:
        conv_check = db.table("conversations").select("title").eq("id", conversation_id).execute()
        if conv_check.data:
            current_title = conv_check.data[0].get("title", "")
            # Update title if it's still a default placeholder
            default_titles = ["New Conversation", "AFL Code Chat", "New Chat", "Untitled", ""]
            if current_title in default_titles or not current_title:
                new_title = data.content[:50] + "..." if len(data.content) > 50 else data.content
                db.table("conversations").update({
                    "title": new_title
                }).eq("id", conversation_id).execute()

    # Save user message
    db.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": data.content,
    }).execute()

    # Get conversation history (limit to last 10 for speed)
    history_result = db.table("messages").select("role, content").eq(
        "conversation_id", conversation_id
    ).order("created_at").limit(20).execute()

    history = [{"role": m["role"], "content": m["content"]} for m in history_result.data[:-1]][-10:]

    # Fetch uploaded files for this conversation to include in context
    file_context = ""
    try:
        files_result = db.table("conversation_files").select(
            "filename, content_type, file_data"
        ).eq("conversation_id", conversation_id).execute()
        
        if files_result.data:
            file_snippets = []
            for f in files_result.data:
                fd = f.get("file_data", {})
                filename = fd.get("filename", f.get("filename", "unknown"))
                if fd.get("text_content"):
                    # Include text file content (truncated)
                    content_preview = fd["text_content"][:2000]
                    file_snippets.append(f"### File: {filename}\n```\n{content_preview}\n```")
                elif fd.get("base64_content") and f.get("content_type", "").startswith("image/"):
                    file_snippets.append(f"### File: {filename} (image uploaded — available for analysis)")
                else:
                    file_snippets.append(f"### File: {filename} ({f.get('content_type', 'unknown type')})")
            
            if file_snippets:
                file_context = "\n\n## Uploaded Files in This Conversation:\n" + "\n\n".join(file_snippets)
    except Exception:
        pass  # conversation_files table may not exist

    # Pre-fetch knowledge base context for AFL-related queries
    kb_context = ""
    user_msg_lower = data.content.lower()
    if any(kw in user_msg_lower for kw in ["afl", "trading", "strategy", "indicator", "backtest", "buy", "sell"]):
        try:
            kb_result = db.table("brain_documents").select(
                "title, summary, raw_content"
            ).limit(3).execute()
            
            if kb_result.data:
                kb_snippets = []
                for doc in kb_result.data:
                    snippet = doc.get("summary", "") or doc.get("raw_content", "")[:300]
                    if snippet:
                        kb_snippets.append(f"- {doc['title']}: {snippet[:200]}")
                if kb_snippets:
                    kb_context = "\n\n## User's Knowledge Base (relevant documents):\n" + "\n".join(kb_snippets)
        except Exception:
            pass  # KB not available, continue without

    async def generate_stream():
        """Generate the streaming response with proper tool continuation."""
        encoder = VercelAIStreamEncoder()
        builder = GenerativeUIStreamBuilder()
        accumulated_content = ""
        tools_used = []
        
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_keys["claude"])

            # System prompt (includes file context and KB context)
            system_prompt = f"""{get_base_prompt()}

{get_chat_prompt()}
{file_context}
{kb_context}

## Tools Available (use when helpful):
- **web_search**: Search the internet for current information
- **get_stock_data**: Real-time stock prices (cached 5min)
- **search_knowledge_base**: User's uploaded documents
- **generate_afl_code**: Create AFL trading systems
- **validate_afl/sanity_check_afl**: Verify AFL code
- **execute_python**: Run calculations

Be direct and helpful. Generate AFL code when asked. After using tools, always provide a helpful response summarizing the results."""

            messages = history + [{"role": "user", "content": data.content}]
            tools = get_all_tools()
            
            max_iterations = 3
            iteration = 0
            
            while iteration < max_iterations:
                iteration += 1
                tool_results_for_next_call = []
                assistant_content_blocks = []
                
                # Stream the response
                with client.messages.stream(
                    model="claude-sonnet-4-20250514",
                    max_tokens=3000,
                    system=system_prompt,
                    messages=messages,
                    tools=tools,
                ) as stream:
                    pending_tool_calls = []
                    
                    for event in stream:
                        if event.type == "content_block_start":
                            if hasattr(event.content_block, 'type'):
                                if event.content_block.type == "tool_use":
                                    pending_tool_calls.append({
                                        "id": event.content_block.id,
                                        "name": event.content_block.name,
                                        "input": ""
                                    })
                                    
                        elif event.type == "content_block_delta":
                            if hasattr(event.delta, 'type'):
                                if event.delta.type == "text_delta":
                                    text = event.delta.text
                                    accumulated_content += text
                                    yield encoder.encode_text(text)
                                    
                                elif event.delta.type == "input_json_delta":
                                    if pending_tool_calls:
                                        pending_tool_calls[-1]["input"] += event.delta.partial_json
                                        
                        elif event.type == "content_block_stop":
                            if pending_tool_calls and pending_tool_calls[-1].get("input"):
                                tool_call = pending_tool_calls[-1]
                                try:
                                    tool_input = json.loads(tool_call["input"]) if tool_call["input"] else {}
                                except json.JSONDecodeError:
                                    tool_input = {}
                                
                                tool_call_id = tool_call["id"]
                                tool_name = tool_call["name"]
                                
                                # Emit tool call to frontend
                                yield encoder.encode_tool_call(tool_call_id, tool_name, tool_input)
                                
                                # Execute custom tool (not web_search - Claude handles that internally)
                                if tool_name not in ["web_search"]:
                                        try:
                                            result = handle_tool_call(
                                                tool_name=tool_name,
                                                tool_input=tool_input,
                                                supabase_client=db,
                                                api_key=api_keys.get("claude")
                                            )
                                        except Exception as tool_error:
                                            result = json.dumps({"error": str(tool_error)})
                                    
                                        # Parse result for persistence - include full output for UI
                                        try:
                                            result_data = json.loads(result) if isinstance(result, str) else result
                                        except (json.JSONDecodeError, TypeError):
                                            result_data = {"raw": str(result)}

                                        tools_used.append({
                                            "tool": tool_name,
                                            "input": tool_input,
                                            "result": result_data,
                                        })
                                    
                                        # Emit tool result to frontend
                                        yield encoder.encode_tool_result(tool_call_id, result)
                                    
                                        # Store for continuation
                                        tool_results_for_next_call.append({
                                            "type": "tool_result",
                                            "tool_use_id": tool_call_id,
                                            "content": result
                                        })
                                    
                                        # Store tool use block for messages
                                        assistant_content_blocks.append({
                                            "type": "tool_use",
                                            "id": tool_call_id,
                                            "name": tool_name,
                                            "input": tool_input
                                        })
                                
                                pending_tool_calls.pop()

                    # Get final message
                    final_message = stream.get_final_message()
                
                # Check if we need to continue (tool was used)
                if final_message.stop_reason == "tool_use" and tool_results_for_next_call:
                    # Add assistant's tool use to messages
                    messages.append({
                        "role": "assistant",
                        "content": final_message.content
                    })
                    # Add tool results
                    messages.append({
                        "role": "user",
                        "content": tool_results_for_next_call
                    })
                    # Continue loop to get Claude's follow-up response
                else:
                    # No more tool use, we're done
                    break
            
            # Parse for artifacts from accumulated content
            artifacts = ArtifactParser.extract_artifacts(accumulated_content)
            
            # Stream artifacts as Generative UI components
            for artifact in artifacts:
                artifact_type = artifact.get('type', 'code')
                code = artifact.get('code', '')
                language = artifact.get('language', artifact_type)
                artifact_id = artifact.get('id', f"artifact_{hash(code) % 10000}")
                
                yield builder.add_generative_ui_component(
                    component_type=artifact_type,
                    code=code,
                    language=language,
                    component_id=artifact_id
                )
            
            # Build parts for storage
            parts = []
            last_index = 0
            
            for artifact in artifacts:
                if artifact['start'] > last_index:
                    text_content = accumulated_content[last_index:artifact['start']].strip()
                    if text_content:
                        parts.append({"type": "text", "text": text_content})
                
                parts.append({
                    "type": f"tool-{artifact['type']}",
                    "state": "output-available",
                    "output": {
                        "code": artifact['code'],
                        "language": artifact.get('language', artifact['type']),
                        "id": artifact['id']
                    }
                })
                last_index = artifact['end']
            
            if last_index < len(accumulated_content):
                remaining_text = accumulated_content[last_index:].strip()
                if remaining_text:
                    parts.append({"type": "text", "text": remaining_text})
            
            if not artifacts and accumulated_content:
                parts.append({"type": "text", "text": accumulated_content})
            
            # Save assistant message
            if accumulated_content or tools_used:
                db.table("messages").insert({
                    "conversation_id": conversation_id,
                    "role": "assistant",
                    "content": accumulated_content or "(Tool results returned)",
                    "metadata": {
                        "parts": parts,
                        "artifacts": artifacts,
                        "has_artifacts": len(artifacts) > 0,
                        "tools_used": tools_used
                    }
                }).execute()
            
            # Update conversation timestamp
            db.table("conversations").update({
                "updated_at": "now()",
            }).eq("id", conversation_id).execute()
            
            # Send usage data
            usage = {
                "promptTokens": final_message.usage.input_tokens if final_message else 0,
                "completionTokens": final_message.usage.output_tokens if final_message else 0
            }
            
            # Emit custom data with conversation info
            yield encoder.encode_data({
                "conversation_id": conversation_id,
                "tools_used": tools_used,
                "has_artifacts": len(artifacts) > 0
            })
            
            # Finish message
            yield encoder.encode_finish_message("stop", usage)
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()[:500]}"
            yield encoder.encode_text(f"\n\nError: {str(e)}")
            yield encoder.encode_error(error_msg)
            yield encoder.encode_finish_message("error")

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8",
            "X-Conversation-Id": conversation_id,
            "Access-Control-Expose-Headers": "X-Conversation-Id",
            "Access-Control-Allow-Origin": "*",
        }
    )


@router.get("/tools")
async def list_available_tools():
    """List all available tools for the chat agent."""
    tools = get_all_tools()
    
    tool_info = []
    for tool in tools:
        if "input_schema" in tool:
            # Custom tool
            tool_info.append({
                "name": tool["name"],
                "description": tool["description"],
                "type": "custom",
                "parameters": list(tool["input_schema"]["properties"].keys())
            })
        else:
            # Built-in tool
            tool_info.append({
                "name": tool.get("name", tool.get("type", "unknown")),
                "type": "built-in",
                "description": "Anthropic built-in tool"
            })
    
    return {
        "tools": tool_info,
        "count": len(tool_info)
    }


class ConversationUpdate(BaseModel):
    title: Optional[str] = None


@router.patch("/conversations/{conversation_id}")
async def update_conversation(
        conversation_id: str,
        data: ConversationUpdate,
        user_id: str = Depends(get_current_user_id),
):
    """Update a conversation (rename, etc.)."""
    db = get_supabase()

    # Verify ownership
    conv = db.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).execute()

    if not conv.data or conv.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    updates = {}
    if data.title is not None:
        updates["title"] = data.title
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("conversations").update(updates).eq(
        "id", conversation_id
    ).execute()

    return result.data[0] if result.data else {"status": "updated"}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
        conversation_id: str,
        user_id: str = Depends(get_current_user_id),
):
    """Delete a conversation and all its messages."""
    db = get_supabase()

    # Verify ownership
    conv = db.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).execute()

    if not conv.data or conv.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete related records first (foreign keys)
    try:
        db.table("conversation_files").delete().eq("conversation_id", conversation_id).execute()
    except Exception:
        pass  # Table may not exist or no files
    db.table("messages").delete().eq("conversation_id", conversation_id).execute()
    
    # Delete conversation
    db.table("conversations").delete().eq("id", conversation_id).execute()

    return {"status": "deleted", "conversation_id": conversation_id}


@router.post("/tts")
async def text_to_speech(
    data: TTSRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Convert text to speech using edge-tts (Microsoft Edge TTS).
    Returns an MP3 audio stream. No API key needed.
    
    Available voices:
    - en-US-AriaNeural (female, default)
    - en-US-GuyNeural (male)
    - en-US-JennyNeural (female)
    - en-GB-SoniaNeural (British female)
    - en-AU-NatashaNeural (Australian female)
    """
    import io
    
    if not data.text or not data.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    # Limit text length to prevent abuse
    text = data.text[:5000]
    
    # Strip markdown formatting for cleaner speech
    import re
    text = re.sub(r'```[\s\S]*?```', ' code block omitted ', text)  # Remove code blocks
    text = re.sub(r'`[^`]+`', '', text)  # Remove inline code
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Links → just text
    text = re.sub(r'[#*_~>|]', '', text)  # Remove markdown symbols
    text = re.sub(r'\n{2,}', '. ', text)  # Double newlines → period
    text = re.sub(r'\n', ' ', text)  # Single newlines → space
    text = text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="No speakable text after processing")
    
    try:
        import edge_tts
        
        communicate = edge_tts.Communicate(text, data.voice)
        
        # Collect audio chunks into buffer
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        
        audio_buffer.seek(0)
        
        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=tts.mp3",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except ImportError:
        raise HTTPException(status_code=500, detail="edge-tts not installed. Run: pip install edge-tts")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.get("/presentation/{presentation_id}")
async def download_presentation(presentation_id: str):
    """Download a generated PowerPoint presentation by ID."""
    import io

    pptx_bytes = get_presentation_bytes(presentation_id)
    if pptx_bytes is None:
        raise HTTPException(status_code=404, detail="Presentation not found or expired")

    return StreamingResponse(
        io.BytesIO(pptx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": f'attachment; filename="presentation.pptx"',
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/tts/voices")
async def list_tts_voices():
    """List available TTS voices."""
    try:
        import edge_tts
        voices = await edge_tts.list_voices()
        # Filter to English voices only for simplicity
        english_voices = [
            {"name": v["ShortName"], "gender": v["Gender"], "locale": v["Locale"]}
            for v in voices if v["Locale"].startswith("en-")
        ]
        return {"voices": english_voices, "count": len(english_voices)}
    except ImportError:
        return {"voices": [
            {"name": "en-US-AriaNeural", "gender": "Female", "locale": "en-US"},
            {"name": "en-US-GuyNeural", "gender": "Male", "locale": "en-US"},
            {"name": "en-US-JennyNeural", "gender": "Female", "locale": "en-US"},
            {"name": "en-GB-SoniaNeural", "gender": "Female", "locale": "en-GB"},
        ], "count": 4, "note": "edge-tts not installed, showing defaults"}


@router.post("/v6")
async def chat_v6_stream(
    data: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    api_keys: dict = Depends(get_user_api_keys),
):
    """
    Direct AI SDK Data Stream Protocol endpoint.
    Bypasses the protocol translation wrapper for cleaner integration.
    """
    db = get_supabase()

    if not api_keys.get("claude"):
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    # Get or create conversation
    conversation_id = data.conversation_id
    
    if not conversation_id:
        conv_result = db.table("conversations").insert({
            "user_id": user_id,
            "title": data.content[:50] + "..." if len(data.content) > 50 else data.content,
            "conversation_type": "agent",
        }).execute()
        conversation_id = conv_result.data[0]["id"]
    else:
        conv_check = db.table("conversations").select("title").eq("id", conversation_id).execute()
        if conv_check.data:
            current_title = conv_check.data[0].get("title", "")
            default_titles = ["New Conversation", "AFL Code Chat", "New Chat", "Untitled", ""]
            if current_title in default_titles or not current_title:
                new_title = data.content[:50] + "..." if len(data.content) > 50 else data.content
                db.table("conversations").update({
                    "title": new_title
                }).eq("id", conversation_id).execute()

    # Save user message
    db.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": data.content,
    }).execute()

    # Get conversation history (limit to last 10 for speed)
    history_result = db.table("messages").select("role, content").eq(
        "conversation_id", conversation_id
    ).order("created_at").limit(20).execute()

    history = [{"role": m["role"], "content": m["content"]} for m in history_result.data[:-1]][-10:]

    # Fetch uploaded files for this conversation to include in context
    file_context = ""
    try:
        files_result = db.table("conversation_files").select(
            "filename, content_type, file_data"
        ).eq("conversation_id", conversation_id).execute()
        
        if files_result.data:
            file_snippets = []
            for f in files_result.data:
                fd = f.get("file_data", {})
                filename = fd.get("filename", f.get("filename", "unknown"))
                if fd.get("text_content"):
                    content_preview = fd["text_content"][:2000]
                    file_snippets.append(f"### File: {filename}\n```\n{content_preview}\n```")
                elif fd.get("base64_content") and f.get("content_type", "").startswith("image/"):
                    file_snippets.append(f"### File: {filename} (image uploaded — available for analysis)")
                else:
                    file_snippets.append(f"### File: {filename} ({f.get('content_type', 'unknown type')})")
            
            if file_snippets:
                file_context = "\n\n## Uploaded Files in This Conversation:\n" + "\n\n".join(file_snippets)
    except Exception:
        pass  # conversation_files table may not exist

    # Pre-fetch knowledge base context for AFL-related queries
    kb_context = ""
    user_msg_lower = data.content.lower()
    if any(kw in user_msg_lower for kw in ["afl", "trading", "strategy", "indicator", "backtest", "buy", "sell"]):
        try:
            kb_result = db.table("brain_documents").select(
                "title, summary, raw_content"
            ).limit(3).execute()
            
            if kb_result.data:
                kb_snippets = []
                for doc in kb_result.data:
                    snippet = doc.get("summary", "") or doc.get("raw_content", "")[:300]
                    if snippet:
                        kb_snippets.append(f"- {doc['title']}: {snippet[:200]}")
                if kb_snippets:
                    kb_context = "\n\n## User's Knowledge Base (relevant documents):\n" + "\n".join(kb_snippets)
        except Exception:
            pass  # KB not available, continue without

    async def generate_stream():
        """Generate the streaming response using direct Data Stream Protocol."""
        encoder = VercelAIStreamEncoder()
        builder = GenerativeUIStreamBuilder()
        accumulated_content = ""
        tools_used = []
        
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_keys["claude"])

            system_prompt = f"""{get_base_prompt()}

{get_chat_prompt()}
{file_context}
{kb_context}

## Tools Available (use when helpful):
- **web_search**: Search the internet for current information
- **get_stock_data**: Real-time stock prices (cached 5min)
- **search_knowledge_base**: User's uploaded documents
- **generate_afl_code**: Create AFL trading systems
- **validate_afl/sanity_check_afl**: Verify AFL code
- **execute_python**: Run calculations

Be direct and helpful. Generate AFL code when asked. After using tools, always provide a helpful response summarizing the results."""

            messages = history + [{"role": "user", "content": data.content}]
            tools = get_all_tools()
            
            max_iterations = 3
            iteration = 0
            
            while iteration < max_iterations:
                iteration += 1
                tool_results_for_next_call = []
                assistant_content_blocks = []
                
                with client.messages.stream(
                    model="claude-sonnet-4-20250514",
                    max_tokens=3000,
                    system=system_prompt,
                    messages=messages,
                    tools=tools,
                ) as stream:
                    pending_tool_calls = []
                    
                    for event in stream:
                        if event.type == "content_block_start":
                            if hasattr(event.content_block, 'type'):
                                if event.content_block.type == "tool_use":
                                    pending_tool_calls.append({
                                        "id": event.content_block.id,
                                        "name": event.content_block.name,
                                        "input": ""
                                    })
                                    
                        elif event.type == "content_block_delta":
                            if hasattr(event.delta, 'type'):
                                if event.delta.type == "text_delta":
                                    text = event.delta.text
                                    accumulated_content += text
                                    yield encoder.encode_text(text)
                                    
                                elif event.delta.type == "input_json_delta":
                                    if pending_tool_calls:
                                        pending_tool_calls[-1]["input"] += event.delta.partial_json
                                        
                        elif event.type == "content_block_stop":
                            if pending_tool_calls and pending_tool_calls[-1].get("input"):
                                tool_call = pending_tool_calls[-1]
                                try:
                                    tool_input = json.loads(tool_call["input"]) if tool_call["input"] else {}
                                except json.JSONDecodeError:
                                    tool_input = {}
                                
                                tool_call_id = tool_call["id"]
                                tool_name = tool_call["name"]
                                
                                yield encoder.encode_tool_call(tool_call_id, tool_name, tool_input)
                                
                                if tool_name not in ["web_search"]:
                                    try:
                                        result = handle_tool_call(
                                            tool_name=tool_name,
                                            tool_input=tool_input,
                                            supabase_client=db,
                                            api_key=api_keys.get("claude")
                                        )
                                    except Exception as tool_error:
                                        result = json.dumps({"error": str(tool_error)})
                                    
                                    try:
                                        result_data = json.loads(result) if isinstance(result, str) else result
                                    except (json.JSONDecodeError, TypeError):
                                        result_data = {"raw": str(result)}

                                    tools_used.append({
                                        "tool": tool_name,
                                        "input": tool_input,
                                        "result": result_data,
                                    })
                                    
                                    yield encoder.encode_tool_result(tool_call_id, result)
                                    
                                    tool_results_for_next_call.append({
                                        "type": "tool_result",
                                        "tool_use_id": tool_call_id,
                                        "content": result
                                    })
                                    
                                    assistant_content_blocks.append({
                                        "type": "tool_use",
                                        "id": tool_call_id,
                                        "name": tool_name,
                                        "input": tool_input
                                    })
                                
                                pending_tool_calls.pop()

                    final_message = stream.get_final_message()
                
                if final_message.stop_reason == "tool_use" and tool_results_for_next_call:
                    messages.append({
                        "role": "assistant",
                        "content": final_message.content
                    })
                    messages.append({
                        "role": "user",
                        "content": tool_results_for_next_call
                    })
                else:
                    break
            
            artifacts = ArtifactParser.extract_artifacts(accumulated_content)
            
            for artifact in artifacts:
                artifact_type = artifact.get('type', 'code')
                code = artifact.get('code', '')
                language = artifact.get('language', artifact_type)
                artifact_id = artifact.get('id', f"artifact_{hash(code) % 10000}")
                
                yield builder.add_generative_ui_component(
                    component_type=artifact_type,
                    code=code,
                    language=language,
                    component_id=artifact_id
                )
            
            # Build parts for storage
            parts = []
            last_index = 0
            
            for artifact in artifacts:
                if artifact['start'] > last_index:
                    text_content = accumulated_content[last_index:artifact['start']].strip()
                    if text_content:
                        parts.append({"type": "text", "text": text_content})
                
                parts.append({
                    "type": f"tool-{artifact['type']}",
                    "state": "output-available",
                    "output": {
                        "code": artifact['code'],
                        "language": artifact.get('language', artifact['type']),
                        "id": artifact['id']
                    }
                })
                last_index = artifact['end']
            
            if last_index < len(accumulated_content):
                remaining_text = accumulated_content[last_index:].strip()
                if remaining_text:
                    parts.append({"type": "text", "text": remaining_text})
            
            if not artifacts and accumulated_content:
                parts.append({"type": "text", "text": accumulated_content})
            
            # Save assistant message
            if accumulated_content or tools_used:
                db.table("messages").insert({
                    "conversation_id": conversation_id,
                    "role": "assistant",
                    "content": accumulated_content or "(Tool results returned)",
                    "metadata": {
                        "parts": parts,
                        "artifacts": artifacts,
                        "has_artifacts": len(artifacts) > 0,
                        "tools_used": tools_used
                    }
                }).execute()
            
            # Update conversation timestamp
            db.table("conversations").update({
                "updated_at": "now()",
            }).eq("id", conversation_id).execute()
            
            usage = {
                "promptTokens": final_message.usage.input_tokens if final_message else 0,
                "completionTokens": final_message.usage.output_tokens if final_message else 0
            }
            
            yield encoder.encode_data({
                "conversation_id": conversation_id,
                "tools_used": tools_used,
                "has_artifacts": len(artifacts) > 0
            })
            
            yield encoder.encode_finish_message("stop", usage)
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()[:500]}"
            yield encoder.encode_text(f"\n\nError: {str(e)}")
            yield encoder.encode_error(error_msg)
            yield encoder.encode_finish_message("error")

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8",
            "X-Conversation-Id": conversation_id,
            "Access-Control-Expose-Headers": "X-Conversation-Id",
            "Access-Control-Allow-Origin": "*",
        }
    )
