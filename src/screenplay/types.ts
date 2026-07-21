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

/**
 * Writer-owned character dossier fields. Script-derived stats (cues, scenes,
 * dialogue counts, etc.) are computed from elements and not stored here.
 * Keyed by canonical uppercase cue name.
 */
export interface CharacterProfile {
  name: string
  aliases: string
  role: string
  ageRange: string
  gender: string
  castingNotes: string
  wardrobeNotes: string
  relationshipNotes: string
  arcNotes: string
  notes: string
  productionNotes: string
}

export function createEmptyCharacterProfile(name: string): CharacterProfile {
  return {
    name: name.trim().toUpperCase(),
    aliases: '',
    role: '',
    ageRange: '',
    gender: '',
    castingNotes: '',
    wardrobeNotes: '',
    relationshipNotes: '',
    arcNotes: '',
    notes: '',
    productionNotes: '',
  }
}

export interface ScriptDocument {
  id: string
  /** Owning project — script is the source of truth for story data. */
  projectId: string
  title: string
  format: 'feature'
  titlePage: TitlePageInfo
  elements: ScreenplayElement[]
  comments: ElementComment[]
  /** Optional dossiers for characters that appear in the script. */
  characterProfiles: CharacterProfile[]
  createdAt: number
  updatedAt: number
}

/** A project owns exactly one script (for now). */
export interface Project {
  id: string
  name: string
  format: 'feature'
  scriptId: string
  createdAt: number
  updatedAt: number
}

/** Workspace pointer — which project is open. */
export interface WorkspaceMeta {
  id: 'workspace'
  activeProjectId: string | null
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
    credit: '',
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
