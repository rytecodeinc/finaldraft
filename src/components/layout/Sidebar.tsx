import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { IconButton } from '@/components/ui/IconButton'
import { Resizer } from '@/components/ui/Resizer'
import { NAV_ITEMS, NAV_SECTIONS, projectPath } from '@/navigation/navItems'
import {
  SIDEBAR_DEFAULT,
  useLayoutStore,
} from '@/stores/layoutStore'
import { useScriptStore } from '@/stores/scriptStore'

export function Sidebar() {
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth)
  const setSidebarWidth = useLayoutStore((s) => s.setSidebarWidth)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const projectId = useScriptStore((s) => s.project.id)
  const projectName = useScriptStore((s) => s.project.name)

  const width = sidebarOpen ? sidebarWidth : 52

  return (
    <aside
      className={`sidebar panel-surface ${sidebarOpen ? '' : 'collapsed'}`.trim()}
      style={{ width }}
      aria-label="Primary navigation"
    >
      <div className="sidebar-header">
        {sidebarOpen ? (
          <div className="sidebar-title" title={projectName}>
            {projectName}
          </div>
        ) : null}
        <IconButton
          label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          size="sm"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? (
            <PanelLeftClose size={15} strokeWidth={1.75} />
          ) : (
            <PanelLeftOpen size={15} strokeWidth={1.75} />
          )}
        </IconButton>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const items = NAV_ITEMS.filter((item) => item.section === section.id)
          if (items.length === 0) return null
          return (
            <div key={section.id}>
              {sidebarOpen ? (
                <div className="nav-section-label">{section.label}</div>
              ) : null}
              {items.map((item) => {
                const Icon = item.icon
                const to =
                  item.storyView && projectId
                    ? projectPath(projectId, item.storyView)
                    : item.path
                return (
                  <NavLink
                    key={item.id}
                    to={to}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'nav-item--active' : ''}`.trim()
                    }
                    title={item.label}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                    <span className="nav-item-label">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      {sidebarOpen ? (
        <Resizer
          orientation="vertical"
          onResize={(delta) => setSidebarWidth(sidebarWidth + delta)}
          onResizeEnd={() => {
            if (sidebarWidth < 160) {
              setSidebarWidth(SIDEBAR_DEFAULT)
            }
          }}
        />
      ) : null}
    </aside>
  )
}
