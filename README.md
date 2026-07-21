# SceneDesk

Professional screenwriting IDE — Milestone 2.

SceneDesk is a structured screenplay writing environment inspired by Final Draft’s workflow. Every line is a typed screenplay element, not freeform rich text.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Zustand
- IndexedDB (script persistence)
- Lucide icons

## Preview locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`), then go to **Script**.

## What’s included

### Milestone 1 — IDE shell
- Menu bar, toolbar, sidebar, editor area, inspector, bottom panel, status bar
- Light / dark themes and persisted layout

### Milestone 2 — Structured editor
- Element types: Scene Heading, Action, Character, Parenthetical, Dialogue, Transition
- **Enter** creates the next logical element; **Tab** / **Shift+Tab** cycles type
- Feature-film defaults (no TV act breaks yet)
- Active script autosaved to **IndexedDB**
- Inspector reflects selection + parsed scene meta
- Scene navigator for jump-to-scene
- Undo / redo and toolbar save (`⌘/Ctrl+S`)

## Keyboard

| Shortcut | Action |
|----------|--------|
| `Enter` | Next logical element (or cycle type if empty) |
| `Tab` / `Shift+Tab` | Cycle element type |
| `Backspace` on empty | Delete element |
| `⌘/Ctrl+S` | Save now |
| `⌘/Ctrl+Z` / `⇧⌘Z` | Undo / redo |
| `⌘/Ctrl+B` / `I` / `J` | Sidebar / inspector / bottom panel |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |
