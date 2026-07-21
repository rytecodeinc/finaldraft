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
