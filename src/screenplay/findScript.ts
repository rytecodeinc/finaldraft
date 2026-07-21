import type { ElementType, ScreenplayElement } from './types'
import { ELEMENT_LABELS } from './types'

export interface FindMatch {
  elementId: string
  elementType: ElementType
  index: number
  preview: string
  start: number
  end: number
}

export type FindTypeFilter = ElementType | 'all'

export function findInScript(
  elements: ScreenplayElement[],
  query: string,
  typeFilter: FindTypeFilter = 'all',
): FindMatch[] {
  const q = query.trim()
  if (!q) return []

  const needle = q.toLowerCase()
  const matches: FindMatch[] = []

  elements.forEach((element) => {
    if (typeFilter !== 'all' && element.type !== typeFilter) return
    const haystack = element.text
    const lower = haystack.toLowerCase()
    let from = 0
    while (from < lower.length) {
      const start = lower.indexOf(needle, from)
      if (start < 0) break
      const end = start + needle.length
      matches.push({
        elementId: element.id,
        elementType: element.type,
        index: matches.length,
        preview: buildPreview(haystack, start, end, ELEMENT_LABELS[element.type]),
        start,
        end,
      })
      from = start + Math.max(needle.length, 1)
    }
  })

  return matches
}

function buildPreview(
  text: string,
  start: number,
  end: number,
  typeLabel: string,
): string {
  const radius = 28
  const from = Math.max(0, start - radius)
  const to = Math.min(text.length, end + radius)
  const slice = `${from > 0 ? '…' : ''}${text.slice(from, to)}${to < text.length ? '…' : ''}`
  return `${typeLabel}: ${slice}`
}
