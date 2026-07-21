import {
  MessagesSquare,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Search,
  Undo2,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { getNavItemByPath } from '@/navigation/navItems'
import { useLayoutStore } from '@/stores/layoutStore'
import { useScriptStore } from '@/stores/scriptStore'

export function Toolbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = getNavItemByPath(location.pathname)
  const onScript = location.pathname.startsWith('/script')
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)
  const bottomPanelOpen = useLayoutStore((s) => s.bottomPanelOpen)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const toggleInspector = useLayoutStore((s) => s.toggleInspector)
  const toggleBottomPanel = useLayoutStore((s) => s.toggleBottomPanel)
  const commentsOpen = useLayoutStore((s) => s.commentsOpen)
  const toggleComments = useLayoutStore((s) => s.toggleComments)

  const saveStatus = useScriptStore((s) => s.saveStatus)
  const dirty = useScriptStore((s) => s.dirty)
  const saveNow = useScriptStore((s) => s.saveNow)
  const undo = useScriptStore((s) => s.undo)
  const redo = useScriptStore((s) => s.redo)
  const addScene = useScriptStore((s) => s.addScene)
  const openFind = useScriptStore((s) => s.openFind)
  const findOpen = useScriptStore((s) => s.findOpen)
  const canUndo = useScriptStore((s) => s.undoStack.length > 0)
  const canRedo = useScriptStore((s) => s.redoStack.length > 0)

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved' && !dirty
        ? 'Saved'
        : 'Save script'

  return (
    <div className="toolbar" role="toolbar" aria-label="Editor toolbar">
      <div className="toolbar-group">
        <IconButton label="Toggle sidebar" active={sidebarOpen} onClick={toggleSidebar}>
          <PanelLeft size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label={saveLabel}
          active={dirty}
          onClick={() => void saveNow()}
        >
          <Save size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Undo" onClick={undo} disabled={!canUndo}>
          <Undo2 size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Redo" onClick={redo} disabled={!canRedo}>
          <Redo2 size={16} strokeWidth={1.75} />
        </IconButton>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <span className="toolbar-label">{current?.label ?? 'SceneDesk'}</span>
        {onScript ? (
          <span className="toolbar-save-status" data-status={saveStatus}>
            {saveStatus === 'saving'
              ? 'Saving'
              : saveStatus === 'error'
                ? 'Save error'
                : dirty
                  ? 'Unsaved'
                  : 'Saved'}
          </span>
        ) : null}
      </div>

      <div className="menubar-spacer" />

      <div className="toolbar-group">
        {onScript ? (
          <IconButton
            label="Find in script (⌘/Ctrl+F)"
            active={findOpen}
            onClick={openFind}
          >
            <Search size={16} strokeWidth={1.75} />
          </IconButton>
        ) : null}
        <IconButton
          label="Comments"
          active={commentsOpen}
          onClick={toggleComments}
        >
          <MessagesSquare size={16} strokeWidth={1.75} />
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
        <Button
          variant="primary"
          onClick={() => {
            if (!onScript) {
              navigate('/script')
              window.setTimeout(() => addScene(), 0)
              return
            }
            addScene()
          }}
        >
          New Scene
        </Button>
      </div>
    </div>
  )
}
