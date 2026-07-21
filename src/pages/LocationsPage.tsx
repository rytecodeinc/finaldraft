import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectPath } from '@/navigation/navItems'
import { useScriptStore } from '@/stores/scriptStore'

export function LocationsPage() {
  const navigate = useNavigate()
  const projectId = useScriptStore((s) => s.project.id)
  const projectName = useScriptStore((s) => s.project.name)
  const elements = useScriptStore((s) => s.doc.elements)
  const getLocations = useScriptStore((s) => s.getLocations)
  const getScenes = useScriptStore((s) => s.getScenes)
  const selectElement = useScriptStore((s) => s.selectElement)
  const requestFocus = useScriptStore((s) => s.requestFocus)

  const locations = useMemo(() => getLocations(), [getLocations, elements])
  const scenes = useMemo(() => getScenes(), [getScenes, elements])

  const firstSceneId = (location: string) => {
    const upper = location.toUpperCase()
    return (
      scenes.find((s) => s.location?.toUpperCase() === upper)?.id ?? null
    )
  }

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero">
          <p className="page-kicker">{projectName}</p>
          <h1 className="page-title">Locations</h1>
          <p className="page-desc">
            Derived from scene headings in the screenplay. Change a heading in
            the script to update this list.
          </p>
        </header>

        {locations.length === 0 ? (
          <p className="derived-empty">No locations parsed from scene headings yet.</p>
        ) : (
          <ul className="derived-list">
            {locations.map((name) => (
              <li key={name} className="derived-row">
                <span className="derived-index" aria-hidden>
                  ·
                </span>
                <div className="derived-main">
                  <button
                    type="button"
                    className="derived-title-btn"
                    onClick={() => {
                      const id = firstSceneId(name)
                      if (!id) return
                      selectElement(id)
                      requestFocus(id)
                      navigate(projectPath(projectId, 'script'))
                    }}
                  >
                    {name}
                  </button>
                  <div className="derived-meta">From scene headings</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
