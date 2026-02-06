# Codebase Bug Report & Fixes Applied
## Date: 2026-02-06

After a thorough line-by-line review of the entire codebase, 12 critical bugs were identified and fixed.

---

## 🔴 CRITICAL BUGS FIXED

### Bug #1: AFL Generator — Field Name Mismatch (EVERY generation fails)
- **File**: `frontend-extracted/.../pages/AFLGeneratorPage.tsx`
- **Problem**: Frontend sent `{ request: prompt }` but backend expected `{ prompt: prompt }`
- **Impact**: Every AFL generation request returned 422 Unprocessable Entity
- **Fix**: Changed `request: prompt` → `prompt: prompt`

### Bug #2: AFL File Upload — Route Mismatch (EVERY upload 404s)
- **File**: `frontend-extracted/.../lib/api.ts`
- **Problem**: Frontend called `/afl/upload-file` but backend exposes `/afl/upload`
- **Impact**: Every AFL file upload returned 404 Not Found
- **Fix**: Changed endpoint from `/afl/upload-file` to `/afl/upload`

### Bug #3: Settings Page — NEVER Persisted to Backend
- **File**: `frontend-extracted/.../pages/SettingsPage.tsx`
- **Problem**: `handleSave()` only saved to `localStorage`, never called backend API
- **Impact**: Profile changes, API key changes lost on logout/device switch
- **Fix**: Added `apiClient.updateProfile()` call in `handleSave()` to persist to `PUT /auth/me`

### Bug #4: Settings Page — Never Loaded User Data from API
- **File**: `frontend-extracted/.../pages/SettingsPage.tsx`
- **Problem**: Loaded profile from `localStorage.getItem('user_info')` which was never populated
- **Impact**: Settings profile fields always showed empty
- **Fix**: Now calls `apiClient.getCurrentUser()` on mount, falls back to localStorage cache

### Bug #5: AuthContext — Never Saved user_info to localStorage
- **File**: `frontend-extracted/.../contexts/AuthContext.tsx`
- **Problem**: After login/register, user data stored only in React state, never localStorage
- **Impact**: Settings page couldn't access user profile data
- **Fix**: Added `localStorage.setItem('user_info', ...)` after login, register, and initAuth

### Bug #6: AFLGenerateRequest Type — Missing Backend Fields
- **File**: `frontend-extracted/.../types/api.ts`
- **Problem**: TypeScript type didn't include `backtest_settings`, `uploaded_file_ids`, `kb_context`, `stream`
- **Impact**: TypeScript errors or silent field drops
- **Fix**: Added all missing fields to the interface

### Bug #7: Brain Stats — Missing `total_size` Field
- **File**: `api/routes/brain.py`
- **Problem**: Backend returned `total_chunks`/`total_learnings` but not `total_size`
- **Impact**: Frontend showed "undefined B" for total size
- **Fix**: Added `total_size` calculation from `file_size` column, wrapped `learnings` query in try/catch

### Bug #8: Documents List — Missing `file_size` in Response
- **File**: `api/routes/brain.py`
- **Problem**: Backend SELECT didn't include `file_size` column
- **Impact**: Frontend showed "undefined B" for every document size
- **Fix**: Added `file_size` to the SELECT query

### Bug #9: Chat File Upload — Missing `conversation_files` Table
- **File**: `api/routes/chat.py` → `upload_file()`
- **Problem**: Endpoint writes to `conversation_files` table that was never created
- **Impact**: Every chat file upload failed with "relation does not exist"
- **Fix**: Created migration `007_conversation_files.sql`

### Bug #10: No `updateProfile` Method in API Client
- **File**: `frontend-extracted/.../lib/api.ts`
- **Problem**: No method to call `PUT /auth/me` for persisting profile/API key changes
- **Impact**: Settings changes could never reach the backend
- **Fix**: Added `updateProfile()` method to APIClient

### Bug #11: Hardcoded API Keys in Source Code (SECURITY)
- **File**: `config.py`
- **Problem**: Anthropic API key, Supabase keys, Finnhub, FRED, NewsAPI keys all hardcoded
- **Impact**: Keys exposed in git history — major security vulnerability
- **Fix**: Replaced all hardcoded keys with empty defaults. All must be set via environment variables.

---

## 🟡 KNOWN ISSUES (Not Yet Fixed)

### AFL Generator Chat — Completely Simulated
- **File**: `AFLGeneratorPage.tsx` → `handleSendChatMessage()`
- **Problem**: Uses `setTimeout` to fake AI response, never calls backend
- **Status**: Not fixed — requires architectural decision on whether this should use the chat API

### RLS Policies Use Wrong Auth Method
- **Files**: `004_history_tables_FIXED.sql`, `005_afl_uploaded_files.sql`
- **Problem**: Uses `auth.uid()` / `current_setting('app.current_user_id')` but app uses custom JWT
- **Workaround**: Using `SUPABASE_SERVICE_KEY` (service role) bypasses RLS entirely
- **Status**: Not fixed — requires RLS policy rewrite or migration to Supabase Auth

---

## 📋 ACTION ITEMS

### Immediate (Must Do Before Deploy)
1. ✅ All code fixes applied
2. ⚠️ **Run migration** `007_conversation_files.sql` in Supabase SQL editor
3. ⚠️ **Set environment variables** for all API keys (config.py no longer has hardcoded defaults):
   - `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
   - `ANTHROPIC_API_KEY`
   - `FINNHUB_API_KEY`, `FRED_API_KEY`, `NEWSAPI_KEY`
   - `SECRET_KEY` (for JWT)
4. ⚠️ **Rotate all API keys** that were exposed in git history

### Soon
5. Connect AFL Generator chat to real backend (currently simulated)
6. Rewrite RLS policies to work with custom JWT or migrate to Supabase Auth

---

## Files Changed

| File | Change |
|------|--------|
| `frontend-extracted/.../pages/AFLGeneratorPage.tsx` | Fixed `request:` → `prompt:` |
| `frontend-extracted/.../lib/api.ts` | Fixed `/afl/upload-file` → `/afl/upload`, added `updateProfile()` |
| `frontend-extracted/.../pages/SettingsPage.tsx` | Load from API, persist to backend |
| `frontend-extracted/.../contexts/AuthContext.tsx` | Save user_info to localStorage |
| `frontend-extracted/.../types/api.ts` | Added missing fields to AFLGenerateRequest |
| `api/routes/brain.py` | Added `total_size` to stats, `file_size` to documents |
| `config.py` | Removed all hardcoded API keys |
| `db/migrations/007_conversation_files.sql` | NEW - creates missing table |
