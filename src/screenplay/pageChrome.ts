import type { ScreenplayElement } from './types'

/** Resolve the speaking character for a dialogue/parenthetical element. */
export function findCharacterNameForElement(
  elements: ScreenplayElement[],
  elementId: string,
): string | null {
  const index = elements.findIndex((el) => el.id === elementId)
  if (index < 0) return null

  for (let i = index; i >= 0; i -= 1) {
    const el = elements[i]!
    if (el.type === 'character') {
      return el.text.replace(/\(.*?\)/g, '').replace(/\s*\(CONT'D\)\s*/gi, '').trim().toUpperCase()
    }
    if (el.type === 'sceneHeading' || el.type === 'transition' || el.type === 'action') {
      if (i !== index) break
    }
  }
  return null
}

export interface PageBreakChrome {
  /** Show (MORE) at the bottom of this page. */
  showMore: boolean
  /** Character name for CONT'D cue at the top of the next page. */
  continuedCharacter: string | null
}

/**
 * Decide MORE / CONTINUED chrome for a boundary between two pages.
 */
export function getPageBreakChrome(
  elements: ScreenplayElement[],
  pageElementIds: string[],
  nextPageElementIds: string[],
): PageBreakChrome {
  if (pageElementIds.length === 0 || nextPageElementIds.length === 0) {
    return { showMore: false, continuedCharacter: null }
  }

  const lastId = pageElementIds[pageElementIds.length - 1]!
  const firstId = nextPageElementIds[0]!
  const last = elements.find((el) => el.id === lastId)
  const first = elements.find((el) => el.id === firstId)
  if (!last || !first) return { showMore: false, continuedCharacter: null }

  const lastIsSpeech = last.type === 'dialogue' || last.type === 'parenthetical'
  const firstIsSpeech = first.type === 'dialogue' || first.type === 'parenthetical'
  const firstIsCharacter = first.type === 'character'

  if (!lastIsSpeech) {
    return { showMore: false, continuedCharacter: null }
  }

  const speaker = findCharacterNameForElement(elements, lastId)
  if (!speaker) return { showMore: false, continuedCharacter: null }

  if (firstIsSpeech) {
    const nextSpeaker = findCharacterNameForElement(elements, firstId)
    if (nextSpeaker && nextSpeaker === speaker) {
      return { showMore: true, continuedCharacter: speaker }
    }
  }

  if (firstIsCharacter) {
    const name = first.text.replace(/\(.*?\)/g, '').replace(/\s*\(CONT'D\)\s*/gi, '').trim().toUpperCase()
    if (name === speaker) {
      return { showMore: true, continuedCharacter: speaker }
    }
  }

  return { showMore: false, continuedCharacter: null }
}
