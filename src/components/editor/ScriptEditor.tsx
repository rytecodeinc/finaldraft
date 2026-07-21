import { useEffect } from 'react'
import { ElementTypeQuickBar } from '@/components/editor/ElementTypeQuickBar'
import { SceneNavigator } from '@/components/editor/SceneNavigator'
import { ScriptElementLine } from '@/components/editor/ScriptElementLine'
import { collectCharacterNames } from '@/screenplay/elementRules'
import { useScriptPagination } from '@/hooks/useScriptPagination'
import { useScriptStore } from '@/stores/scriptStore'

export function ScriptEditor() {
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const elements = useScriptStore((s) => s.doc.elements)
  const title = useScriptStore((s) => s.doc.title)
  const selectedId = useScriptStore((s) => s.selectedId)
  const focusRequestId = useScriptStore((s) => s.focusRequestId)
  const setTitle = useScriptStore((s) => s.setTitle)
  const undo = useScriptStore((s) => s.undo)
  const redo = useScriptStore((s) => s.redo)
  const saveNow = useScriptStore((s) => s.saveNow)
  const setPageCount = useScriptStore((s) => s.setPageCount)

  const { pages, pageCount } = useScriptPagination(elements, title)
  const characters = collectCharacterNames(elements)

  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    setPageCount(pageCount)
  }, [pageCount, setPageCount])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()

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
  }, [redo, saveNow, undo])

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
        <ElementTypeQuickBar />
        <div className="script-canvas">
          {pages.map((page, pageIndex) => (
            <section
              key={`page-${page.pageNumber}`}
              className="script-page script-page--live"
              aria-label={`Page ${page.pageNumber}`}
            >
              <div className="script-page-body">
                {pageIndex === 0 ? (
                  <input
                    className="script-title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-label="Screenplay title"
                    placeholder="Untitled Screenplay"
                  />
                ) : (
                  <div className="script-page-continued" aria-hidden>
                    {title || 'Untitled Screenplay'} — continued
                  </div>
                )}

                <div className="script-elements">
                  {page.elements.map((element) => (
                    <ScriptElementLine
                      key={element.id}
                      element={element}
                      isSelected={selectedId === element.id}
                      shouldFocus={focusRequestId === element.id}
                      characterNames={characters}
                    />
                  ))}
                </div>
              </div>

              <footer className="script-page-number">{page.pageNumber}.</footer>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
