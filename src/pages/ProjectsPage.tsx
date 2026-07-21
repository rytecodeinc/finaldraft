import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectPath } from '@/navigation/navItems'
import { useScriptStore } from '@/stores/scriptStore'

export function ProjectsPage() {
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const projects = useScriptStore((s) => s.projects)
  const activeId = useScriptStore((s) => s.project.id)
  const openProject = useScriptStore((s) => s.openProject)
  const renameProject = useScriptStore((s) => s.renameProject)
  const docTitle = useScriptStore((s) => s.doc.title)

  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero">
          <p className="page-kicker">Workspace</p>
          <h1 className="page-title">Projects</h1>
          <p className="page-desc">
            Each project contains one screenplay. Outline, characters, and
            locations are generated from that script.
          </p>
        </header>

        {!hydrated ? (
          <p className="derived-empty">Loading projects…</p>
        ) : (
          <ul className="derived-list">
            {projects.map((project) => {
              const active = project.id === activeId
              return (
                <li key={project.id} className="derived-row">
                  <div className="derived-main">
                    <Link
                      className="derived-title-btn"
                      to={projectPath(project.id, 'script')}
                      onClick={() => {
                        if (!active) void openProject(project.id)
                      }}
                    >
                      {project.name}
                    </Link>
                    <div className="derived-meta">
                      {active
                        ? `Active · ${docTitle.trim() || 'Untitled Screenplay'}`
                        : `Updated ${new Date(project.updatedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  {active ? (
                    <input
                      className="derived-input derived-input--inline"
                      defaultValue={project.name}
                      aria-label="Rename project"
                      onBlur={(e) => {
                        const next = e.target.value.trim()
                        if (next && next !== project.name) {
                          renameProject(next)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
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
