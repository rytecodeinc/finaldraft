import { useLocation, useNavigate } from 'react-router-dom'
import { getNavItemByPath } from '@/navigation/navItems'
import { ELEMENT_LABELS } from '@/screenplay/types'
import { useLayoutStore } from '@/stores/layoutStore'
import {
  getSelectedElement,
  getSelectedScene,
  useScriptStore,
} from '@/stores/scriptStore'
import { useThemeStore } from '@/stores/themeStore'

export function StatusBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = getNavItemByPath(location.pathname)
  const theme = useThemeStore((s) => s.theme)
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)

  const selected = useScriptStore(getSelectedElement)
  const scene = useScriptStore(getSelectedScene)
  const saveStatus = useScriptStore((s) => s.saveStatus)
  const dirty = useScriptStore((s) => s.dirty)
  const elements = useScriptStore((s) => s.doc.elements)
  const title = useScriptStore((s) => s.doc.title)
  const onScript = location.pathname.startsWith('/script')

  const pageEstimate = useScriptStore((s) => s.getPageEstimate())
  const sceneCount = useScriptStore((s) => s.getScenes().length)
  void elements

  return (
    <footer className="statusbar" role="contentinfo">
      <div className="statusbar-group">
        <span className="statusbar-item">
          <span
            className="statusbar-dot"
            data-dirty={dirty ? 'true' : 'false'}
            aria-hidden
          />
          {saveStatus === 'saving'
            ? 'Saving'
            : saveStatus === 'error'
              ? 'Error'
              : dirty
                ? 'Unsaved'
                : 'Ready'}
        </span>
        <span className="statusbar-item">{current?.label ?? 'SceneDesk'}</span>
        {onScript ? (
          <button
            type="button"
            className="statusbar-item statusbar-link"
            onClick={() => navigate('/script')}
          >
            {title}
          </button>
        ) : (
          <span className="statusbar-item">Milestone 2 · Editor</span>
        )}
      </div>
      <div className="statusbar-group">
        {onScript ? (
          <>
            <span className="statusbar-item">
              {selected ? ELEMENT_LABELS[selected.type] : 'No selection'}
            </span>
            <span className="statusbar-item">
              Scene {scene?.number ?? '—'}
            </span>
            <span className="statusbar-item">{sceneCount} scenes</span>
            <span className="statusbar-item">~{pageEstimate} pp</span>
          </>
        ) : (
          <>
            <span className="statusbar-item">
              Sidebar {sidebarOpen ? 'open' : 'collapsed'}
            </span>
            <span className="statusbar-item">
              Inspector {inspectorOpen ? 'open' : 'hidden'}
            </span>
          </>
        )}
        <span className="statusbar-item" style={{ textTransform: 'capitalize' }}>
          {theme} mode
        </span>
      </div>
    </footer>
  )
}
