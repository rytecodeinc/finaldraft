import { useEffect, useMemo } from 'react'
import { ElementTypeQuickBar } from '@/components/editor/ElementTypeQuickBar'
import { FindBar } from '@/components/editor/FindBar'
import { SceneNavigator } from '@/components/editor/SceneNavigator'
import { ScriptElementLine } from '@/components/editor/ScriptElementLine'
import { TitlePage } from '@/components/editor/TitlePage'
import { findInScript } from '@/screenplay/findScript'
import { useScriptPagination } from '@/hooks/useScriptPagination'
import { useScriptStore } from '@/stores/scriptStore'

export function ScriptEditor() {
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const elements = useScriptStore((s) => s.doc.elements)
  const selectedId = useScriptStore((s) => s.selectedId)
  const focusRequestId = useScriptStore((s) => s.focusRequestId)
  const undo = useScriptStore((s) => s.undo)
  const redo = useScriptStore((s) => s.redo)
  const saveNow = useScriptStore((s) => s.saveNow)
  const setPageCount = useScriptStore((s) => s.setPageCount)
  const openFind = useScriptStore((s) => s.openFind)
  const findQuery = useScriptStore((s) => s.findQuery)
  const findTypeFilter = useScriptStore((s) => s.findTypeFilter)
  const findMatchIndex = useScriptStore((s) => s.findMatchIndex)

  const { pages, pageCount } = useScriptPagination(elements)

  const findMatches = useMemo(
    () => findInScript(elements, findQuery, findTypeFilter),
    [elements, findQuery, findTypeFilter],
  )
  const activeMatchId = findMatches[findMatchIndex]?.elementId ?? null

  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    // Body pages + title page
    setPageCount(pageCount + 1)
  }, [pageCount, setPageCount])

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
        <ElementTypeQuickBar />
        <div className="script-canvas">
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
      </div>
    </div>
  )
}
