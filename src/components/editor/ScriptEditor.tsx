import { useEffect } from 'react'
import { SceneNavigator } from '@/components/editor/SceneNavigator'
import { ScriptElementLine } from '@/components/editor/ScriptElementLine'
import { collectCharacterNames } from '@/screenplay/elementRules'
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

  useEffect(() => {
    // Hydration is owned by AppShell; this is a safety net if mounted alone.
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()
      const target = event.target as HTMLElement | null
      const inField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (key === 's') {
        event.preventDefault()
        void saveNow()
        return
      }

      if (key === 'z' && !event.shiftKey) {
        if (inField && document.activeElement === target) {
          // Allow native text undo inside textarea for current field;
          // still support structural undo when not composing selection quirks.
        }
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

  const characters = collectCharacterNames(elements)

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
      <div className="script-canvas">
        <div className="script-page script-page--live" aria-label="Screenplay editor">
          <input
            className="script-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Screenplay title"
            placeholder="Untitled Screenplay"
          />
          <div className="script-elements">
            {elements.map((element) => (
              <ScriptElementLine
                key={element.id}
                element={element}
                isSelected={selectedId === element.id}
                shouldFocus={focusRequestId === element.id}
                characterNames={characters}
              />
            ))}
          </div>
          <p className="script-hint">
            Enter continues · Tab cycles type · ⌘/Ctrl+S saves · Autosaves to IndexedDB
          </p>
        </div>
      </div>
    </div>
  )
}
