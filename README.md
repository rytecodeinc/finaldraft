# SceneDesk

Professional screenwriting IDE inspired by Final Draft’s workflow.

## Preview

```bash
npm install
npm run dev
```

Open **Script** (usually `http://localhost:5173/script`).

## Milestones

### 1 — IDE shell
Menu bar, toolbar, sidebar, inspector, bottom panel, themes, persisted layout.

### 2 — Structured editor
Typed elements, Enter/Tab flow, IndexedDB, scene navigator, US Letter pagination, inspector meta, type quick bar.

### 3 — Script-page writing intelligence
- **SmartType** suggestions for characters, locations, times, and transitions
- **Full Final Draft–style title page** (credit, authors, based on, contact, copyright, draft date, revision)
- **Find in script** (`⌘/Ctrl+F`) with element-type filter
- **(MORE)** / **(CONT'D)** chrome across dialogue page breaks

### 4 — Workspace & story surfaces
- **Projects** — one script per project; migrate legacy single script → “Untitled”
- **Project-scoped routes** — `/p/:id/script|outline|characters|locations`
- **Derived views** — outline (reorder/rename), characters & locations (list-only) from screenplay
- **Dashboard** — Continue writing → `/p/:id/script`; toolbar `Project > Script`

## Out of scope (later)
Colored revisions, locked pages, reports, Fountain, beat-board sync, collaboration, TV acts, backend, multiple scripts per project, character/location enrichment fields.
