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
import {
  characterPath,
  getNavItemByPath,
  getPrimaryAction,
  isScriptPath,
  parseProjectDetailPath,
  parseProjectPath,
  primaryActionLabel,
  projectDetailPath,
  projectPath,
} from '@/navigation/navItems'
import { useLayoutStore } from '@/stores/layoutStore'
import { useScriptStore } from '@/stores/scriptStore'

export function Toolbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = getNavItemByPath(location.pathname)
  const projectRoute = parseProjectPath(location.pathname)
  const projectDetailRoute = parseProjectDetailPath(location.pathname)
  const onScript = isScriptPath(location.pathname)
  const projectName = useScriptStore((s) => s.project.name)
  const projectId = useScriptStore((s) => s.project.id)
  const projects = useScriptStore((s) => s.projects)
  const directorySelection = useScriptStore((s) => s.directorySelection)

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
  const saveProjectNow = useScriptStore((s) => s.saveProjectNow)
  const undo = useScriptStore((s) => s.undo)
  const redo = useScriptStore((s) => s.redo)
  const addScene = useScriptStore((s) => s.addScene)
  const addCharacter = useScriptStore((s) => s.addCharacter)
  const addLocation = useScriptStore((s) => s.addLocation)
  const createProject = useScriptStore((s) => s.createProject)
  const openFind = useScriptStore((s) => s.openFind)
  const findOpen = useScriptStore((s) => s.findOpen)
  const canUndo = useScriptStore((s) => s.undoStack.length > 0)
  const canRedo = useScriptStore((s) => s.redoStack.length > 0)

  const primaryAction = getPrimaryAction(location.pathname, {
    directoryKind: directorySelection?.kind ?? null,
  })
  const primaryLabel =
    primaryAction.mode === 'save' && saveStatus === 'saving'
      ? 'Saving…'
      : primaryActionLabel(primaryAction)

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved' && !dirty
        ? 'Saved'
        : 'Save script'

  const toolbarLabel = (() => {
    if (projectDetailRoute) {
      const named =
        projects.find((p) => p.id === projectDetailRoute.projectId)?.name ??
        (projectId === projectDetailRoute.projectId ? projectName : null)
      return named ? `Projects > ${named}` : 'Projects'
    }
    if (!projectRoute) return current?.label ?? 'SceneDesk'
    if (projectRoute.view === 'characters' && projectRoute.detail) {
      return `${projectName} > Characters > ${projectRoute.detail}`
    }
    return `${projectName} > ${current?.label ?? 'Story'}`
  })()

  const handlePrimaryAction = () => {
    if (primaryAction.mode === 'save') {
      switch (primaryAction.target) {
        case 'project':
          void saveProjectNow(projectDetailRoute?.projectId)
          return
        case 'character':
        case 'location':
        case 'scene':
        case 'note':
        default:
          void saveNow()
          return
      }
    }

    switch (primaryAction.target) {
      case 'project': {
        void (async () => {
          const id = await createProject()
          navigate(projectDetailPath(id))
        })()
        return
      }
      case 'character': {
        const name = addCharacter()
        navigate(characterPath(projectId, name))
        return
      }
      case 'location': {
        addLocation()
        if (projectRoute?.view !== 'locations') {
          navigate(projectPath(projectId, 'locations'))
        }
        return
      }
      case 'note': {
        if (projectRoute?.view !== 'notes') {
          navigate(projectPath(projectId, 'notes'))
        }
        return
      }
      case 'scene':
      default: {
        if (!onScript && projectRoute?.view !== 'outline') {
          navigate(projectPath(projectId, 'script'))
          window.setTimeout(() => addScene(), 0)
          return
        }
        addScene()
      }
    }
  }

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
        <span className="toolbar-label">{toolbarLabel}</span>
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
          onClick={handlePrimaryAction}
          disabled={primaryAction.mode === 'save' && saveStatus === 'saving'}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  )
}
