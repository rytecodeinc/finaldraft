import { TIME_OF_DAY_OPTIONS } from './elementRules'
import { collectTimesOfDay } from './smartType'
import type { ElementType, ScreenplayElement } from './types'

export type TabAction =
  | { kind: 'text'; text: string }
  | { kind: 'cycle'; direction: 1 | -1 }
  | { kind: 'none' }

/**
 * Tab cycles element types. SmartType options are confirmed with Enter, not Tab.
 * Scene headings only field-advance when there is a real incomplete abbrev or
 * location → time step — not when empty or already on a bare INT./EXT.
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
 * "INT" → "INT. " → (type after location) → "INT. COFFEE SHOP - "
 * Returns null when Tab should fall through to type cycling.
 *
 * Empty and bare "INT." / "EXT." intentionally return null so Tab keeps
 * cycling element types instead of trapping on the INT. SmartType option.
 */
export function advanceSceneHeadingField(
  text: string,
  elements: ScreenplayElement[],
): string | null {
  const trimmed = text.trim()
  const upper = trimmed.toUpperCase()

  // Empty → cycle types (do not force INT.)
  if (!trimmed) {
    return null
  }

  // Bare INT./EXT. (optional trailing space) → cycle types
  if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s*$/i.test(upper)) {
    return null
  }

  // 1) Incomplete abbreviation only: INT / EXT / EST / I/E → dotted form + space
  const abbrev = completeIntExtAbbreviation(upper)
  if (abbrev) {
    return `${abbrev} `
  }

  // 2) "INT. LOCATION" without dash → move to time-of-day field
  if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+\S+/i.test(trimmed) && !/[-–—]/.test(trimmed)) {
    const match = trimmed.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+(.+)$/i)
    if (match) {
      const intExt = match[1]!.toUpperCase()
      const location = match[2]!.trim().toUpperCase()
      if (location) return `${intExt} ${location} - `
    }
  }

  // 3) "INT. LOCATION - partialTime" → autocomplete time when possible
  const timed = trimmed.match(
    /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+(.+?)\s*[-–—]\s*(.*)$/i,
  )
  if (timed) {
    const intExt = timed[1]!.toUpperCase()
    const location = timed[2]!.trim().toUpperCase()
    const timeQuery = (timed[3] ?? '').trim().toUpperCase()
    const times = collectTimesOfDay(elements)

    if (!timeQuery) {
      // Already at time field with no query — cycle rather than re-applying the same text
      return null
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

  // 4) "INT COFFEE SHOP" (missing dots) → normalize and jump to time
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
  // Only incomplete tokens — already-dotted INT./EXT. must cycle types.
  if (/[\s\-–—]/.test(upper)) return null
  if (/\.$/.test(upper)) return null

  const table: Record<string, string> = {
    I: 'INT.',
    IN: 'INT.',
    INT: 'INT.',
    E: 'EXT.',
    EX: 'EXT.',
    EXT: 'EXT.',
    EST: 'EST.',
    'I/E': 'INT/EXT.',
    'INT/EXT': 'INT/EXT.',
  }

  return table[upper] ?? null
}
