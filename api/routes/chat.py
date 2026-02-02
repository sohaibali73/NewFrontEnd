"""Chat/Agent routes with conversation history and Claude tools."""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic import Field
import json
import base64

from api.dependencies import get_current_user_id, get_user_api_keys
from core.claude_engine import ClaudeAFLEngine
from core.context_manager import build_optimized_context
from core.prompts import get_base_prompt, get_chat_prompt
from core.tools import get_all_tools, handle_tool_call
from core.artifact_parser import ArtifactParser
from db.supabase_client import get_supabase

router = APIRouter(prefix="/chat", tags=["Chat"])

class MessageCreate(BaseModel):
    content: str
    conversation_id: Optional[str] = None

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
            # Update title if it's still the default "New Conversation"
            if current_title == "New Conversation" or not current_title:
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
                                     "optimize_afl_code", "explain_afl_code", "sanity_check_afl"]:
                        result = handle_tool_call(
                            tool_name=tool_name,
                            tool_input=tool_input,
                            supabase_client=db,
                            api_key=api_keys.get("claude")
                        )

                        tools_used.append({
                            "tool": tool_name,
                            "input": tool_input,
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

        # Parse response for artifacts BEFORE saving
        parsed_message = ArtifactParser.prepare_message_with_artifacts(assistant_content)

        # Save assistant message with artifact metadata
        db.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": parsed_message['text'],  # Text without code blocks
            "metadata": {
                "artifacts": parsed_message['artifacts'],  # Store artifacts separately
                "has_artifacts": parsed_message['has_artifacts']
            }
        }).execute()

        # Update conversation timestamp
        db.table("conversations").update({
            "updated_at": "now()",
        }).eq("id", conversation_id).execute()

        # Return response with artifact data
        return {
            "conversation_id": conversation_id,
            "response": parsed_message['text'],
            "tools_used": tools_used if tools_used else None,
            "artifact": parsed_message['artifacts'][0] if parsed_message['artifacts'] else None,  # First artifact
            "all_artifacts": parsed_message['artifacts'],  # All artifacts for history
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

    # Delete messages first (foreign key)
    db.table("messages").delete().eq("conversation_id", conversation_id).execute()
    
    # Delete conversation
    db.table("conversations").delete().eq("id", conversation_id).execute()

    return {"status": "deleted", "conversation_id": conversation_id}