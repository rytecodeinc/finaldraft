import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { projectPath } from '@/navigation/navItems'
import { useScriptStore } from '@/stores/scriptStore'

export function OutlinePage() {
  const navigate = useNavigate()
  const projectId = useScriptStore((s) => s.project.id)
  const projectName = useScriptStore((s) => s.project.name)
  const getScenes = useScriptStore((s) => s.getScenes)
  const elements = useScriptStore((s) => s.doc.elements)
  const reorderScene = useScriptStore((s) => s.reorderScene)
  const renameScene = useScriptStore((s) => s.renameScene)
  const selectElement = useScriptStore((s) => s.selectElement)
  const requestFocus = useScriptStore((s) => s.requestFocus)

  const scenes = useMemo(() => getScenes(), [getScenes, elements])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero">
          <p className="page-kicker">{projectName}</p>
          <h1 className="page-title">Outline</h1>
          <p className="page-desc">
            Scenes from the screenplay. Reorder or rename here — the script stays
            the source of truth.
          </p>
        </header>

        {scenes.length === 0 ? (
          <p className="derived-empty">No scene headings in this script yet.</p>
        ) : (
          <ul className="derived-list">
            {scenes.map((scene, index) => {
              const editing = editingId === scene.id
              return (
                <li key={scene.id} className="derived-row">
                  <span className="derived-index">{scene.number}</span>
                  <div className="derived-main">
                    {editing ? (
                      <input
                        className="derived-input"
                        value={draft}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value.toUpperCase())}
                        onBlur={() => {
                          const next = draft.trim()
                          if (next && next !== scene.heading) {
                            renameScene(scene.id, next)
                          }
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            ;(e.target as HTMLInputElement).blur()
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="derived-title-btn"
                        onClick={() => {
                          selectElement(scene.id)
                          requestFocus(scene.id)
                          navigate(projectPath(projectId, 'script'))
                        }}
                        onDoubleClick={() => {
                          setEditingId(scene.id)
                          setDraft(scene.heading)
                        }}
                        title="Open in script (double-click to rename)"
                      >
                        {scene.heading}
                      </button>
                    )}
                    <div className="derived-meta">
                      {[scene.intExt, scene.location, scene.timeOfDay]
                        .filter(Boolean)
                        .join(' · ') || 'Scene heading'}
                    </div>
                  </div>
                  <div className="derived-actions">
                    <button
                      type="button"
                      className="derived-icon-btn"
                      disabled={index === 0}
                      aria-label="Move scene up"
                      onClick={() => {
                        const beforeId = scenes[index - 1]?.id ?? null
                        if (beforeId) reorderScene(scene.id, beforeId)
                      }}
                    >
                      <ArrowUp size={16} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className="derived-icon-btn"
                      disabled={index >= scenes.length - 1}
                      aria-label="Move scene down"
                      onClick={() => {
                        const after = scenes[index + 1]
                        if (!after) return
                        const beforeNext = scenes[index + 2]?.id ?? null
                        reorderScene(scene.id, beforeNext)
                      }}
                    >
                      <ArrowDown size={16} strokeWidth={1.75} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
