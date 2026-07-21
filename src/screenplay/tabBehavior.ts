import { TIME_OF_DAY_OPTIONS } from './elementRules'
import type { SmartTypeSuggestion } from './smartType'
import { collectTimesOfDay } from './smartType'
import type { ElementType, ScreenplayElement } from './types'

export type TabAction =
  | { kind: 'text'; text: string }
  | { kind: 'accept'; suggestion: SmartTypeSuggestion }
  | { kind: 'cycle'; direction: 1 | -1 }
  | { kind: 'none' }

/**
 * Context-aware Tab for screenplay elements.
 * Prefers SmartType acceptance and scene-heading field navigation over type cycling.
 */
export function resolveTabAction(options: {
  elementType: ElementType
  text: string
  suggestions: SmartTypeSuggestion[]
  activeSuggestionIndex: number
  menuOpen: boolean
  shiftKey: boolean
  elements: ScreenplayElement[]
}): TabAction {
  const {
    elementType,
    text,
    suggestions,
    activeSuggestionIndex,
    menuOpen,
    shiftKey,
    elements,
  } = options

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

  // Accept SmartType when the menu is open and there's a useful match
  if (menuOpen && suggestions.length > 0) {
    const active = suggestions[activeSuggestionIndex] ?? suggestions[0]!
    const prefixHit = pickPrefixSuggestion(text, suggestions)
    if (prefixHit) return { kind: 'accept', suggestion: prefixHit }
    if (elementType !== 'sceneHeading' || text.trim().length > 0) {
      return { kind: 'accept', suggestion: active }
    }
  }

  if (elementType === 'character' || elementType === 'transition') {
    const best = pickPrefixSuggestion(text, suggestions)
    if (best) return { kind: 'accept', suggestion: best }
  }

  return { kind: 'cycle', direction: 1 }
}

function pickPrefixSuggestion(
  text: string,
  suggestions: SmartTypeSuggestion[],
): SmartTypeSuggestion | null {
  const q = text.trim().toUpperCase()
  if (!q) return null
  const exact = suggestions.find((s) => s.label.toUpperCase() === q)
  if (exact) return exact
  return suggestions.find((s) => s.label.toUpperCase().startsWith(q)) ?? null
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
      // Already in time field with empty value — keep caret there (no type cycle)
      return `${intExt} ${location} - `
    }

    const hit =
      times.find((t) => t === timeQuery) ??
      times.find((t) => t.startsWith(timeQuery)) ??
      [...TIME_OF_DAY_OPTIONS].find((t) => t.startsWith(timeQuery))

    if (hit && hit !== timeQuery) {
      return `${intExt} ${location} - ${hit}`
    }

    // Heading looks complete — allow Tab to cycle element type
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
  // Only when the whole field is the abbreviation (no location yet)
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

  // If already the canonical dotted token, still advance to location field via caller
  if (upper === hit) return hit
  return hit
}
