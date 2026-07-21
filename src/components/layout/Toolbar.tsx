import {
  Bold,
  Italic,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Search,
  Underline,
  Undo2,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { getNavItemByPath } from '@/navigation/navItems'
import { useLayoutStore } from '@/stores/layoutStore'

export function Toolbar() {
  const location = useLocation()
  const current = getNavItemByPath(location.pathname)
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)
  const bottomPanelOpen = useLayoutStore((s) => s.bottomPanelOpen)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const toggleInspector = useLayoutStore((s) => s.toggleInspector)
  const toggleBottomPanel = useLayoutStore((s) => s.toggleBottomPanel)

  return (
    <div className="toolbar" role="toolbar" aria-label="Editor toolbar">
      <div className="toolbar-group">
        <IconButton label="Toggle sidebar" active={sidebarOpen} onClick={toggleSidebar}>
          <PanelLeft size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Save project">
          <Save size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Undo">
          <Undo2 size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Redo">
          <Redo2 size={16} strokeWidth={1.75} />
        </IconButton>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group toolbar-group--secondary">
        <IconButton label="Bold">
          <Bold size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Italic">
          <Italic size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Underline">
          <Underline size={16} strokeWidth={1.75} />
        </IconButton>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <span className="toolbar-label">{current?.label ?? 'SceneDesk'}</span>
      </div>

      <div className="menubar-spacer" />

      <div className="toolbar-group">
        <IconButton label="Search">
          <Search size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label="Toggle bottom panel"
          active={bottomPanelOpen}
          onClick={toggleBottomPanel}
        >
          <PanelBottom size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label="Toggle inspector"
          active={inspectorOpen}
          onClick={toggleInspector}
        >
          <PanelRight size={16} strokeWidth={1.75} />
        </IconButton>
        <Button variant="primary">New Scene</Button>
      </div>
    </div>
  )
}
