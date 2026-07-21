import { create } from 'zustand'
import {
  collectCharacterNames,
  composeSceneHeading,
  createElement,
  cycleElementType,
  ENTER_NEXT_TYPE,
  estimatePageCount,
  extractScenes,
  findSceneForElement,
  formatElementText,
  parseSceneHeading,
} from '@/screenplay/elementRules'
import { findInScript, type FindMatch, type FindTypeFilter } from '@/screenplay/findScript'
import { loadActiveScript, saveActiveScript } from '@/screenplay/idb'
import { createSampleScript } from '@/screenplay/sampleScript'
import type {
  ElementType,
  SaveStatus,
  SceneInfo,
  ScreenplayElement,
  ScriptDocument,
  TitlePageInfo,
} from '@/screenplay/types'

const MAX_HISTORY = 80
const AUTOSAVE_MS = 700

interface HistorySnapshot {
  title: string
  titlePage: TitlePageInfo
  elements: ScreenplayElement[]
}

export interface SceneMetaPatch {
  intExt?: string | null
  location?: string | null
  timeOfDay?: string | null
}

interface ScriptState {
  doc: ScriptDocument
  selectedId: string | null
  focusRequestId: string | null
  saveStatus: SaveStatus
  hydrated: boolean
  dirty: boolean
  pageCount: number
  undoStack: HistorySnapshot[]
  redoStack: HistorySnapshot[]
  findOpen: boolean
  findQuery: string
  findTypeFilter: FindTypeFilter
  findMatchIndex: number
  hydrate: () => Promise<void>
  selectElement: (id: string | null) => void
  requestFocus: (id: string) => void
  clearFocusRequest: () => void
  updateElementText: (id: string, text: string) => void
  setElementType: (id: string, type: ElementType) => void
  cycleType: (id: string, direction?: 1 | -1) => void
  insertAfter: (id: string, type?: ElementType, text?: string) => string
  handleEnter: (id: string) => string | null
  deleteElement: (id: string) => string | null
  addScene: () => string
  updateSceneMeta: (sceneElementId: string, patch: SceneMetaPatch) => void
  setPageCount: (pageCount: number) => void
  undo: () => void
  redo: () => void
  saveNow: () => Promise<void>
  setTitle: (title: string) => void
  updateTitlePage: (patch: Partial<TitlePageInfo>) => void
  openFind: () => void
  closeFind: () => void
  setFindQuery: (query: string) => void
  setFindTypeFilter: (filter: FindTypeFilter) => void
  setFindMatchIndex: (index: number) => void
  goToFindMatch: (index: number) => void
  getFindMatches: () => FindMatch[]
  getScenes: () => SceneInfo[]
  getCharacters: () => string[]
  getPageEstimate: () => number
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let historyCoalesceTimer: ReturnType<typeof setTimeout> | null = null
let historyLocked = false

function cloneElements(elements: ScreenplayElement[]): ScreenplayElement[] {
  return elements.map((el) => ({ ...el }))
}

function cloneTitlePage(titlePage: TitlePageInfo): TitlePageInfo {
  return { ...titlePage }
}

function snapshotDoc(doc: ScriptDocument): HistorySnapshot {
  return {
    title: doc.title,
    titlePage: cloneTitlePage(doc.titlePage),
    elements: cloneElements(doc.elements),
  }
}

function snapshotsEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
  return (
    a.title === b.title &&
    JSON.stringify(a.titlePage) === JSON.stringify(b.titlePage) &&
    JSON.stringify(a.elements) === JSON.stringify(b.elements)
  )
}

function scheduleAutosave(get: () => ScriptState, set: (partial: Partial<ScriptState>) => void) {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    void get().saveNow()
  }, AUTOSAVE_MS)
  set({ dirty: true, saveStatus: 'dirty' })
}

function pushHistory(get: () => ScriptState, set: (partial: Partial<ScriptState>) => void) {
  if (historyLocked) return
  historyLocked = true
  const { doc, undoStack } = get()
  const snapshot = snapshotDoc(doc)
  const last = undoStack[undoStack.length - 1]
  if (!last || !snapshotsEqual(last, snapshot)) {
    set({
      undoStack: [...undoStack, snapshot].slice(-MAX_HISTORY),
      redoStack: [],
    })
  }
  if (historyCoalesceTimer) clearTimeout(historyCoalesceTimer)
  historyCoalesceTimer = setTimeout(() => {
    historyLocked = false
  }, 400)
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  doc: createSampleScript(),
  selectedId: null,
  focusRequestId: null,
  saveStatus: 'idle',
  hydrated: false,
  dirty: false,
  pageCount: 1,
  undoStack: [],
  redoStack: [],
  findOpen: false,
  findQuery: '',
  findTypeFilter: 'all',
  findMatchIndex: 0,

  hydrate: async () => {
    if (get().hydrated) return
    set({ saveStatus: 'loading' })
    try {
      const doc = await loadActiveScript()
      set({
        doc,
        selectedId: doc.elements[0]?.id ?? null,
        hydrated: true,
        dirty: false,
        saveStatus: 'saved',
        undoStack: [],
        redoStack: [],
      })
    } catch {
      const doc = createSampleScript()
      set({
        doc,
        selectedId: doc.elements[0]?.id ?? null,
        hydrated: true,
        dirty: true,
        saveStatus: 'error',
      })
    }
  },

  selectElement: (id) => set({ selectedId: id }),

  requestFocus: (id) => set({ selectedId: id, focusRequestId: id }),

  clearFocusRequest: () => set({ focusRequestId: null }),

  updateElementText: (id, text) => {
    pushHistory(get, set)
    set((state) => ({
      doc: {
        ...state.doc,
        elements: state.doc.elements.map((el) =>
          el.id === id ? { ...el, text } : el,
        ),
        updatedAt: Date.now(),
      },
    }))
    scheduleAutosave(get, set)
  },

  setElementType: (id, type) => {
    pushHistory(get, set)
    set((state) => ({
      doc: {
        ...state.doc,
        elements: state.doc.elements.map((el) => {
          if (el.id !== id) return el
          return {
            ...el,
            type,
            text: formatElementText(type, el.text),
          }
        }),
        updatedAt: Date.now(),
      },
    }))
    scheduleAutosave(get, set)
  },

  cycleType: (id, direction = 1) => {
    const element = get().doc.elements.find((el) => el.id === id)
    if (!element) return
    get().setElementType(id, cycleElementType(element.type, direction))
  },

  insertAfter: (id, type, text = '') => {
    pushHistory(get, set)
    const nextType =
      type ??
      ENTER_NEXT_TYPE[get().doc.elements.find((el) => el.id === id)?.type ?? 'action']
    const created = createElement(nextType, text)
    set((state) => {
      const index = state.doc.elements.findIndex((el) => el.id === id)
      const elements = [...state.doc.elements]
      elements.splice(index + 1, 0, created)
      return {
        doc: { ...state.doc, elements, updatedAt: Date.now() },
        selectedId: created.id,
        focusRequestId: created.id,
      }
    })
    scheduleAutosave(get, set)
    return created.id
  },

  handleEnter: (id) => {
    const element = get().doc.elements.find((el) => el.id === id)
    if (!element) return null

    const formatted = formatElementText(element.type, element.text)
    if (formatted !== element.text) {
      get().updateElementText(id, formatted)
    }

    if (element.text.trim() === '' && element.type !== 'sceneHeading') {
      get().cycleType(id, 1)
      return id
    }

    return get().insertAfter(id, ENTER_NEXT_TYPE[element.type])
  },

  deleteElement: (id) => {
    const { doc } = get()
    if (doc.elements.length <= 1) {
      get().updateElementText(id, '')
      return id
    }
    pushHistory(get, set)
    const index = doc.elements.findIndex((el) => el.id === id)
    const fallback = doc.elements[index - 1] ?? doc.elements[index + 1]
    set((state) => ({
      doc: {
        ...state.doc,
        elements: state.doc.elements.filter((el) => el.id !== id),
        updatedAt: Date.now(),
      },
      selectedId: fallback?.id ?? null,
      focusRequestId: fallback?.id ?? null,
    }))
    scheduleAutosave(get, set)
    return fallback?.id ?? null
  },

  addScene: () => {
    pushHistory(get, set)
    const heading = createElement('sceneHeading', 'INT. LOCATION - DAY')
    const action = createElement('action', '')
    set((state) => ({
      doc: {
        ...state.doc,
        elements: [...state.doc.elements, heading, action],
        updatedAt: Date.now(),
      },
      selectedId: heading.id,
      focusRequestId: heading.id,
    }))
    scheduleAutosave(get, set)
    return heading.id
  },

  updateSceneMeta: (sceneElementId, patch) => {
    const element = get().doc.elements.find((el) => el.id === sceneElementId)
    if (!element || element.type !== 'sceneHeading') return

    const current = parseSceneHeading(element.text)
    const nextHeading = composeSceneHeading({
      intExt: patch.intExt !== undefined ? patch.intExt : current.intExt,
      location: patch.location !== undefined ? patch.location : current.location,
      timeOfDay: patch.timeOfDay !== undefined ? patch.timeOfDay : current.timeOfDay,
    })

    if (nextHeading === element.text) return
    get().updateElementText(sceneElementId, nextHeading)
  },

  setPageCount: (pageCount) => {
    if (get().pageCount === pageCount) return
    set({ pageCount: Math.max(1, pageCount) })
  },

  undo: () => {
    const { undoStack, doc, redoStack } = get()
    if (undoStack.length === 0) return
    const previous = undoStack[undoStack.length - 1]!
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, snapshotDoc(doc)],
      doc: {
        ...doc,
        title: previous.title,
        titlePage: cloneTitlePage(previous.titlePage),
        elements: cloneElements(previous.elements),
        updatedAt: Date.now(),
      },
    })
    scheduleAutosave(get, set)
  },

  redo: () => {
    const { redoStack, doc, undoStack } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]!
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, snapshotDoc(doc)],
      doc: {
        ...doc,
        title: next.title,
        titlePage: cloneTitlePage(next.titlePage),
        elements: cloneElements(next.elements),
        updatedAt: Date.now(),
      },
    })
    scheduleAutosave(get, set)
  },

  saveNow: async () => {
    const { doc } = get()
    set({ saveStatus: 'saving' })
    try {
      await saveActiveScript(doc)
      set({ saveStatus: 'saved', dirty: false })
    } catch {
      set({ saveStatus: 'error' })
    }
  },

  setTitle: (title) => {
    pushHistory(get, set)
    set((state) => ({
      doc: {
        ...state.doc,
        title,
        titlePage: { ...state.doc.titlePage, title },
        updatedAt: Date.now(),
      },
    }))
    scheduleAutosave(get, set)
  },

  updateTitlePage: (patch) => {
    pushHistory(get, set)
    set((state) => {
      const titlePage = { ...state.doc.titlePage, ...patch }
      return {
        doc: {
          ...state.doc,
          title: titlePage.title,
          titlePage,
          updatedAt: Date.now(),
        },
      }
    })
    scheduleAutosave(get, set)
  },

  openFind: () => set({ findOpen: true }),
  closeFind: () => set({ findOpen: false }),
  setFindQuery: (findQuery) => set({ findQuery, findMatchIndex: 0 }),
  setFindTypeFilter: (findTypeFilter) => set({ findTypeFilter, findMatchIndex: 0 }),
  setFindMatchIndex: (findMatchIndex) => set({ findMatchIndex }),

  goToFindMatch: (index) => {
    const matches = get().getFindMatches()
    if (matches.length === 0) return
    const safe = ((index % matches.length) + matches.length) % matches.length
    const match = matches[safe]!
    set({ findMatchIndex: safe, selectedId: match.elementId, focusRequestId: match.elementId })
    window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-element-id="${match.elementId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  },

  getFindMatches: () =>
    findInScript(get().doc.elements, get().findQuery, get().findTypeFilter),

  getScenes: () => extractScenes(get().doc.elements),
  getCharacters: () => collectCharacterNames(get().doc.elements),
  getPageEstimate: () => estimatePageCount(get().doc.elements),
}))

export function getSelectedElement(state: ScriptState): ScreenplayElement | null {
  if (!state.selectedId) return null
  return state.doc.elements.find((el) => el.id === state.selectedId) ?? null
}

export function getSelectedScene(state: ScriptState): SceneInfo | null {
  return findSceneForElement(state.doc.elements, state.selectedId)
}
