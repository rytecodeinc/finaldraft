import { useEffect } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useScriptStore } from '@/stores/scriptStore'

/**
 * Ensures the URL project id is the active workspace project before
 * rendering nested story views (script / outline / …).
 */
export function ProjectRouteGate() {
  const { projectId } = useParams()
  const hydrated = useScriptStore((s) => s.hydrated)
  const activeId = useScriptStore((s) => s.project.id)
  const projects = useScriptStore((s) => s.projects)
  const openProject = useScriptStore((s) => s.openProject)

  useEffect(() => {
    if (!hydrated || !projectId) return
    if (projectId === activeId) return
    if (!projects.some((p) => p.id === projectId)) return
    void openProject(projectId)
  }, [hydrated, projectId, activeId, projects, openProject])

  if (!hydrated || !projectId) return null

  if (!projects.some((p) => p.id === projectId)) {
    return <Navigate to="/projects" replace />
  }

  if (projectId !== activeId) {
    return (
      <div className="page">
        <div className="page-inner">
          <p className="page-desc">Opening project…</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
