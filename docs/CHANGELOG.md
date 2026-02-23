# Analyst by Potomac — Changelog

## [Phase 1] — 2026-02-23: Generative UI Persistence Fix

### Problem
When users navigated away from a chat and returned, rich tool result components 
(WeatherCard, StockCard, AFLGenerateCard, etc.) disappeared. Only plain text remained.

### Root Cause
Tool results were stored in `metadata.tools_used` as a separate field but NOT included
in `metadata.parts` — the array the frontend reads to render UI components.

### Changes

#### Backend (`api/routes/chat.py`)

1. **`POST /chat/stream` — generate_stream():**
   - Added `toolCallId` to `tools_used` entries during tool execution
   - After building text/artifact parts, now builds tool invocation parts with proper AI SDK format
   - Stores combined `all_parts = tool_parts + text_parts` in `metadata.parts`
   - Each tool part has: `type`, `toolCallId`, `toolName`, `state`, `input`, `output`

2. **`POST /chat/v6` — generate_stream():**
   - Same fix applied (this endpoint mirrors /stream)

3. **`GET /chat/conversations/{id}/messages`:**
   - Added backward compatibility transformation
   - For old messages without tool parts in `metadata.parts`, reconstructs them from `metadata.tools_used`
   - Prepends reconstructed tool parts to existing parts array
   - Only modifies the API response, not the database

4. **`POST /chat/message` (non-streaming):**
   - Already had tool result storage, now consistent with streaming endpoints

#### Frontend Impact
- **No changes needed** — `loadPreviousMessages()` already reads `m.metadata?.parts`
- `renderMessage()` already handles all `tool-*` part types with proper component rendering
- The localStorage parts cache remains as an additional fallback layer

### Parts Format (AI SDK Compatible)
```json
{
  "type": "tool-get_weather",
  "toolCallId": "toolu_01XYZ...",
  "toolName": "get_weather",
  "state": "output-available",
  "input": {"location": "Poughkeepsie, NY"},
  "output": {"temp": 32, "condition": "Clear", "humidity": 45}
}
```

### Testing
- [ ] New tool calls persist across navigation
- [ ] Old messages get backward-compatible tool reconstruction
- [ ] All 30+ Generative UI components render from history
- [ ] No regression in live streaming behavior
