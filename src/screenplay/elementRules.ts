import type { ElementType, ParsedSceneHeading, SceneInfo, ScreenplayElement } from './types'
import { ELEMENT_TYPES } from './types'

export { ENTER_NEXT_TYPE, cycleTabElementType, TAB_TYPE_ORDER } from './keyboardFlow'

export function cycleElementType(type: ElementType, direction: 1 | -1 = 1): ElementType {
  const index = ELEMENT_TYPES.indexOf(type)
  const next = (index + direction + ELEMENT_TYPES.length) % ELEMENT_TYPES.length
  return ELEMENT_TYPES[next]!
}

export function createElementId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function createElement(
  type: ElementType,
  text = '',
): ScreenplayElement {
  return { id: createElementId(), type, text }
}

export function formatElementText(type: ElementType, text: string): string {
  const trimmed = text.replace(/\r\n/g, '\n')

  switch (type) {
    case 'sceneHeading':
      return normalizeSceneHeading(trimmed)
    case 'character':
      return trimmed.trim().toUpperCase()
    case 'transition':
      return trimmed.trim().toUpperCase()
    case 'parenthetical':
      return normalizeParenthetical(trimmed)
    case 'action':
    case 'dialogue':
    default:
      return trimmed
  }
}

function normalizeSceneHeading(text: string): string {
  const upper = text.toUpperCase().replace(/\s+/g, ' ').trim()
  if (!upper) return ''

  // Light auto-prefix when writer starts with a bare location
  if (
    !/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)/.test(upper) &&
    upper.length > 0 &&
    !upper.includes('.')
  ) {
    return `INT. ${upper}`
  }
  return upper
}

function normalizeParenthetical(text: string): string {
  let value = text.trim()
  if (!value) return '()'
  if (!value.startsWith('(')) value = `(${value}`
  if (!value.endsWith(')')) value = `${value})`
  return value
}

export function parseSceneHeading(text: string): ParsedSceneHeading {
  const upper = text.toUpperCase().trimEnd()
  if (!upper.trim()) {
    return { intExt: null, location: null, timeOfDay: null }
  }

  const match = upper.match(
    /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)?\s*(.*?)(?:\s*[-–—]\s*(.+))?$/,
  )

  if (!match) {
    return { intExt: null, location: upper || null, timeOfDay: null }
  }

  return {
    intExt: match[1] ?? null,
    // Keep interior spaces; only trim the overall sides for stable parsing
    location: match[2]?.replace(/^\s+/, '').replace(/\s+$/, '') || null,
    timeOfDay: match[3]?.trim() || null,
  }
}

export const INT_EXT_OPTIONS = ['INT.', 'EXT.', 'INT/EXT.', 'I/E.', 'EST.'] as const

export const TIME_OF_DAY_OPTIONS = [
  'DAY',
  'NIGHT',
  'DAWN',
  'DUSK',
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'CONTINUOUS',
  'LATER',
  'MOMENTS LATER',
] as const

export function composeSceneHeading(meta: {
  intExt?: string | null
  location?: string | null
  timeOfDay?: string | null
}): string {
  const intExt = (meta.intExt ?? 'INT.').trim().toUpperCase() || 'INT.'
  // Do not trim location — trailing spaces must survive while typing.
  const location = (meta.location ?? '').toUpperCase()
  const timeOfDay = (meta.timeOfDay ?? '').toUpperCase()

  let heading = intExt
  if (location.length > 0) heading += ` ${location}`
  if (timeOfDay.trim().length > 0) heading += ` - ${timeOfDay.trim()}`
  return heading
}


export function extractScenes(elements: ScreenplayElement[]): SceneInfo[] {
  const scenes: SceneInfo[] = []
  let number = 0

  elements.forEach((element, elementIndex) => {
    if (element.type !== 'sceneHeading') return
    number += 1
    const parsed = parseSceneHeading(element.text)
    scenes.push({
      id: element.id,
      number,
      heading: element.text.trim() || `SCENE ${number}`,
      intExt: parsed.intExt,
      location: parsed.location,
      timeOfDay: parsed.timeOfDay,
      elementIndex,
    })
  })

  return scenes
}

export function findSceneForElement(
  elements: ScreenplayElement[],
  elementId: string | null,
): SceneInfo | null {
  if (!elementId) return null
  const scenes = extractScenes(elements)
  const index = elements.findIndex((el) => el.id === elementId)
  if (index < 0) return null

  let current: SceneInfo | null = null
  for (const scene of scenes) {
    if (scene.elementIndex <= index) current = scene
    else break
  }
  return current
}

export function collectCharacterNames(elements: ScreenplayElement[]): string[] {
  const names = new Set<string>()
  for (const element of elements) {
    if (element.type !== 'character') continue
    const name = element.text.replace(/\(.*?\)/g, '').trim().toUpperCase()
    if (name) names.add(name)
  }
  return [...names].sort()
}

export function estimatePageCount(elements: ScreenplayElement[]): number {
  // Rough feature-film estimate: ~55 lines per page
  const lines = elements.reduce((sum, el) => {
    const len = Math.max(el.text.length, 1)
    const charsPerLine =
      el.type === 'dialogue' || el.type === 'parenthetical'
        ? 35
        : el.type === 'character'
          ? 20
          : 60
    return sum + Math.max(1, Math.ceil(len / charsPerLine))
  }, 0)
  return Math.max(1, Math.ceil(lines / 55))
}
