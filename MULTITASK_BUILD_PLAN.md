# Potomac Analyst — Multitasking & Preview Build Plan

## Project Locations
- **Frontend**: `C:\Users\SohaibAli\Documents\Abpfrontend` (Next.js 16, deployed on Vercel)
- **Backend**: `C:\Users\SohaibAli\PycharmProjects\Potomac-Analyst-Workbench` (FastAPI/Python, deployed on Railway)
- **Live URL**: https://analystbypotomac.vercel.app

---

## CRITICAL BUG: Fix Backend tool_use/tool_result Error

### Problem
The Anthropic Claude API returns error 400: `tool_use ids found without tool_result blocks`. This happens when conversation message history has a `tool_use` message from Claude but no matching `tool_result` response. The backend sends this incomplete history to Claude, which rejects it.

### Root Cause
When a user switches conversations mid-stream (while a tool like PPTX generation is running), the backend saves the assistant's `tool_use` message to the database BUT the tool result never gets saved because the stream was interrupted. Next time the user messages in that conversation, the backend loads all previous messages including the orphaned `tool_use`, sends them to Claude, and Claude errors.

### Fix Location
**File**: `C:\Users\SohaibAli\PycharmProjects\Potomac-Analyst-Workbench\api\routes\chat.py`
**Function**: `generate_stream()` (around line 1156) — the function that builds message history and calls `client.messages.stream()`

### What to Fix
Before sending messages to Claude, sanitize the history:
```python
def sanitize_message_history(messages):
    """Ensure every tool_use block has a matching tool_result in the next message."""
    sanitized = []
    i = 0
    while i < len(messages):
        msg = messages[i]
        if msg["role"] == "assistant":
            # Check if this message contains tool_use blocks
            has_tool_use = False
            if isinstance(msg.get("content"), list):
                has_tool_use = any(
                    block.get("type") == "tool_use" 
                    for block in msg["content"] 
                    if isinstance(block, dict)
                )
            
            if has_tool_use:
                # Check if next message is a tool_result
                next_msg = messages[i + 1] if i + 1 < len(messages) else None
                if not next_msg or next_msg["role"] != "user":
                    # Missing tool_result — skip this message OR inject a dummy tool_result
                    tool_use_ids = [
                        block["id"] for block in msg["content"]
                        if isinstance(block, dict) and block.get("type") == "tool_use"
                    ]
                    # Inject dummy tool_result
                    sanitized.append(msg)
                    dummy_results = [
                        {"type": "tool_result", "tool_use_id": tid, "content": "Tool execution was interrupted."}
                        for tid in tool_use_ids
                    ]
                    sanitized.append({"role": "user", "content": dummy_results})
                    i += 1
                    continue
        
        sanitized.append(msg)
        i += 1
    return sanitized
```

Call this before sending to Claude:
```python
messages = sanitize_message_history(messages)
```

### Also Check
- `core/claude_engine.py` — The main Claude integration that builds messages
- `core/streaming.py` — The streaming helpers
- The `onFinish` callback in the streaming route — ensure tool results get saved to DB even if client disconnects

---

## TASK 1: Wire Frontend ProcessManager to Backend Tasks API

### What Exists Already
- **Backend**: `api/routes/tasks.py` — Full REST API (POST/GET/DELETE /tasks)
- **Backend**: `core/task_manager.py` — Async task queue with asyncio.create_task()
- **Frontend**: `app/api/tasks/route.ts` — Next.js proxy route to backend
- **Frontend**: `src/contexts/ProcessManager.tsx` — Task Manager widget (the "NO TASKS" pill)
- **Frontend**: `src/page-components/ChatPage.tsx` — ProcessManager sync useEffect already tracks tools

### What Needs to Be Built
The frontend needs to actually CALL the backend task API to submit long-running operations as background tasks.

### Implementation Steps

#### Step 1: Add a `useBackgroundTasks` hook
**Create**: `src/hooks/useBackgroundTasks.ts`

```typescript
// Hook that:
// 1. Polls GET /api/tasks every 3 seconds when there are active tasks
// 2. Syncs task status with the ProcessManager context
// 3. Provides submitTask() function
// 4. Auto-stops polling when no active tasks

export function useBackgroundTasks() {
  const { addProcess, updateProcess } = useProcessManager();
  
  const submitTask = async (params: {
    task_type: string;
    title: string;
    message: string;
    conversation_id?: string;
    skill_slug?: string;
  }) => {
    const token = localStorage.getItem('auth_token');
    const resp = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await resp.json();
    // Register in ProcessManager
    if (data.task_id) {
      addProcess({ title: params.title, type: mapType(params.task_type), status: 'running', progress: 0 });
    }
    return data;
  };
  
  // Poll loop: GET /api/tasks every 3s, update ProcessManager
  // ...
}
```

#### Step 2: Update ChatPage to submit background tasks
**File**: `src/page-components/ChatPage.tsx`

In the ProcessManager sync useEffect, when a tool starts (input-available state), also submit it as a background task:
```typescript
if (isActive && !trackedToolsRef.current.has(toolKey)) {
  // Register in ProcessManager (already done)
  const processId = addProcess({...});
  trackedToolsRef.current.set(toolKey, processId);
  
  // ALSO submit to backend task queue for true background execution
  fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_type: getProcessType(toolName) === 'slide' ? 'presentation' : 'document',
      title: getToolTitle(toolName, part.input),
      message: part.input?.topic || part.input?.title || 'Generate',
      conversation_id: conversationIdRef.current,
    }),
  }).catch(() => {}); // Fire-and-forget
}
```

#### Step 3: Add polling in ProcessManager widget
**File**: `src/contexts/ProcessManager.tsx`

Add a useEffect that polls `GET /api/tasks` every 3 seconds when there are active tasks, and syncs the backend task status with the frontend ProcessManager state.

---

## TASK 2: Build DOCX Preview (mammoth.js)

### Frontend Only — No Backend Needed

#### Step 1: Install mammoth
```bash
npm install mammoth
```

#### Step 2: Update DocumentDownloadCard
**File**: `src/components/ai-elements/document-download-card.tsx`

In the preview panel, when the user clicks "Preview":
1. Fetch the DOCX file from the download URL
2. Convert to HTML using mammoth.js
3. Render the HTML in the preview panel

```typescript
import mammoth from 'mammoth';

async function loadDocxPreview(downloadUrl: string) {
  const token = localStorage.getItem('auth_token');
  const resp = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
  const arrayBuffer = await resp.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value; // HTML string
}
```

Add a `[previewHtml, setPreviewHtml]` state and render it in the preview panel:
```tsx
{showPreview && previewHtml && (
  <div dangerouslySetInnerHTML={{ __html: previewHtml }} 
       style={{ padding: '16px', background: 'white', color: 'black', borderRadius: '8px' }} />
)}
```

---

## TASK 3: Build PPTX Preview (Backend Converter)

### Backend: PPTX to Images/HTML Endpoint

#### Step 1: Install python-pptx
**File**: `requirements.txt` in backend — add:
```
python-pptx>=0.6.21
Pillow>=10.0.0
```

#### Step 2: Create preview endpoint
**Create**: New route in `api/routes/files_router.py` or new file `api/routes/preview.py`

```python
@router.get("/files/{file_id}/preview")
async def preview_file(file_id: str, user_id: str = Depends(get_current_user_id)):
    """Convert PPTX/DOCX to HTML preview."""
    # 1. Download file from Supabase Storage
    # 2. If PPTX: Use python-pptx to extract slide titles, text, and shapes
    # 3. Return structured JSON: { slides: [{ title, content, slide_number }] }
    # 4. If DOCX: Use python-docx to extract paragraphs
    # 5. Return structured JSON: { sections: [{ title, content }] }
```

#### Step 3: Frontend calls preview endpoint
**File**: `src/components/ai-elements/document-download-card.tsx`

When "Preview" is clicked, fetch `/api/proxy?path=/files/{file_id}/preview` and display the structured preview data using the existing `PreviewContent` component (already built — supports slides, sections, outline formats).

---

## TASK 4: Fix [FORMATTING:] in Sidebar Titles (Database Fix)

### Problem
Old conversations have `[FORMATTING:...]` baked into their title in the Supabase database. The frontend strip only affects display, not the stored data.

### Fix Options
1. **Backend migration**: Run a SQL update to clean titles:
```sql
UPDATE conversations 
SET title = regexp_replace(title, '\[FORMATTING:[^\]]*\]', '', 'gi')
WHERE title LIKE '%[FORMATTING:%';
```

2. **Backend fix in chat.py**: When the backend auto-generates conversation titles from the first message, strip the formatting instructions BEFORE saving:
**File**: `api/routes/chat.py` — find where conversation title is set/updated and add:
```python
import re
title = re.sub(r'\[FORMATTING:[^\]]*\]', '', title).strip()
```

---

## Architecture Summary

```
User sends "make me a powerpoint"
    │
    ├─→ Chat SSE Stream (existing) ──→ Claude API ──→ tool_use ──→ tool execution ──→ tool_result
    │   └─ Frontend shows ToolLoading card → DocumentDownloadCard
    │
    └─→ Background Task API (new) ──→ POST /tasks ──→ asyncio.create_task ──→ SkillGateway.execute()
        └─ Frontend polls GET /tasks/{id} ──→ ProcessManager widget shows progress
        └─ Task completes independently of page navigation
        └─ User can navigate to Dashboard, come back, see completed task
```

## File Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| ChatPage | `frontend/src/page-components/ChatPage.tsx` | Main chat with tool rendering, caching, ProcessManager sync |
| ProcessManager | `frontend/src/contexts/ProcessManager.tsx` | Task Manager widget (bottom-right "NO TASKS" pill) |
| ToolLoading | `frontend/src/components/generative-ui/ToolLoading.tsx` | Progress animation for running tools |
| DocumentDownloadCard | `frontend/src/components/ai-elements/document-download-card.tsx` | Download + Preview card for DOCX/PPTX |
| Tasks Proxy | `frontend/app/api/tasks/route.ts` | Next.js proxy to backend /tasks |
| Task Manager | `backend/core/task_manager.py` | Async task queue with asyncio |
| Tasks API | `backend/api/routes/tasks.py` | REST endpoints for task CRUD |
| Chat Route | `backend/api/routes/chat.py` | SSE streaming chat with Claude (FIX tool_use/tool_result here) |
| Skill Gateway | `backend/core/skill_gateway.py` | Executes Claude skills (documents, presentations, research) |
| Main | `backend/main.py` | FastAPI app with all routers registered |
