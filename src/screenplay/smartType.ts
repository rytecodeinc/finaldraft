import {
  collectCharacterNames,
  parseSceneHeading,
  TIME_OF_DAY_OPTIONS,
} from './elementRules'
import type { ElementType, ScreenplayElement } from './types'

export const DEFAULT_TRANSITIONS = [
  'CUT TO:',
  'FADE OUT.',
  'FADE IN:',
  'DISSOLVE TO:',
  'SMASH CUT TO:',
  'MATCH CUT TO:',
  'JUMP CUT TO:',
  'TIME CUT:',
  'WIPE TO:',
] as const

export interface SmartTypeSuggestion {
  id: string
  label: string
  insertText: string
  group: 'character' | 'location' | 'time' | 'transition' | 'intExt'
}

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

export function collectLocations(elements: ScreenplayElement[]): string[] {
  const locations: string[] = []
  for (const element of elements) {
    if (element.type !== 'sceneHeading') continue
    const parsed = parseSceneHeading(element.text)
    if (parsed.location) locations.push(parsed.location)
  }
  return uniquePreserveOrder(locations).sort()
}

export function collectTimesOfDay(elements: ScreenplayElement[]): string[] {
  const times: string[] = []
  for (const element of elements) {
    if (element.type !== 'sceneHeading') continue
    const parsed = parseSceneHeading(element.text)
    if (parsed.timeOfDay) times.push(parsed.timeOfDay)
  }
  return uniquePreserveOrder([...times, ...TIME_OF_DAY_OPTIONS]).sort()
}

export function collectTransitions(elements: ScreenplayElement[]): string[] {
  const used: string[] = []
  for (const element of elements) {
    if (element.type !== 'transition') continue
    if (element.text.trim()) used.push(element.text.trim().toUpperCase())
  }
  return uniquePreserveOrder([...used, ...DEFAULT_TRANSITIONS])
}

function filterByQuery(labels: string[], query: string): string[] {
  const q = query.trim().toUpperCase()
  if (!q) return labels.slice(0, 8)
  return labels.filter((label) => label.toUpperCase().includes(q)).slice(0, 8)
}

/**
 * Build SmartType suggestions for the active element and current text.
 */
export function getSmartTypeSuggestions(
  elementType: ElementType,
  text: string,
  elements: ScreenplayElement[],
  excludeElementId?: string,
): SmartTypeSuggestion[] {
  const corpus = excludeElementId
    ? elements.filter((el) => el.id !== excludeElementId)
    : elements

  if (elementType === 'character') {
    return filterByQuery(collectCharacterNames(corpus), text).map((label) => ({
      id: `character:${label}`,
      label,
      insertText: label,
      group: 'character' as const,
    }))
  }

  if (elementType === 'transition') {
    return filterByQuery(collectTransitions(corpus), text).map((label) => ({
      id: `transition:${label}`,
      label,
      insertText: label,
      group: 'transition' as const,
    }))
  }

  if (elementType === 'sceneHeading') {
    return getSceneHeadingSuggestions(text, corpus)
  }

  return []
}

function getSceneHeadingSuggestions(
  text: string,
  elements: ScreenplayElement[],
): SmartTypeSuggestion[] {
  const upper = text.toUpperCase()
  const locations = collectLocations(elements)
  const times = collectTimesOfDay(elements)

  // After a dash, suggest time of day
  const dashIndex = Math.max(
    text.lastIndexOf('-'),
    text.lastIndexOf('–'),
    text.lastIndexOf('—'),
  )
  if (dashIndex >= 0) {
    const beforeDash = `${text.slice(0, dashIndex + 1)} `
    const timeQuery = text.slice(dashIndex + 1).trim()
    return filterByQuery(times, timeQuery).map((label) => ({
      id: `time:${label}`,
      label,
      insertText: `${beforeDash.replace(/\s+$/, ' ')}${label}`,
      group: 'time' as const,
    }))
  }

  // Bare start or partial INT/EXT → offer completions
  if (!upper.trim() || /^(I|IN|INT|E|EX|EXT|EST|I\/E|INT\/EXT)\.?$/i.test(upper.trim())) {
    const options = ['INT.', 'EXT.', 'INT/EXT.', 'I/E.', 'EST.']
    return options
      .filter((label) => {
        const q = upper.trim().replace(/\.$/, '')
        if (!q) return true
        return label.replace(/\.$/, '').startsWith(q) || label.startsWith(q)
      })
      .map((label) => ({
        id: `intExt:${label}`,
        label,
        insertText: `${label} `,
        group: 'intExt' as const,
      }))
  }

  // After INT./EXT. suggest locations
  const intExtMatch = upper.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s*(.*)$/)
  if (intExtMatch) {
    const intExt = intExtMatch[1]!
    const locationQuery = intExtMatch[2] ?? ''
    const originalIntExt = text.slice(0, intExt.length)
    return filterByQuery(locations, locationQuery).map((label) => ({
      id: `location:${label}`,
      label,
      insertText: `${originalIntExt} ${label} - `,
      group: 'location' as const,
    }))
  }

  // Free text — still offer matching locations as full replacements with INT.
  return filterByQuery(locations, upper).map((label) => ({
    id: `location:${label}`,
    label,
    insertText: `INT. ${label} - `,
    group: 'location' as const,
  }))
}
