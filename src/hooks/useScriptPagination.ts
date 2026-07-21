import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getPageBreakChrome } from '@/screenplay/pageChrome'
import type { ScreenplayElement } from '@/screenplay/types'

/**
 * Fallback usable body height for a US Letter page at 96dpi:
 * 11in − 1in top − 1in bottom − reserve for (MORE)/(CONT'D) and subpixel rounding.
 */
export const PAGE_CONTENT_HEIGHT_PX = 11 * 96 - 2 * 96 - 48 // 816

/** Extra headroom so the last line is never half-clipped by overflow:hidden. */
const PACK_SAFETY_PX = 8

function resolveContentBudget(): number {
  const body = document.querySelector('.script-page--live .script-page-body')
  if (body instanceof HTMLElement && body.clientHeight > 200) {
    // Body already excludes page padding. Reserve room for page chrome + rounding.
    return Math.max(body.clientHeight - 48, 400)
  }
  return PAGE_CONTENT_HEIGHT_PX
}

function packElementIds(
  elementIds: string[],
  heights: number[],
  maxHeight: number,
): string[][] {
  if (elementIds.length === 0) return [[]]

  const limit = Math.max(maxHeight - PACK_SAFETY_PX, 200)
  const pages: string[][] = []
  let current: string[] = []
  let used = 0

  elementIds.forEach((id, index) => {
    const height = Math.max(heights[index] ?? 28, 24)

    if (current.length > 0 && used + height > limit) {
      pages.push(current)
      current = []
      used = 0
    }

    current.push(id)
    used += height
  })

  if (current.length > 0 || pages.length === 0) {
    pages.push(current)
  }

  return pages
}

export type PageSlice = {
  pageNumber: number
  elements: ScreenplayElement[]
  showMore: boolean
  continuedCharacter: string | null
}

function samePages(a: string[][], b: string[][]): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (page, i) =>
      page.length === b[i]!.length && page.every((id, j) => id === b[i]![j]),
  )
}

/**
 * Keep existing page breaks when elements are inserted/removed so the script
 * does not collapse to a single page and flash a full re-layout on every Enter.
 */
function reconcilePageGroups(prev: string[][], elementIds: string[]): string[][] {
  if (elementIds.length === 0) return [[]]
  if (prev.length === 0) return [elementIds]

  const prevFlat = prev.flat()
  const prevSet = new Set(prevFlat)
  const nextSet = new Set(elementIds)

  // Drop removed ids, keep page structure.
  const groups = prev
    .map((page) => page.filter((id) => nextSet.has(id)))
    .filter((page) => page.length > 0)

  if (groups.length === 0) return [elementIds]

  // Insert brand-new ids after their predecessor on that predecessor's page.
  for (const id of elementIds) {
    if (prevSet.has(id)) continue
    const index = elementIds.indexOf(id)
    const predecessor = index > 0 ? elementIds[index - 1]! : null

    if (predecessor) {
      let placed = false
      for (const page of groups) {
        const at = page.indexOf(predecessor)
        if (at >= 0) {
          page.splice(at + 1, 0, id)
          placed = true
          break
        }
      }
      if (!placed) groups[groups.length - 1]!.push(id)
    } else {
      groups[0]!.unshift(id)
    }
  }

  // Ensure flat order matches elementIds (handles rare reorders).
  const flat = groups.flat()
  if (flat.length === elementIds.length && flat.every((id, i) => id === elementIds[i])) {
    return groups
  }

  // Rebuild pages by walking elementIds and cutting where previous page breaks were.
  const pageBreakAfter = new Set<string>()
  for (let p = 0; p < groups.length - 1; p++) {
    const last = groups[p]![groups[p]!.length - 1]
    if (last) pageBreakAfter.add(last)
  }

  const rebuilt: string[][] = [[]]
  for (const id of elementIds) {
    rebuilt[rebuilt.length - 1]!.push(id)
    if (pageBreakAfter.has(id) && rebuilt[rebuilt.length - 1]!.length > 0) {
      rebuilt.push([])
    }
  }
  if (rebuilt[rebuilt.length - 1]!.length === 0 && rebuilt.length > 1) {
    rebuilt.pop()
  }
  return rebuilt.length > 0 ? rebuilt : [elementIds]
}

/**
 * Measures live element nodes and packs them into US Letter body pages.
 * Title page is rendered separately and is not included here.
 */
export function useScriptPagination(elements: ScreenplayElement[]) {
  const [pageIdGroups, setPageIdGroups] = useState<string[][]>(() => [
    elements.map((el) => el.id),
  ])
  const rafRef = useRef(0)
  const lastSigRef = useRef('')

  const elementIds = useMemo(() => elements.map((el) => el.id), [elements])
  const measureKey = useMemo(
    () => elements.map((el) => `${el.id}:${el.type}:${el.text}`).join('|'),
    [elements],
  )

  useLayoutEffect(() => {
    setPageIdGroups((prev) => {
      const flat = prev.flat()
      if (
        flat.length === elementIds.length &&
        flat.every((id, i) => id === elementIds[i])
      ) {
        return prev
      }
      return reconcilePageGroups(prev, elementIds)
    })
  }, [elementIds])

  useLayoutEffect(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const heights = elementIds.map((id) => {
        const node = document.querySelector(`[data-element-id="${id}"]`)
        return node instanceof HTMLElement ? node.offsetHeight : 28
      })

      const sig = `${measureKey}::${heights.join(',')}`
      if (sig === lastSigRef.current) return

      const next = packElementIds(elementIds, heights, resolveContentBudget())

      setPageIdGroups((prev) => {
        if (samePages(prev, next)) {
          lastSigRef.current = sig
          return prev
        }
        lastSigRef.current = sig
        return next
      })
    })

    return () => cancelAnimationFrame(rafRef.current)
  }, [elementIds, measureKey])

  const pages: PageSlice[] = useMemo(() => {
    const byId = new Map(elements.map((el) => [el.id, el]))
    const groups =
      pageIdGroups.length > 0 ? pageIdGroups : [elements.map((el) => el.id)]

    return groups.map((ids, index) => {
      const nextIds = groups[index + 1] ?? []
      const chrome = getPageBreakChrome(elements, ids, nextIds)
      const prevChrome =
        index > 0
          ? getPageBreakChrome(elements, groups[index - 1] ?? [], ids)
          : { showMore: false, continuedCharacter: null }

      return {
        pageNumber: index + 1,
        elements: ids
          .map((id) => byId.get(id))
          .filter((el): el is ScreenplayElement => Boolean(el)),
        showMore: chrome.showMore,
        continuedCharacter: prevChrome.continuedCharacter,
      }
    })
  }, [elements, pageIdGroups])

  return {
    pages,
    pageCount: Math.max(pages.length, 1),
  }
}
