# Content Studio Redesign Plan

## Frontend Location
```
C:\Users\SohaibAli\Documents\Abpfrontend
```
- **GitHub**: https://github.com/sohaibali73/NewFrontEnd (branch: `main`)
- **Backend GitHub**: https://github.com/sohaibali73/Potomac-Analyst-Workbench (branch: `master`)
- **Framework**: Next.js 16, React 19, AI SDK v6, Radix UI, Tailwind CSS

## Backend APIs (Already Built & Deployed)

All backend endpoints are live. The redesign is **frontend-only** — no backend changes needed.

### Content CRUD Endpoints (existing, working)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/content/slides` | List user's slide decks from DB |
| `GET` | `/content/articles` | List user's articles from DB |
| `GET` | `/content/documents` | List user's documents from DB |
| `GET` | `/content/dashboards` | List user's dashboards from DB |
| `POST` | `/content/slides` | Create/save a slide deck |
| `POST` | `/content/articles` | Create/save an article |
| `POST` | `/content/documents` | Create/save a document |
| `POST` | `/content/dashboards` | Create/save a dashboard |
| `PUT` | `/content/{type}/{id}` | Update content item |
| `DELETE` | `/content/{type}/{id}` | Delete content item |

### Content Generation Endpoints (skill-powered, background jobs)
| Method | Endpoint | Skill Used | Description |
|--------|----------|-----------|-------------|
| `POST` | `/content/slides/generate` | `potomac-powerpoint-generator` | Generate slide deck (background job, SSE progress) |
| `POST` | `/content/generate` | `potomac-document-generator` | Generate article/document/dashboard (background job) |
| `GET` | `/content/jobs` | — | List all running/completed jobs |
| `GET` | `/content/jobs/{job_id}` | — | Poll job status + result |

### Frontend API Client Methods (already wired in `src/lib/api.ts`)
```typescript
// Slides
apiClient.getSlides()                          // GET /content/slides
apiClient.generateSlides(prompt, slideCount)   // POST /content/slides/generate (SSE)
apiClient.createSlide(data)                    // POST /content/slides
apiClient.updateSlide(id, data)                // PUT /content/slides/{id}
apiClient.deleteSlide(id)                      // DELETE /content/slides/{id}

// Articles
apiClient.getArticles()                        // GET /content/articles
apiClient.createArticle(data)                  // POST /content/articles
apiClient.updateArticle(id, data)              // PUT /content/articles/{id}
apiClient.deleteArticle(id)                    // DELETE /content/articles/{id}

// Documents
apiClient.getDocumentsContent()                // GET /content/documents
apiClient.createDocument(data)                 // POST /content/documents
apiClient.updateDocument(id, data)             // PUT /content/documents/{id}
apiClient.deleteContentDocument(id)            // DELETE /content/documents/{id}

// Dashboards
apiClient.getDashboards()                      // GET /content/dashboards
apiClient.createDashboard(data)                // POST /content/dashboards
apiClient.updateDashboard(id, data)            // PUT /content/dashboards/{id}
apiClient.deleteDashboard(id)                  // DELETE /content/dashboards/{id}

// Skill-powered generation (background, no timeout)
apiClient.generateContent(prompt, contentType, title)  // POST /content/generate → returns {job_id}
apiClient.getContentJobs()                             // GET /content/jobs → {jobs: [...]}
apiClient.getContentJob(jobId)                         // GET /content/jobs/{id} → {status, result}
```

### DB Schema (`content_items` table in Supabase)
```sql
id          UUID PRIMARY KEY
user_id     UUID (FK to auth.users)
title       TEXT
content     TEXT (markdown/rich text body)
content_type TEXT ('article' | 'document' | 'slide' | 'dashboard')
status      TEXT ('draft' | 'complete' | 'generating')
tags        TEXT[] (e.g. ['ai-generated', 'skill-powered'])
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

---

## Design Requirements

### Layout Pattern (applies to ALL tabs: Slides, Articles, Documents, Dashboards)

```
┌──────────────────────────────────────────────────────────┐
│ CONTENT STUDIO                          [WRITING STYLES] │
├──────────────────────────────────────────────────────────┤
│ [CHAT] [SLIDE DECKS] [ARTICLES] [DOCUMENTS] [DASHBOARDS]│
├─────────────────┬────────────────────────────────────────┤
│                 │                                        │
│  HISTORY LIST   │   CONTENT VIEWER / EDITOR              │
│  (40% width)    │   (60% width)                          │
│                 │                                        │
│ ┌─────────────┐ │  ┌──────────────────────────────────┐  │
│ │ + NEW       │ │  │  [Title]              [Edit] [⋮] │  │
│ │ [Search...] │ │  │                                  │  │
│ ├─────────────┤ │  │  Rendered markdown content...     │  │
│ │ ⟳ Running.. │ │  │                                  │  │
│ │   ████░░ 60%│ │  │  - Bullet points                 │  │
│ ├─────────────┤ │  │  - Charts described               │  │
│ │ ✓ Q3 Report │ │  │  - Sections with headings         │  │
│ │   Complete  │ │  │                                  │  │
│ ├─────────────┤ │  │                                  │  │
│ │ ✓ Market O..│ │  │                                  │  │
│ │   Complete  │ │  └──────────────────────────────────┘  │
│ ├─────────────┤ │                                        │
│ │ ✓ Client P..│ │  [When editing:]                       │
│ │   Complete  │ │  ┌──────────────────────────────────┐  │
│ └─────────────┘ │  │  Markdown editor textarea         │  │
│                 │  │  with preview toggle               │  │
│                 │  │  [Save] [Cancel]                    │  │
│                 │  └──────────────────────────────────┘  │
└─────────────────┴────────────────────────────────────────┘
```

### Key UX Requirements
1. **Not full-screen**: Content area sits within the existing tab layout, no modals
2. **Split-pane**: Left = history list, Right = viewer/editor
3. **Compact "New" creation**: Inline form at top of left panel (not a modal), OR a small inline expandable form
4. **Background generation**: Shows running jobs in the history list with progress bars
5. **Auto-refresh**: When generation completes, item appears in history list
6. **Click to view**: Click any item in history → renders in right panel
7. **Edit mode**: Click "Edit" on right panel → switches to textarea editor with Save/Cancel
8. **Delete**: Swipe or ⋮ menu on history items
9. **Persistence**: All items load from Supabase on mount, new items saved automatically

---

## Files to Create / Modify

### New Shared Component
**`src/components/content/ContentSplitPane.tsx`** (~300 lines)
- Reusable split-pane layout component used by ALL content tabs
- Props: `contentType`, `generateFn`, `items`, `onRefresh`
- Left panel: history list with search, "New" form, job status
- Right panel: content viewer with edit toggle
- Handles: loading states, empty states, error states

### Modify Existing Tab Components
Each tab component should become a thin wrapper around `ContentSplitPane`:

**`src/components/content/SlideDecksTab.tsx`** (rewrite)
- Uses `ContentSplitPane` with `contentType="slide"`
- `generateFn` calls `apiClient.generateSlides(prompt, slideCount)` (existing SSE endpoint) OR `apiClient.generateContent(prompt, 'slide', title)` (new job endpoint)
- Loads items via `apiClient.getSlides()`
- Slide-specific: may show slide count, download button for PPTX

**`src/components/content/ArticlesTab.tsx`** (rewrite)
- Uses `ContentSplitPane` with `contentType="article"`
- `generateFn` calls `apiClient.generateContent(prompt, 'article', title)`
- Loads items via `apiClient.getArticles()`
- Article-specific: word count, reading time estimate

**`src/components/content/DocumentsTab.tsx`** (rewrite)
- Uses `ContentSplitPane` with `contentType="document"`
- `generateFn` calls `apiClient.generateContent(prompt, 'document', title)`
- Loads items via `apiClient.getDocumentsContent()`

**`src/components/content/DashboardsTab.tsx`** (rewrite)
- Uses `ContentSplitPane` with `contentType="dashboard"`
- `generateFn` calls `apiClient.generateContent(prompt, 'dashboard', title)`
- Loads items via `apiClient.getDashboards()`

### Modify Content Page
**`src/page-components/ContentPage.tsx`** (minor)
- Remove "COMING SOON" banner
- Keep existing tab structure, tabs now use redesigned components
- Keep AI Skills tab as-is

---

## Generation Flow (what happens when user clicks "New")

1. User types prompt in the inline form at top of left panel
2. Frontend calls `apiClient.generateContent(prompt, contentType, title)`
3. Backend returns `{job_id, status: "pending"}` in ~200ms
4. Frontend adds a "generating" item to the top of the history list with progress bar
5. Frontend polls `apiClient.getContentJob(jobId)` every 3 seconds
6. Progress bar updates (20% → 40% → 80% → 100%)
7. When `status === "complete"`, refresh the items list from DB
8. The new item appears at top of list, auto-selected → rendered in right panel
9. User can navigate away at any point — job runs on Railway backend

## Content Viewer/Editor (Right Panel)

- **View mode**: Renders content as formatted markdown using `MarkdownRenderer`
- **Edit mode**: Full-height textarea with the raw markdown, plus [Save] and [Cancel] buttons
- **Header**: Shows title (editable), created date, tags, status badge
- **Actions**: Edit, Delete, Copy, (for slides: Download PPTX)

## Styling Notes
- Use existing `colors` object from `ContentPage` (theme-aware dark/light)
- Font: Rajdhani for headings, Quicksand for body (matches existing app)
- Accent color: `#FEC00F` (Potomac yellow)
- Match existing component styling (rounded corners, subtle borders, etc.)
- Components are in `src/components/content/` directory
- Use `useTheme()` from `@/contexts/ThemeContext`

---

## Implementation Order
1. Create `ContentSplitPane.tsx` shared component
2. Rewrite `SlideDecksTab.tsx` using it
3. Rewrite `ArticlesTab.tsx` using it
4. Rewrite `DocumentsTab.tsx` using it
5. Rewrite `DashboardsTab.tsx` using it
6. Update `ContentPage.tsx` (remove COMING SOON banner)
7. Test all tabs work with backend
8. Push to GitHub
