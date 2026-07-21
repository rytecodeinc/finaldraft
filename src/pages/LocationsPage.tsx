import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { projectPath } from '@/navigation/navItems'
import { useScriptStore } from '@/stores/scriptStore'

export function LocationsPage() {
  const navigate = useNavigate()
  const projectId = useScriptStore((s) => s.project.id)
  const projectName = useScriptStore((s) => s.project.name)
  const elements = useScriptStore((s) => s.doc.elements)
  const getLocations = useScriptStore((s) => s.getLocations)
  const getScenes = useScriptStore((s) => s.getScenes)
  const renameLocation = useScriptStore((s) => s.renameLocation)
  const selectDirectory = useScriptStore((s) => s.selectDirectory)
  const directorySelection = useScriptStore((s) => s.directorySelection)
  const revealElement = useScriptStore((s) => s.revealElement)

  const locations = useMemo(() => getLocations(), [getLocations, elements])
  const scenes = useMemo(() => getScenes(), [getScenes, elements])
  const [editingName, setEditingName] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const sceneCount = (location: string) => {
    const upper = location.toUpperCase()
    return scenes.filter((s) => s.location?.toUpperCase() === upper).length
  }

  const firstSceneId = (location: string) => {
    const upper = location.toUpperCase()
    return scenes.find((s) => s.location?.toUpperCase() === upper)?.id ?? null
  }

  const commitRename = (from: string) => {
    const next = draft.trim().toUpperCase()
    setEditingName(null)
    if (!next || next === from) return
    renameLocation(from, next)
  }

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero">
          <p className="page-kicker">{projectName}</p>
          <h1 className="page-title">Locations</h1>
          <p className="page-desc">
            Derived from scene headings. Select a location to inspect; rename
            here or in the inspector to update the script.
          </p>
        </header>

        {locations.length === 0 ? (
          <p className="derived-empty">No locations parsed from scene headings yet.</p>
        ) : (
          <ul className="derived-list">
            {locations.map((name) => {
              const editing = editingName === name
              const selected =
                directorySelection?.kind === 'location' &&
                directorySelection.name === name
              const count = sceneCount(name)
              return (
                <li
                  key={name}
                  className={`derived-row ${selected ? 'is-selected' : ''}`.trim()}
                >
                  <span className="derived-index" aria-hidden>
                    ·
                  </span>
                  <div className="derived-main">
                    {editing ? (
                      <input
                        className="derived-input"
                        value={draft}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value.toUpperCase())}
                        onBlur={() => commitRename(name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            ;(e.target as HTMLInputElement).blur()
                          }
                          if (e.key === 'Escape') {
                            setEditingName(null)
                          }
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="derived-title-btn"
                        onClick={() =>
                          selectDirectory({ kind: 'location', name })
                        }
                        onDoubleClick={() => {
                          const id = firstSceneId(name)
                          if (!id) return
                          revealElement(id)
                          navigate(projectPath(projectId, 'script'))
                        }}
                        title="Select to inspect · double-click to open in script"
                      >
                        {name}
                      </button>
                    )}
                    <div className="derived-meta">
                      {count} scene{count === 1 ? '' : 's'} in script
                    </div>
                  </div>
                  {!editing ? (
                    <div className="derived-actions">
                      <button
                        type="button"
                        className="derived-icon-btn"
                        aria-label={`Rename ${name}`}
                        title="Rename location"
                        onClick={() => {
                          selectDirectory({ kind: 'location', name })
                          setEditingName(name)
                          setDraft(name)
                        }}
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
