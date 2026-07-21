# SceneDesk

Professional screenwriting IDE shell — Milestone 1.

SceneDesk is a structured screenplay writing environment inspired by Final Draft’s workflow, built with a modern modular frontend. This milestone delivers the **visual shell and navigation framework only**: no screenplay editing logic, data models, or backend yet.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Zustand (persisted layout & theme)
- Lucide icons

## Preview locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start the dev server     |
| `npm run build`| Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint               |

## What’s included

- Desktop IDE chrome: menu bar, toolbar, sidebar, editor area, inspector, bottom panel, status bar
- Collapsible / resizable panels with preferences persisted in `localStorage`
- Light & dark themes
- Routes and placeholder screens for Dashboard, Projects, Script, Outline, Beat Board, Characters, Locations, Notes, Revisions, Reports, and Settings
- Keyboard shortcuts: `⌘/Ctrl+B` sidebar, `⌘/Ctrl+I` inspector, `⌘/Ctrl+J` bottom panel
