import { useLocation } from 'react-router-dom'
import { getNavItemByPath } from '@/navigation/navItems'
import { useLayoutStore } from '@/stores/layoutStore'
import { useThemeStore } from '@/stores/themeStore'

export function StatusBar() {
  const location = useLocation()
  const current = getNavItemByPath(location.pathname)
  const theme = useThemeStore((s) => s.theme)
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)

  return (
    <footer className="statusbar" role="contentinfo">
      <div className="statusbar-group">
        <span className="statusbar-item">
          <span className="statusbar-dot" aria-hidden />
          Ready
        </span>
        <span className="statusbar-item">{current?.label ?? 'SceneDesk'}</span>
        <span className="statusbar-item">Milestone 1 · UI Shell</span>
      </div>
      <div className="statusbar-group">
        <span className="statusbar-item">
          Sidebar {sidebarOpen ? 'open' : 'collapsed'}
        </span>
        <span className="statusbar-item">
          Inspector {inspectorOpen ? 'open' : 'hidden'}
        </span>
        <span className="statusbar-item" style={{ textTransform: 'capitalize' }}>
          {theme} mode
        </span>
        <span className="statusbar-item">UTF-8</span>
      </div>
    </footer>
  )
}
