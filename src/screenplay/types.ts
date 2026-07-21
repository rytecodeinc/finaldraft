export const ELEMENT_TYPES = [
  'sceneHeading',
  'action',
  'character',
  'parenthetical',
  'dialogue',
  'transition',
] as const

export type ElementType = (typeof ELEMENT_TYPES)[number]

export interface ScreenplayElement {
  id: string
  type: ElementType
  text: string
}

/** Google Docs–style margin comment attached to a script element. */
export interface ElementComment {
  id: string
  elementId: string
  author: string
  text: string
  createdAt: number
  updatedAt: number
  /** Resolved comments stay in the sidebar list but leave the margin. */
  resolved: boolean
  /**
   * Optional character offsets into the element text at comment time.
   * When both are set and end > start, only that span is highlighted.
   * Omitted (or collapsed) means the whole element.
   */
  startOffset?: number
  endOffset?: number
  /** Snapshot of the selected text when the comment was created. */
  quote?: string
}

/** Full Final Draft–style title page fields. */
export interface TitlePageInfo {
  title: string
  credit: string
  authors: string
  basedOn: string
  contact: string
  copyright: string
  draftDate: string
  revision: string
}

export interface ScriptDocument {
  id: string
  title: string
  format: 'feature'
  titlePage: TitlePageInfo
  elements: ScreenplayElement[]
  comments: ElementComment[]
  createdAt: number
  updatedAt: number
}

export interface SceneInfo {
  id: string
  number: number
  heading: string
  intExt: string | null
  location: string | null
  timeOfDay: string | null
  elementIndex: number
}

export interface ParsedSceneHeading {
  intExt: string | null
  location: string | null
  timeOfDay: string | null
}

export type SaveStatus = 'idle' | 'loading' | 'dirty' | 'saving' | 'saved' | 'error'

export const ELEMENT_LABELS: Record<ElementType, string> = {
  sceneHeading: 'Scene Heading',
  action: 'Action',
  character: 'Character',
  parenthetical: 'Parenthetical',
  dialogue: 'Dialogue',
  transition: 'Transition',
}

export function createDefaultTitlePage(title = 'Untitled Screenplay'): TitlePageInfo {
  return {
    title,
    credit: 'Written by',
    authors: '',
    basedOn: '',
    contact: '',
    copyright: '',
    draftDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    revision: 'First Draft',
  }
}
