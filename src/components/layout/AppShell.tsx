import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomPanel } from '@/components/layout/BottomPanel'
import { InspectorPanel } from '@/components/layout/InspectorPanel'
import { MenuBar } from '@/components/layout/MenuBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { Toolbar } from '@/components/layout/Toolbar'
import { useLayoutStore } from '@/stores/layoutStore'

export function AppShell() {
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const toggleInspector = useLayoutStore((s) => s.toggleInspector)
  const toggleBottomPanel = useLayoutStore((s) => s.toggleBottomPanel)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      if (key === 'b') {
        event.preventDefault()
        toggleSidebar()
      } else if (key === 'i') {
        event.preventDefault()
        toggleInspector()
      } else if (key === 'j') {
        event.preventDefault()
        toggleBottomPanel()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleSidebar, toggleInspector, toggleBottomPanel])

  return (
    <div className="app-shell">
      <MenuBar />
      <Toolbar />
      <div className="workspace">
        <Sidebar />
        <div className="workspace-center">
          <main className="editor-pane" aria-label="Main content">
            <Outlet />
          </main>
          <BottomPanel />
        </div>
        <InspectorPanel />
      </div>
      <StatusBar />
    </div>
  )
}
