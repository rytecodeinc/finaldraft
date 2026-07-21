import { TIME_OF_DAY_OPTIONS } from './elementRules'
import { collectTimesOfDay } from './smartType'
import type { ElementType, ScreenplayElement } from './types'

export type TabAction =
  | { kind: 'text'; text: string }
  | { kind: 'cycle'; direction: 1 | -1 }
  | { kind: 'none' }

/**
 * Tab cycles element types. SmartType options are confirmed with Enter, not Tab.
 * Scene headings still get field-advance (INT → location → time) before cycling.
 */
export function resolveTabAction(options: {
  elementType: ElementType
  text: string
  shiftKey: boolean
  elements: ScreenplayElement[]
}): TabAction {
  const { elementType, text, shiftKey, elements } = options

  if (shiftKey) {
    return { kind: 'cycle', direction: -1 }
  }

  // Scene heading field walker / abbreviation completion first
  if (elementType === 'sceneHeading') {
    const advanced = advanceSceneHeadingField(text, elements)
    if (advanced !== null) {
      return { kind: 'text', text: advanced }
    }
  }

  return { kind: 'cycle', direction: 1 }
}

/**
 * Advance / complete scene heading sections with Tab:
 * "INT" → "INT. " → "INT. COFFEE SHOP - " → complete time
 * Returns null when Tab should fall through to type cycling.
 */
export function advanceSceneHeadingField(
  text: string,
  elements: ScreenplayElement[],
): string | null {
  const trimmed = text.trim()
  const upper = trimmed.toUpperCase()

  // 1) Abbreviation completion: INT / EXT / EST / I/E → dotted form + space
  const abbrev = completeIntExtAbbreviation(upper)
  if (abbrev) {
    return `${abbrev} `
  }

  // 2) "INT." only → ensure trailing space (location field)
  if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)$/i.test(upper)) {
    return `${upper} `
  }

  // 3) "INT. LOCATION" without dash → move to time-of-day field
  if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+\S+/i.test(trimmed) && !/[-–—]/.test(trimmed)) {
    const match = trimmed.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+(.+)$/i)
    if (match) {
      const intExt = match[1]!.toUpperCase()
      const location = match[2]!.trim().toUpperCase()
      if (location) return `${intExt} ${location} - `
    }
  }

  // 4) "INT. LOCATION - partialTime" → autocomplete time when possible
  const timed = trimmed.match(
    /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+(.+?)\s*[-–—]\s*(.*)$/i,
  )
  if (timed) {
    const intExt = timed[1]!.toUpperCase()
    const location = timed[2]!.trim().toUpperCase()
    const timeQuery = (timed[3] ?? '').trim().toUpperCase()
    const times = collectTimesOfDay(elements)

    if (!timeQuery) {
      return `${intExt} ${location} - `
    }

    const hit =
      times.find((t) => t === timeQuery) ??
      times.find((t) => t.startsWith(timeQuery)) ??
      [...TIME_OF_DAY_OPTIONS].find((t) => t.startsWith(timeQuery))

    if (hit && hit !== timeQuery) {
      return `${intExt} ${location} - ${hit}`
    }

    return null
  }

  // 5) "INT COFFEE SHOP" (missing dots) → normalize and jump to time
  const loose = trimmed.match(/^(INT|EXT|EST|I\/E|INT\/EXT)\s+(.+)$/i)
  if (loose) {
    const map: Record<string, string> = {
      INT: 'INT.',
      EXT: 'EXT.',
      EST: 'EST.',
      'I/E': 'INT/EXT.',
      'INT/EXT': 'INT/EXT.',
    }
    const intExt = map[loose[1]!.toUpperCase()] ?? 'INT.'
    const rest = loose[2]!.trim().toUpperCase()
    if (!/[-–—]/.test(rest)) {
      return `${intExt} ${rest} - `
    }
  }

  return null
}

function completeIntExtAbbreviation(upper: string): string | null {
  if (/[\s\-–—]/.test(upper)) return null

  const table: Record<string, string> = {
    I: 'INT.',
    IN: 'INT.',
    INT: 'INT.',
    'INT.': 'INT.',
    E: 'EXT.',
    EX: 'EXT.',
    EXT: 'EXT.',
    'EXT.': 'EXT.',
    EST: 'EST.',
    'EST.': 'EST.',
    'I/E': 'INT/EXT.',
    'I/E.': 'INT/EXT.',
    'INT/EXT': 'INT/EXT.',
    'INT/EXT.': 'INT/EXT.',
  }

  const hit = table[upper]
  if (!hit) return null
  return hit
}
