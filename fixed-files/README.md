# Fixed Files — Manual Replacement Guide

## Frontend Files (for NewFrontEnd repo)

| Fixed File | Replace In Your NewFrontEnd Repo At |
|---|---|
| `frontend/api.ts` | `src/lib/api.ts` |
| `frontend/AuthContext.tsx` | `src/contexts/AuthContext.tsx` |
| `frontend/SettingsPage.tsx` | `src/page-components/SettingsPage.tsx` |

## Backend Files (for Potomac-Analyst-Workbench repo)

| Fixed File | Replace At |
|---|---|
| `backend/brain.py` | `api/routes/brain.py` |
| `backend/config.py` | `config.py` |

## New Files (add these)

| New File | Add To |
|---|---|
| `backend/007_conversation_files.sql` | `db/migrations/007_conversation_files.sql` — also RUN in Supabase SQL editor |

## What Was Fixed

1. **api.ts** — Added `updateProfile()` method so Settings can persist to backend
2. **AuthContext.tsx** — Now saves `user_info` to localStorage after login/register/auth check
3. **SettingsPage.tsx** — Loads profile/API keys from backend API on mount; saves to backend on Save
4. **brain.py** — Added `total_size` to stats, `file_size` to documents list
5. **config.py** — Removed all hardcoded API keys (must use env vars)
6. **007_conversation_files.sql** — Creates missing table for chat file uploads
