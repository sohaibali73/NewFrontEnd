# Generative UI Persistence Fix — Technical Specification

## Problem Statement

When a user triggers a tool call (e.g., "What's the weather in Poughkeepsie?"), the Vercel AI SDK renders a rich React component (WeatherCard) during streaming. This component exists as an in-memory part of the `useChat` message state. When the user navigates away and returns, the message is reloaded from the backend database, but only the text content is restored — the tool result component is gone.

## Root Cause Analysis

### The Three-Layer Gap

```
┌─────────────────────────────────────────────────────┐
│  DURING STREAMING (works)                           │
│                                                     │
│  Backend streams: 7: tool-start → 9: tool-input     │
│                   → a: tool-output                   │
│  Frontend route.ts translates to SSE:                │
│    tool-input-start → tool-input-available           │
│    → tool-output-available                           │
│  AI SDK useChat builds message.parts:                │
│    [{type: 'tool-get_weather',                       │
│      state: 'output-available',                      │
│      input: {location: 'Poughkeepsie'},              │
│      output: {temp: 32, ...}}]                       │
│  renderMessage matches case 'tool-get_weather'       │
│    → renders <WeatherCard temp={32} ... />           │
│                                                     │
│  ✅ THIS WORKS PERFECTLY                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ON RELOAD (broken)                                  │
│                                                     │
│  Backend saves to DB:                                │
│    content: "The weather in Poughkeepsie is 32°F..." │
│    metadata: {                                       │
│      parts: [{type: "text", text: "The weather..."}],│  ← NO TOOL PARTS!
│      tools_used: [{tool: "get_weather",              │  ← Tool data is HERE
│                    input: {...}, result: {...}}]      │     but separate from parts
│    }                                                 │
│                                                     │
│  Frontend loadPreviousMessages reads:                │
│    parts: m.metadata?.parts                          │
│    → [{type: "text", text: "The weather..."}]        │
│  renderMessage only sees text parts                  │
│    → renders plain text, NO WeatherCard              │
│                                                     │
│  ❌ TOOL UI IS LOST                                  │
└─────────────────────────────────────────────────────┘
```

### Specific Code Locations

**Backend storage (api/routes/chat.py, ~line 470-510):**
```python
# tools_used is built during streaming:
tools_used.append({
    "tool": tool_name,        # e.g., "get_weather"
    "input": tool_input,      # e.g., {"location": "Poughkeepsie"}
    "result": result_data,    # e.g., {"temp": 32, "condition": "Clear"}
})
# BUT toolCallId is NOT saved!

# parts is built ONLY from text/artifacts:
parts = []
for artifact in artifacts:
    parts.append({"type": "text", ...})
    parts.append({"type": f"tool-{artifact['type']}", ...})  # artifacts only
# tools_used is stored separately, NOT in parts
```

**Frontend rehydration (ChatPage.tsx, ~line loadPreviousMessages):**
```typescript
setMessages(data.map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content || '',
    parts: cachedParts[m.id] || m.metadata?.parts || [{ type: 'text', text: m.content || '' }],
})));
// m.metadata.parts only has text — tool data is lost
```

## The Fix

### Backend Change (api/routes/chat.py)

**1. Capture `toolCallId` in `tools_used`:**
```python
tools_used.append({
    "tool": tool_name,
    "toolCallId": tool_call_id,  # ← ADD THIS
    "input": tool_input,
    "result": result_data,
})
```

**2. Build tool invocation parts in the `parts` array:**
```python
# After building text/artifact parts, add tool invocation parts
tool_parts = []
for tool_info in tools_used:
    tool_parts.append({
        "type": f"tool-{tool_info['tool']}",
        "toolCallId": tool_info.get("toolCallId", f"call_{tool_info['tool']}"),
        "toolName": tool_info["tool"],
        "state": "output-available",
        "input": tool_info["input"],
        "output": tool_info["result"]
    })

# Final parts: tool invocations THEN text/artifacts
all_parts = tool_parts + parts
```

**3. Backward compatibility in GET /messages:**
```python
# For old messages, reconstruct tool parts from metadata.tools_used
if metadata.get("tools_used") and not any(
    p.get("state") == "output-available" for p in parts
):
    for tool_info in metadata["tools_used"]:
        parts.insert(0, {
            "type": f"tool-{tool_info['tool']}",
            "toolCallId": tool_info.get("toolCallId", f"call_{tool_info['tool']}"),
            "toolName": tool_info["tool"],
            "state": "output-available",
            "input": tool_info.get("input", {}),
            "output": tool_info.get("result", {})
        })
```

### Frontend Impact

**No frontend changes needed** — the existing `loadPreviousMessages` already reads `m.metadata?.parts` and the `renderMessage` function already handles all `tool-*` part types. Once the backend stores proper tool parts in `metadata.parts`, everything works automatically.

### Data Flow After Fix

```
STREAMING:
  Backend → 7: tool-start → 9: tool-input → a: tool-output
  Frontend route.ts → SSE: tool-input-start → tool-output-available  
  AI SDK useChat → message.parts: [{type: 'tool-get_weather', state: 'output-available', output: {...}}]
  renderMessage → <WeatherCard />
  Backend saves → metadata.parts: [{type: 'tool-get_weather', state: 'output-available', output: {...}}, {type: 'text', text: '...'}]

RELOAD:
  Backend GET /messages → metadata.parts includes tool invocation parts
  Frontend loadPreviousMessages → parts: m.metadata.parts
  renderMessage → <WeatherCard /> (same as streaming!)
```

## Testing Checklist

1. [ ] Ask "What's the weather?" → WeatherCard renders during streaming
2. [ ] Navigate away to another chat → switch back → WeatherCard still renders
3. [ ] Refresh page entirely → WeatherCard still renders
4. [ ] Ask for stock data → StockCard renders and persists
5. [ ] Ask for AFL code → AFLGenerateCard renders and persists
6. [ ] Multiple tool calls in one message → all persist
7. [ ] Old messages (pre-fix) still display text fallback + reconstructed tool UI
