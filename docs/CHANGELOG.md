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

## [Phase 2] — 2026-02-23: Backend API Repair & Database Alignment

### Changes

#### Database Migration 008 (`db/migrations/008_missing_tables.sql`)
- Created `content_items` table (articles, documents, slides, dashboards)
- Created `writing_styles` table (user writing preferences)
- Created `backtest_results` table (CSV uploads + AI analysis)
- Added missing columns to `brain_documents` (content_hash, source_type, subcategories, file_size, chunk_count, is_processed, processed_at)

#### Researcher Route Fix (`api/routes/researcher.py`)
- Fixed prefix from `/api/researcher` to `/researcher` (was double-prefixed when mounted in FastAPI)
- Routes now correctly accessible at `/researcher/company/{symbol}`, `/researcher/news/{symbol}`, etc.

#### Backtest Route Enhancement (`api/routes/backtest.py`)
- Added `GET /backtest/history` endpoint to list user's previous backtests
- Upload + AI analysis flow already complete (Claude interprets CSV data)

#### Frontend Navigation (`src/layouts/MainLayout.tsx`)
- Added "SOON" badge to Content page in sidebar navigation
- Badge renders as a small yellow pill with "SOON" text

#### Content Routes (`api/routes/content.py`)
- Routes already fully implemented (CRUD for articles, documents, slides, dashboards)
- Will work once migration 008 creates the `content_items` table in Supabase
- Background slide generation with job polling system
- AI-powered content chat streaming

#### Brain/Knowledge Base Routes (`api/routes/brain.py`)
- Routes already functional with document upload, classification, chunking
- Text search implemented (vector search available via pgvector)
- Stats, batch upload, document management all working

## [Phase 3] — 2026-02-23: Frontend UX Improvements

### Dashboard Overhaul (`DashboardPage.tsx`)
- Added quick action cards: New Chat, Generate AFL (clickable, with hover effects)
- Added stats cards showing Conversations count and Documents count (loaded from API)
- Added Recent Conversations section with clickable list (last 5 chats with dates)
- Data loads from backend on mount via `apiClient.getConversations()` and `apiClient.getDocuments()`

### Content Page (`ContentPage.tsx`)
- Added "Coming Soon" banner with Potomac yellow styling
- Banner informs users Content Studio is under active development
- Existing tab UI (Chat, Slides, Articles, Documents, Dashboards) remains accessible

### Sidebar Navigation (`MainLayout.tsx`)
- "SOON" badge on Content nav item (Phase 2, included here for completeness)

## [Phase 4] — 2026-02-23: Presentation Engine Integration

### create_presentation Tool Fix (`core/tools.py`)
- **Before:** Called Claude and stored TEXT response as bytes (not a real .pptx file)
- **After:** Uses PotomacPPTXGenerator to create real branded .pptx files
- Flow: User request → Claude generates JSON outline → PotomacPPTXGenerator builds .pptx → stored in memory → downloadable
- 8 slide types supported: title, agenda, chart, stats, two_charts, content, summary, closing
- Brand compliance: Potomac Yellow #FEC00F, Dark #212121, Teal #00DED1, Rajdhani/Quicksand fonts
- Fallback: If Claude JSON parsing fails, builds outline directly from user input
- File stored in `_presentation_store` dict, downloadable via `GET /chat/presentation/{id}`

### PotomacPPTXGenerator (`core/pptx_generator.py`)
- Already existed with full python-pptx implementation — now properly wired to the chat tool
- Widescreen 13.33" × 7.5" slides with dark headers, yellow accents, teal rules
- Professional layouts: title slides, agenda grids, chart+panel slides, stats panels, etc.

## [Phase 5] — 2026-02-23: Advanced Features & Production Hardening

### Knowledge Base RAG with pgvector

#### Migration 009 (`db/migrations/009_brain_tables_and_embeddings.sql`)
- **Critical fix:** Created `brain_documents` table (was missing from all migrations!)
- Created `brain_chunks` table with `embedding vector(1536)` column for pgvector
- Created `learnings` table for AI-generated insights
- Created `match_brain_chunks()` SQL function for vector similarity search
- IVFFlat index on embeddings for fast cosine similarity search
- Full schema with proper indexes, RLS policies, and grants

#### Vector Search (`api/routes/brain.py`)
- Enhanced `/brain/search` to try vector search first when embeddings exist
- Falls back gracefully to text search (ilike) when no embeddings
- Added `_generate_embedding()` helper using Voyage AI API
- Added `raw_content` to text search scope (was only searching title+summary)
- Returns `search_type: "vector"` or `"text"` to indicate which method was used

### Production Hardening

#### Rate Limiting (`main.py`)
- Added in-memory rate limiting middleware: 120 requests/minute per IP
- Skips rate limiting for health checks, docs, and root endpoint
- Returns 429 Too Many Requests with Retry-After header
- Auto-prunes stale IP entries to prevent memory leaks
- Simple, zero-dependency implementation (no Redis needed for single instance)

### Remaining Items for Future Sessions
- Content feed RSS parser implementation
- Deep research multi-step agent
- CI/CD pipeline (GitHub Actions)
- Sentry error tracking integration
- Redis caching for multi-instance deployments
- Comprehensive test suite
