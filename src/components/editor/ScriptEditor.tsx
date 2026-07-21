import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { ElementTypeQuickBar } from '@/components/editor/ElementTypeQuickBar'
import { FindBar } from '@/components/editor/FindBar'
import { SceneNavigator } from '@/components/editor/SceneNavigator'
import { ScriptCommentsRail } from '@/components/editor/ScriptCommentsRail'
import { ScriptElementLine } from '@/components/editor/ScriptElementLine'
import { TitlePage } from '@/components/editor/TitlePage'
import { findInScript } from '@/screenplay/findScript'
import { useScriptPagination } from '@/hooks/useScriptPagination'
import { useScriptStore } from '@/stores/scriptStore'
import { commentHighlightRange } from '@/screenplay/commentRange'

export function ScriptEditor() {
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const elements = useScriptStore((s) => s.doc.elements)
  const comments = useScriptStore((s) => s.doc.comments)
  const commentDraft = useScriptStore((s) => s.commentDraft)
  const selectedId = useScriptStore((s) => s.selectedId)
  const focusRequestId = useScriptStore((s) => s.focusRequestId)
  const focusCaret = useScriptStore((s) => s.focusCaret)
  const selectElement = useScriptStore((s) => s.selectElement)
  const requestFocus = useScriptStore((s) => s.requestFocus)
  const undo = useScriptStore((s) => s.undo)
  const redo = useScriptStore((s) => s.redo)
  const saveNow = useScriptStore((s) => s.saveNow)
  const setPageCount = useScriptStore((s) => s.setPageCount)
  const setViewPage = useScriptStore((s) => s.setViewPage)
  const openFind = useScriptStore((s) => s.openFind)
  const findQuery = useScriptStore((s) => s.findQuery)
  const findTypeFilter = useScriptStore((s) => s.findTypeFilter)
  const findMatchIndex = useScriptStore((s) => s.findMatchIndex)

  const { pages, pageCount } = useScriptPagination(elements)
  const pageSig = useMemo(
    () => pages.map((page) => page.elements.map((el) => el.id).join(',')).join('|'),
    [pages],
  )
  const prevPageSigRef = useRef(pageSig)

  const findMatches = useMemo(
    () => findInScript(elements, findQuery, findTypeFilter),
    [elements, findQuery, findTypeFilter],
  )
  const activeMatchId = findMatches[findMatchIndex]?.elementId ?? null

  const commentedElementIds = useMemo(() => {
    const ids = new Set<string>()
    for (const comment of comments) {
      if (comment.resolved) continue
      const el = elements.find((e) => e.id === comment.elementId)
      const range = el
        ? commentHighlightRange(comment, el.text.length)
        : null
      // Whole-element wash only when the comment has no partial range.
      if (!range) ids.add(comment.elementId)
    }
    if (commentDraft) {
      const el = elements.find((e) => e.id === commentDraft.elementId)
      const range = el
        ? commentHighlightRange(commentDraft, el.text.length)
        : null
      if (!range) ids.add(commentDraft.elementId)
    }
    return ids
  }, [comments, commentDraft, elements])

  const commentRangesByElement = useMemo(() => {
    const map = new Map<string, { start: number; end: number }[]>()
    const add = (
      elementId: string,
      range: { start: number; end: number } | null,
    ) => {
      if (!range) return
      const list = map.get(elementId) ?? []
      list.push(range)
      map.set(elementId, list)
    }

    for (const comment of comments) {
      if (comment.resolved) continue
      const el = elements.find((e) => e.id === comment.elementId)
      if (!el) continue
      add(comment.elementId, commentHighlightRange(comment, el.text.length))
    }
    if (commentDraft) {
      const el = elements.find((e) => e.id === commentDraft.elementId)
      if (el) {
        add(
          commentDraft.elementId,
          commentHighlightRange(commentDraft, el.text.length),
        )
      }
    }
    return map
  }, [comments, commentDraft, elements])

  const rangedCommentElementIds = useMemo(
    () => new Set(commentRangesByElement.keys()),
    [commentRangesByElement],
  )

  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    // Body pages + title page
    setPageCount(pageCount + 1)
  }, [pageCount, setPageCount])

  // Track whether the title page or a script body page is in view.
  useEffect(() => {
    const canvas = document.querySelector('.script-canvas')
    if (!(canvas instanceof HTMLElement)) return

    const updateViewPage = () => {
      const pageNodes = canvas.querySelectorAll('.script-page')
      if (pageNodes.length === 0) return

      const rootRect = canvas.getBoundingClientRect()
      const midpoint = rootRect.top + rootRect.height * 0.35
      let bestNode: Element | null = null
      let bestDist = Number.POSITIVE_INFINITY

      for (const node of pageNodes) {
        const rect = node.getBoundingClientRect()
        if (rect.bottom < rootRect.top || rect.top > rootRect.bottom) continue
        const center = rect.top + rect.height / 2
        const dist = Math.abs(center - midpoint)
        if (dist < bestDist) {
          bestDist = dist
          bestNode = node
        }
      }

      if (!bestNode) return
      if (bestNode.classList.contains('script-page--title')) {
        setViewPage('title')
        return
      }
      const label = bestNode.getAttribute('aria-label') ?? ''
      const match = label.match(/Page\s+(\d+)/i)
      setViewPage(match ? Number(match[1]) : 1)
    }

    updateViewPage()
    canvas.addEventListener('scroll', updateViewPage, { passive: true })
    window.addEventListener('resize', updateViewPage)
    return () => {
      canvas.removeEventListener('scroll', updateViewPage)
      window.removeEventListener('resize', updateViewPage)
    }
  }, [hydrated, pages.length, setViewPage])

  // When pagination remounts the active element onto another page, restore focus.
  useLayoutEffect(() => {
    const prev = prevPageSigRef.current
    prevPageSigRef.current = pageSig
    if (prev === pageSig || !selectedId) return

    const pageIndexFor = (sig: string, id: string) =>
      sig.split('|').findIndex((page) => page.split(',').includes(id))

    const prevPage = pageIndexFor(prev, selectedId)
    const nextPage = pageIndexFor(pageSig, selectedId)
    // New element (Enter) already gets focus from insertAfter — don't refocus.
    if (prevPage < 0) return
    // Still on the same page — no remount restore needed.
    if (prevPage === nextPage) return

    const active = document.activeElement
    const stillFocused =
      active instanceof HTMLElement &&
      active.closest(`[data-element-id="${selectedId}"]`)
    if (stillFocused) return

    requestFocus(selectedId, focusCaret)
  }, [pageSig, selectedId, requestFocus, focusCaret])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()

      if (key === 'f') {
        event.preventDefault()
        openFind()
        return
      }

      if (key === 's') {
        event.preventDefault()
        void saveNow()
        return
      }

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }

      if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        redo()
        return
      }

      if (key === 'y') {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openFind, redo, saveNow, undo])

  const clearSelectionIfBackground = (
    event: { target: EventTarget | null },
  ) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('[data-element-id]')) return
    if (target.closest('.quick-actions')) return
    if (target.closest('.script-comment-card')) return
    if (target.closest('.script-comment-anchor')) return
    if (target.closest('.find-bar')) return
    if (target.closest('.title-page-field')) return
    selectElement(null)
  }

  if (!hydrated) {
    return (
      <div className="script-workspace">
        <div className="script-loading">Loading screenplay…</div>
      </div>
    )
  }

  return (
    <div className="script-workspace">
      <SceneNavigator />
      <div className="script-canvas-shell">
        <FindBar />
        <div className="script-canvas" onMouseDown={clearSelectionIfBackground}>
          <div className="script-stage">
            <div className="script-stage-pages">
              <TitlePage />

              {pages.map((page) => {
                const first = page.elements[0]
                const showContinuedOnCharacter =
                  Boolean(page.continuedCharacter) &&
                  first?.type === 'character' &&
                  first.text.replace(/\(.*?\)/g, '').trim().toUpperCase() ===
                    page.continuedCharacter

                return (
                  <section
                    key={`page-${page.pageNumber}`}
                    className="script-page script-page--live"
                    aria-label={`Page ${page.pageNumber}`}
                    onMouseDown={clearSelectionIfBackground}
                  >
                    <div className="script-page-body">
                      {page.continuedCharacter && !showContinuedOnCharacter ? (
                        <div className="sp-continued-cue">
                          {page.continuedCharacter} (CONT&apos;D)
                        </div>
                      ) : null}

                      <div className="script-elements">
                        {page.elements.map((element, index) => (
                          <ScriptElementLine
                            key={element.id}
                            element={element}
                            isSelected={selectedId === element.id}
                            shouldFocus={focusRequestId === element.id}
                            isFindMatch={activeMatchId === element.id}
                            hasComment={commentedElementIds.has(element.id)}
                            hasCommentRange={rangedCommentElementIds.has(element.id)}
                            commentRanges={commentRangesByElement.get(element.id) ?? []}
                            showContinued={index === 0 && showContinuedOnCharacter}
                          />
                        ))}
                      </div>

                      {page.showMore ? <div className="sp-more-cue">(MORE)</div> : null}
                    </div>

                    <footer className="script-page-number">{page.pageNumber}.</footer>
                  </section>
                )
              })}
            </div>

            <ElementTypeQuickBar />
            <ScriptCommentsRail />
          </div>
        </div>
      </div>
    </div>
  )
}
