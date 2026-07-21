import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BeatBoardPage } from '@/pages/BeatBoardPage'
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

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="script" element={<ScriptPage />} />
        <Route path="outline" element={<OutlinePage />} />
        <Route path="beat-board" element={<BeatBoardPage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="revisions" element={<RevisionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
