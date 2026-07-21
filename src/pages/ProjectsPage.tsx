import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectDetailPath } from '@/navigation/navItems'
import {
  PROJECT_FORMAT_LABELS,
  PROJECT_STATUS_LABELS,
} from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

export function ProjectsPage() {
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const projects = useScriptStore((s) => s.projects)
  const activeId = useScriptStore((s) => s.project.id)
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
            Each project contains one screenplay. Open a project for its
            dashboard, then jump into script, outline, characters, or locations.
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
                      to={projectDetailPath(project.id)}
                    >
                      {project.name}
                    </Link>
                    <div className="derived-meta">
                      {active
                        ? `Active · ${docTitle.trim() || 'Untitled Screenplay'} · ${PROJECT_STATUS_LABELS[project.status]}`
                        : `${PROJECT_FORMAT_LABELS[project.format]} · ${PROJECT_STATUS_LABELS[project.status]} · Updated ${new Date(project.updatedAt).toLocaleDateString()}`}
                    </div>
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
