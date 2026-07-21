import { create } from 'zustand'
import {
  collectCharacterNames,
  collectLocationNames,
  composeSceneHeading,
  createElement,
  cycleTabElementType,
  ENTER_NEXT_TYPE,
  estimatePageCount,
  extractScenes,
  findSceneForElement,
  formatElementText,
  isBlankElement,
  parseSceneHeading,
  pruneBlankElements,
  reorderSceneElements,
} from '@/screenplay/elementRules'
import { findInScript, type FindMatch, type FindTypeFilter } from '@/screenplay/findScript'
import {
  loadWorkspace,
  saveProject,
  saveScriptDocument,
  setActiveProjectId,
} from '@/screenplay/idb'
import { createUntitledProject } from '@/screenplay/sampleScript'
import type {
  ElementComment,
  ElementType,
  Project,
  SaveStatus,
  SceneInfo,
  ScreenplayElement,
  ScriptDocument,
  TitlePageInfo,
} from '@/screenplay/types'

const MAX_HISTORY = 80
const AUTOSAVE_MS = 700

export interface CaretPosition {
  start: number
  end: number
}

interface HistorySnapshot {
  title: string
  titlePage: TitlePageInfo
  elements: ScreenplayElement[]
  comments: ElementComment[]
  selectedId: string | null
  caret: CaretPosition | null
}

export interface SceneMetaPatch {
  intExt?: string | null
  location?: string | null
  timeOfDay?: string | null
}

export interface CommentDraft {
  elementId: string
  text: string
  /** Partial selection into the element text; omitted = whole element. */
  startOffset?: number
  endOffset?: number
  quote?: string
}

interface ScriptState {
  doc: ScriptDocument
  project: Project
  projects: Project[]
  selectedId: string | null
  focusRequestId: string | null
  focusCaret: CaretPosition | null
  saveStatus: SaveStatus
  hydrated: boolean
  dirty: boolean
  pageCount: number
  /** Which page is in view: title page or a 1-based script body page. */
  viewPage: 'title' | number
  undoStack: HistorySnapshot[]
  redoStack: HistorySnapshot[]
  findOpen: boolean
  findQuery: string
  findTypeFilter: FindTypeFilter
  findMatchIndex: number
  commentDraft: CommentDraft | null
  activeCommentId: string | null
  hydrate: () => Promise<void>
  openProject: (projectId: string) => Promise<void>
  renameProject: (name: string) => void
  reorderScene: (sceneId: string, beforeSceneId: string | null) => void
  renameScene: (sceneId: string, heading: string) => void
  selectElement: (id: string | null) => void
  requestFocus: (id: string, caret?: CaretPosition | null) => void
  clearFocusRequest: () => void
  rememberCaret: (id: string, caret: CaretPosition) => void
  pruneBlankElements: (keepId?: string | null) => void
  updateElementText: (id: string, text: string) => void
  setElementType: (id: string, type: ElementType) => void
  cycleType: (id: string, direction?: 1 | -1) => void
  insertAfter: (id: string, type?: ElementType, text?: string) => string
  handleEnter: (id: string) => string | null
  deleteElement: (id: string) => string | null
  addScene: () => string
  updateSceneMeta: (sceneElementId: string, patch: SceneMetaPatch) => void
  setPageCount: (pageCount: number) => void
  setViewPage: (viewPage: 'title' | number) => void
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
  getLocations: () => string[]
  getPageEstimate: () => number
  startCommentDraft: (
    elementId: string,
    range?: { start: number; end: number; quote?: string } | null,
  ) => void
  setCommentDraftText: (text: string) => void
  cancelCommentDraft: () => void
  submitCommentDraft: () => void
  setActiveComment: (commentId: string | null) => void
  resolveComment: (commentId: string) => void
  deleteComment: (commentId: string) => void
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let historyCoalesceTimer: ReturnType<typeof setTimeout> | null = null
let historyLocked = false

function cloneElements(elements: ScreenplayElement[]): ScreenplayElement[] {
  return elements.map((el) => ({ ...el }))
}

function cloneComments(comments: ElementComment[]): ElementComment[] {
  return comments.map((comment) => ({ ...comment }))
}

function cloneTitlePage(titlePage: TitlePageInfo): TitlePageInfo {
  return { ...titlePage }
}

function commentAuthorName(doc: ScriptDocument): string {
  const fromTitle = doc.titlePage.authors.trim().split('\n')[0]?.trim()
  return fromTitle || 'You'
}

function createCommentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `cmt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function captureCaret(): CaretPosition | null {
  const el = document.activeElement
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    }
  }
  return null
}

function snapshotDoc(
  doc: ScriptDocument,
  selectedId: string | null,
  caret: CaretPosition | null = captureCaret(),
): HistorySnapshot {
  return {
    title: doc.title,
    titlePage: cloneTitlePage(doc.titlePage),
    elements: cloneElements(doc.elements),
    comments: cloneComments(doc.comments),
    selectedId,
    caret,
  }
}

function snapshotsEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
  return (
    a.title === b.title &&
    JSON.stringify(a.titlePage) === JSON.stringify(b.titlePage) &&
    JSON.stringify(a.elements) === JSON.stringify(b.elements) &&
    JSON.stringify(a.comments) === JSON.stringify(b.comments)
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
  const { doc, undoStack, selectedId } = get()
  const snapshot = snapshotDoc(doc, selectedId, captureCaret())
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

function focusAfterHistory(
  elements: ScreenplayElement[],
  preferredId: string | null,
  caret: CaretPosition | null,
  fallbackId: string | null,
): { selectedId: string | null; focusRequestId: string | null; focusCaret: CaretPosition | null } {
  const id =
    (preferredId && elements.some((el) => el.id === preferredId) ? preferredId : null) ??
    (fallbackId && elements.some((el) => el.id === fallbackId) ? fallbackId : null) ??
    elements[0]?.id ??
    null

  if (!id) {
    return { selectedId: null, focusRequestId: null, focusCaret: null }
  }

  const element = elements.find((el) => el.id === id)
  const max = element?.text.length ?? 0
  const restoredCaret =
    caret == null
      ? { start: max, end: max }
      : {
          start: Math.min(Math.max(caret.start, 0), max),
          end: Math.min(Math.max(caret.end, 0), max),
        }

  return {
    selectedId: id,
    focusRequestId: id,
    focusCaret: restoredCaret,
  }
}

function scrollElementIntoView(elementId: string | null) {
  if (!elementId || typeof document === 'undefined') return
  window.requestAnimationFrame(() => {
    document
      .querySelector(`[data-element-id="${elementId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

export const useScriptStore = create<ScriptState>((set, get) => {
  const bootstrap = createUntitledProject()

  return {
  doc: bootstrap.script,
  project: bootstrap.project,
  projects: [bootstrap.project],
  selectedId: null,
  focusRequestId: null,
  focusCaret: null,
  saveStatus: 'idle',
  hydrated: false,
  dirty: false,
  pageCount: 1,
  viewPage: 'title',
  undoStack: [],
  redoStack: [],
  findOpen: false,
  findQuery: '',
  findTypeFilter: 'all',
  findMatchIndex: 0,
  commentDraft: null,
  activeCommentId: null,

  hydrate: async () => {
    if (get().hydrated) return
    set({ saveStatus: 'loading' })
    try {
      const { project, script, projects } = await loadWorkspace()
      set({
        doc: script,
        project,
        projects,
        selectedId: null,
        focusRequestId: null,
        focusCaret: null,
        hydrated: true,
        dirty: false,
        saveStatus: 'saved',
        undoStack: [],
        redoStack: [],
      })
    } catch {
      const fallback = createUntitledProject()
      set({
        doc: fallback.script,
        project: fallback.project,
        projects: [fallback.project],
        selectedId: null,
        focusRequestId: null,
        focusCaret: null,
        hydrated: true,
        dirty: true,
        saveStatus: 'error',
      })
    }
  },

  openProject: async (projectId) => {
    await setActiveProjectId(projectId)
    const { project, script, projects } = await loadWorkspace()
    if (project.id !== projectId) return
    set({
      project,
      projects,
      doc: script,
      selectedId: null,
      focusRequestId: null,
      focusCaret: null,
      dirty: false,
      saveStatus: 'saved',
      undoStack: [],
      redoStack: [],
      commentDraft: null,
      activeCommentId: null,
      viewPage: 'title',
    })
  },

  renameProject: (name) => {
    const trimmed = name.trim() || 'Untitled'
    const project = { ...get().project, name: trimmed, updatedAt: Date.now() }
    set((state) => ({
      project,
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    }))
    void saveProject(project)
  },

  reorderScene: (sceneId, beforeSceneId) => {
    const next = reorderSceneElements(get().doc.elements, sceneId, beforeSceneId)
    if (next === get().doc.elements) return
    pushHistory(get, set)
    set((state) => ({
      doc: {
        ...state.doc,
        elements: next,
        updatedAt: Date.now(),
      },
    }))
    scheduleAutosave(get, set)
  },

  renameScene: (sceneId, heading) => {
    get().updateElementText(sceneId, heading.toUpperCase())
  },

  selectElement: (id) =>
    set(
      id == null
        ? { selectedId: null, focusRequestId: null, focusCaret: null }
        : { selectedId: id },
    ),

  requestFocus: (id, caret = null) =>
    set({ selectedId: id, focusRequestId: id, focusCaret: caret }),

  clearFocusRequest: () => set({ focusRequestId: null }),

  rememberCaret: (id, caret) => {
    if (get().selectedId !== id) return
    set({ focusCaret: caret })
  },

  pruneBlankElements: (keepId) => {
    const { doc, selectedId, focusRequestId, commentDraft } = get()
    const keep = keepId === undefined ? selectedId : keepId
    const elements = pruneBlankElements(doc.elements, keep)
    if (
      elements.length === doc.elements.length &&
      elements.every((el, index) => el.id === doc.elements[index]?.id)
    ) {
      return
    }

    const ids = new Set(elements.map((el) => el.id))
    set({
      doc: {
        ...doc,
        elements,
        comments: doc.comments.filter((comment) => ids.has(comment.elementId)),
        updatedAt: Date.now(),
      },
      selectedId: selectedId && ids.has(selectedId) ? selectedId : null,
      focusRequestId:
        focusRequestId && ids.has(focusRequestId) ? focusRequestId : null,
      commentDraft:
        commentDraft && ids.has(commentDraft.elementId) ? commentDraft : null,
    })
    scheduleAutosave(get, set)
  },

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
          // Drop empty parenthetical marker so Tab-cycling onto scene heading
          // does not inherit "()" (and previously "INT. ()").
          const raw =
            el.type === 'parenthetical' && el.text.trim() === '()' ? '' : el.text
          return {
            ...el,
            type,
            text: formatElementText(type, raw),
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
    const nextType = cycleTabElementType(element.type, direction)
    get().setElementType(id, nextType)
    // Keep keyboard focus on the element after input/textarea remounts.
    // Parentheticals start as "()" — place caret between the parens.
    const nextText = get().doc.elements.find((el) => el.id === id)?.text ?? ''
    const caret =
      nextType === 'parenthetical'
        ? { start: 1, end: 1 }
        : null
    set({
      selectedId: id,
      focusRequestId: id,
      focusCaret: caret ?? (nextText ? { start: nextText.length, end: nextText.length } : null),
    })
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
      // Drop blank placeholders between content; keep the new writing line.
      const pruned = pruneBlankElements(elements, created.id)
      const ids = new Set(pruned.map((el) => el.id))
      return {
        doc: {
          ...state.doc,
          elements: pruned,
          comments: state.doc.comments.filter((comment) => ids.has(comment.elementId)),
          updatedAt: Date.now(),
        },
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

    // Empty lines: Tab cycles type; Enter does not invent a new blank row.
    // (SmartType accept is handled in the editor before this runs.)
    if (isBlankElement(element)) {
      return id
    }

    const formatted = formatElementText(element.type, element.text)
    if (formatted !== element.text) {
      get().updateElementText(id, formatted)
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
        comments: state.doc.comments.filter((comment) => comment.elementId !== id),
        updatedAt: Date.now(),
      },
      selectedId: fallback?.id ?? null,
      focusRequestId: fallback?.id ?? null,
      commentDraft:
        state.commentDraft?.elementId === id ? null : state.commentDraft,
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

  setViewPage: (viewPage) => {
    if (get().viewPage === viewPage) return
    set({ viewPage })
  },

  undo: () => {
    const { undoStack, doc, redoStack, selectedId } = get()
    if (undoStack.length === 0) return
    const previous = undoStack[undoStack.length - 1]!
    const focus = focusAfterHistory(
      previous.elements,
      previous.selectedId,
      previous.caret,
      selectedId,
    )
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, snapshotDoc(doc, selectedId, captureCaret())],
      doc: {
        ...doc,
        title: previous.title,
        titlePage: cloneTitlePage(previous.titlePage),
        elements: cloneElements(previous.elements),
        comments: cloneComments(previous.comments),
        updatedAt: Date.now(),
      },
      ...focus,
    })
    scheduleAutosave(get, set)
    scrollElementIntoView(focus.focusRequestId)
  },

  redo: () => {
    const { redoStack, doc, undoStack, selectedId } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]!
    const focus = focusAfterHistory(
      next.elements,
      next.selectedId,
      next.caret,
      selectedId,
    )
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, snapshotDoc(doc, selectedId, captureCaret())],
      doc: {
        ...doc,
        title: next.title,
        titlePage: cloneTitlePage(next.titlePage),
        elements: cloneElements(next.elements),
        comments: cloneComments(next.comments),
        updatedAt: Date.now(),
      },
      ...focus,
    })
    scheduleAutosave(get, set)
    scrollElementIntoView(focus.focusRequestId)
  },

  saveNow: async () => {
    // Drop blank placeholders between content; keep the active writing line in-memory.
    get().pruneBlankElements(get().selectedId)
    set({ saveStatus: 'saving' })
    try {
      const saved = await saveScriptDocument(get().doc)
      const project = { ...get().project, updatedAt: saved.updatedAt }
      set((state) => ({
        doc: saved,
        project,
        projects: state.projects.map((p) => (p.id === project.id ? project : p)),
        saveStatus: 'saved',
        dirty: false,
      }))
      void saveProject(project)
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
    set({ findMatchIndex: safe, selectedId: match.elementId, focusRequestId: match.elementId, focusCaret: { start: match.start, end: match.end } })
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
  getLocations: () => collectLocationNames(get().doc.elements),
  getPageEstimate: () => estimatePageCount(get().doc.elements),

  startCommentDraft: (elementId, range = null) => {
    const element = get().doc.elements.find((el) => el.id === elementId)
    if (!element) return

    let startOffset: number | undefined
    let endOffset: number | undefined
    let quote: string | undefined

    if (range && range.end > range.start) {
      const start = Math.max(0, Math.min(range.start, element.text.length))
      const end = Math.max(start, Math.min(range.end, element.text.length))
      if (end > start) {
        startOffset = start
        endOffset = end
        quote = range.quote ?? element.text.slice(start, end)
      }
    }

    set({
      selectedId: elementId,
      commentDraft: {
        elementId,
        text: '',
        startOffset,
        endOffset,
        quote,
      },
      activeCommentId: null,
    })
  },

  setCommentDraftText: (text) => {
    const draft = get().commentDraft
    if (!draft) return
    set({ commentDraft: { ...draft, text } })
  },

  cancelCommentDraft: () => set({ commentDraft: null }),

  submitCommentDraft: () => {
    const draft = get().commentDraft
    if (!draft) return
    const text = draft.text.trim()
    if (!text) return

    pushHistory(get, set)
    const now = Date.now()
    const comment: ElementComment = {
      id: createCommentId(),
      elementId: draft.elementId,
      author: commentAuthorName(get().doc),
      text,
      createdAt: now,
      updatedAt: now,
      resolved: false,
      startOffset: draft.startOffset,
      endOffset: draft.endOffset,
      quote: draft.quote,
    }

    set((state) => ({
      doc: {
        ...state.doc,
        comments: [...state.doc.comments, comment],
        updatedAt: now,
      },
      commentDraft: null,
      activeCommentId: comment.id,
    }))
    scheduleAutosave(get, set)
  },

  setActiveComment: (commentId) => set({ activeCommentId: commentId }),

  resolveComment: (commentId) => {
    pushHistory(get, set)
    set((state) => ({
      doc: {
        ...state.doc,
        comments: state.doc.comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, resolved: true, updatedAt: Date.now() }
            : comment,
        ),
        updatedAt: Date.now(),
      },
      activeCommentId:
        state.activeCommentId === commentId ? null : state.activeCommentId,
    }))
    scheduleAutosave(get, set)
  },

  deleteComment: (commentId) => {
    pushHistory(get, set)
    set((state) => ({
      doc: {
        ...state.doc,
        comments: state.doc.comments.filter((comment) => comment.id !== commentId),
        updatedAt: Date.now(),
      },
      activeCommentId:
        state.activeCommentId === commentId ? null : state.activeCommentId,
    }))
    scheduleAutosave(get, set)
  },
  }
})

export function getSelectedElement(state: ScriptState): ScreenplayElement | null {
  if (!state.selectedId) return null
  return state.doc.elements.find((el) => el.id === state.selectedId) ?? null
}

export function getSelectedScene(state: ScriptState): SceneInfo | null {
  return findSceneForElement(state.doc.elements, state.selectedId)
}
