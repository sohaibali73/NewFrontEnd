# Analyst by Potomac — Master Improvement Plan

## Executive Summary

Comprehensive phased plan to fix critical bugs, improve UX, and complete features across the Analyst by Potomac platform. Covers frontend (Next.js/Vercel AI SDK), backend (FastAPI/Claude), and presentation engine integration.

**Total Issues Identified:** 47  
**Phases:** 5  
**Estimated Timeline:** 2-3 weeks  
**Created:** 2026-02-23  

---

## Phase 1: Critical Persistence & Chat Fixes (Days 1-3)

### 1.1 — Backend: Normalize Tool Result Storage Format
**File:** `api/routes/chat.py`  
**Problem:** Tool results stored as `metadata.tools_used: [{tool, input, result}]` — custom format that frontend cannot reconstruct into Generative UI parts.  
**Fix:** Store tool invocations as proper AI SDK `parts` entries with `type`, `toolCallId`, `toolName`, `state`, `input`, `output` fields.

### 1.2 — Backend: Fix GET `/chat/conversations/{id}/messages` Response
**File:** `api/routes/chat.py`  
**Problem:** Messages returned with `metadata.parts` that only contains text/artifact parts — tool invocations are in a separate `tools_used` field.  
**Fix:** Transform stored messages to include tool invocation parts in the `parts` array for backward compatibility.

### 1.3 — Frontend: Tool Result Rehydration
**File:** `src/page-components/ChatPage.tsx`  
**Problem:** `loadPreviousMessages` reads `m.metadata?.parts` but these don't include tool data.  
**Fix:** Once backend stores proper parts (1.1), existing frontend code works. Add fallback reconstruction from `metadata.tools_used` for old messages.

### 1.4 — Frontend: Fallback Tool Components
**Files:** Generative UI components  
**Problem:** Some tool components may not handle static (non-streaming) render.  
**Fix:** Ensure all 30+ tool components accept static `output` props.

### 1.5 — Frontend: Chat Switching State
**File:** `src/page-components/ChatPage.tsx`  
**Fix:** Improve conversation caching, remove fragile localStorage workaround once server-side persistence works.

---

## Phase 2: Backend API Repair & Database Alignment (Days 4-7)

### 2.1 — Content Routes → "Coming Soon"
### 2.2 — Knowledge Base / Brain Routes (pgvector)
### 2.3 — Researcher Routes
### 2.4 — Presentations Integration (PresenterByPotomac as microservice)
### 2.5 — Backtest Routes (CSV upload + AI interpretation)
### 2.6 — Database Schema Audit & Migration 008

---

## Phase 3: Frontend UX Improvements (Days 8-10)

### 3.1 — Dashboard Overhaul
### 3.2 — Chat UX Polish
### 3.3 — Navigation & Sidebar Fixes
### 3.4 — Settings Page
### 3.5 — Error Handling & Loading States

---

## Phase 4: Presentation Engine Integration (Days 11-13)

### 4.1 — Integrate PresenterByPotomac API
### 4.2 — AI-Driven Presentation Generation via Chat
### 4.3 — Presentation Management UI
### 4.4 — Chart Image Integration

---

## Phase 5: Advanced Features & Polish (Days 14+)

### 5.1 — Content Feed Implementation
### 5.2 — Knowledge Base / RAG (pgvector enabled)
### 5.3 — Deep Research Feature
### 5.4 — AFL Code Generator Polish
### 5.5 — Production Hardening
### 5.6 — Performance Optimization
