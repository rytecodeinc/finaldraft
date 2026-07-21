import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectRouteGate } from '@/components/project/ProjectRouteGate'
import { BeatBoardPage } from '@/pages/BeatBoardPage'
import { CharacterDetailPage } from '@/pages/CharacterDetailPage'
import { CharactersPage } from '@/pages/CharactersPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LocationsPage } from '@/pages/LocationsPage'
import { NotesPage } from '@/pages/NotesPage'
import { OutlinePage } from '@/pages/OutlinePage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { RevisionsPage } from '@/pages/RevisionsPage'
import { ScriptPage } from '@/pages/ScriptPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { projectPath } from '@/navigation/navItems'
import { useScriptStore } from '@/stores/scriptStore'

function ActiveProjectRedirect({
  view,
}: {
  view: 'script' | 'outline' | 'characters' | 'locations' | 'notes'
}) {
  const hydrated = useScriptStore((s) => s.hydrated)
  const projectId = useScriptStore((s) => s.project.id)
  if (!hydrated) return null
  return <Navigate to={projectPath(projectId, view)} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />

        <Route path="p/:projectId" element={<ProjectRouteGate />}>
          <Route path="script" element={<ScriptPage />} />
          <Route path="outline" element={<OutlinePage />} />
          <Route path="characters" element={<CharactersPage />} />
          <Route
            path="characters/:characterName"
            element={<CharacterDetailPage />}
          />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>

        <Route path="script" element={<ActiveProjectRedirect view="script" />} />
        <Route
          path="outline"
          element={<ActiveProjectRedirect view="outline" />}
        />
        <Route
          path="characters"
          element={<ActiveProjectRedirect view="characters" />}
        />
        <Route
          path="locations"
          element={<ActiveProjectRedirect view="locations" />}
        />
        <Route path="notes" element={<ActiveProjectRedirect view="notes" />} />

        <Route path="beat-board" element={<BeatBoardPage />} />
        <Route path="revisions" element={<RevisionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
