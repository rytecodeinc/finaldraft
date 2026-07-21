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

export function ScriptEditor() {
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const elements = useScriptStore((s) => s.doc.elements)
  const comments = useScriptStore((s) => s.doc.comments)
  const commentDraft = useScriptStore((s) => s.commentDraft)
  const activeCommentId = useScriptStore((s) => s.activeCommentId)
  const selectedId = useScriptStore((s) => s.selectedId)
  const focusRequestId = useScriptStore((s) => s.focusRequestId)
  const focusCaret = useScriptStore((s) => s.focusCaret)
  const selectElement = useScriptStore((s) => s.selectElement)
  const requestFocus = useScriptStore((s) => s.requestFocus)
  const undo = useScriptStore((s) => s.undo)
  const redo = useScriptStore((s) => s.redo)
  const saveNow = useScriptStore((s) => s.saveNow)
  const setPageCount = useScriptStore((s) => s.setPageCount)
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
    const ids = new Set(
      comments.filter((comment) => !comment.resolved).map((comment) => comment.elementId),
    )
    if (commentDraft) ids.add(commentDraft.elementId)
    if (activeCommentId) {
      const active = comments.find((comment) => comment.id === activeCommentId)
      if (active && !active.resolved) ids.add(active.elementId)
    }
    return ids
  }, [comments, commentDraft, activeCommentId])

  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    // Body pages + title page
    setPageCount(pageCount + 1)
  }, [pageCount, setPageCount])

  // When pagination moves the active element onto another page, restore focus.
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
