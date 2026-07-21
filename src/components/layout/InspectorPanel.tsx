import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { SceneMetaEditor } from '@/components/editor/SceneMetaEditor'
import { IconButton } from '@/components/ui/IconButton'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Resizer } from '@/components/ui/Resizer'
import {
  getCharacterAppearance,
  getLocationAppearance,
  findSceneForElement,
} from '@/screenplay/elementRules'
import {
  ELEMENT_LABELS,
  ELEMENT_TYPES,
  type TitlePageInfo,
} from '@/screenplay/types'
import {
  parseProjectPath,
  projectPath,
  characterPath,
  type StoryView,
} from '@/navigation/navItems'
import { useLayoutStore } from '@/stores/layoutStore'
import { useScriptStore } from '@/stores/scriptStore'

const TITLE_PAGE_FIELDS: {
  key: keyof TitlePageInfo
  label: string
  multiline?: boolean
  placeholder?: string
}[] = [
  { key: 'title', label: 'Title', placeholder: 'Untitled Screenplay' },
  { key: 'credit', label: 'Credit', placeholder: 'Written by' },
  { key: 'authors', label: 'Author(s)', placeholder: 'Writer Name' },
  { key: 'basedOn', label: 'Based on', placeholder: 'Based on the novel by…' },
  {
    key: 'contact',
    label: 'Contact',
    multiline: true,
    placeholder: 'Name\nAddress\nPhone / Email',
  },
  { key: 'copyright', label: 'Copyright', placeholder: '© Year' },
  { key: 'draftDate', label: 'Draft date' },
  { key: 'revision', label: 'Revision', placeholder: 'First Draft' },
]

function ScriptInspector() {
  const titlePage = useScriptStore((s) => s.doc.titlePage)
  const updateTitlePage = useScriptStore((s) => s.updateTitlePage)
  const elements = useScriptStore((s) => s.doc.elements)
  const selectedId = useScriptStore((s) => s.selectedId)
  const setElementType = useScriptStore((s) => s.setElementType)
  const pageCount = useScriptStore((s) => s.pageCount)
  const viewPage = useScriptStore((s) => s.viewPage)
  const onTitlePage = viewPage === 'title'

  const selected =
    selectedId == null
      ? null
      : (elements.find((el) => el.id === selectedId) ?? null)
  const scene = findSceneForElement(elements, selectedId)

  if (onTitlePage) {
    return (
      <>
        <section className="inspector-section">
          <h3>Title Page</h3>
          {TITLE_PAGE_FIELDS.map((field) => {
            const id = `inspector-tp-${field.key}`
            const value = titlePage[field.key]
            return (
              <div className="inspector-field" key={field.key}>
                <label htmlFor={id}>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    id={id}
                    rows={4}
                    value={value}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      updateTitlePage({ [field.key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    id={id}
                    type="text"
                    value={value}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      updateTitlePage({ [field.key]: e.target.value })
                    }
                  />
                )}
              </div>
            )
          })}
        </section>
        <section className="inspector-section">
          <h3>Format</h3>
          <div className="chip-row">
            <span className="chip">Feature film</span>
            <span className="chip">US Letter</span>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="inspector-section">
        <h3>Selection</h3>
        {selected ? (
          <>
            <div className="inspector-row">
              <span>Element</span>
              <span>{ELEMENT_LABELS[selected.type]}</span>
            </div>
            <div className="inspector-row">
              <span>Pages</span>
              <span>{pageCount}</span>
            </div>
            <div className="inspector-row">
              <span>Scene #</span>
              <span>{scene?.number ?? '—'}</span>
            </div>
            <div className="inspector-field">
              <label htmlFor="inspector-type">Type</label>
              <select
                id="inspector-type"
                value={selected.type}
                onChange={(e) =>
                  setElementType(
                    selected.id,
                    e.target.value as (typeof ELEMENT_TYPES)[number],
                  )
                }
              >
                {ELEMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ELEMENT_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <p className="inspector-empty">Select a screenplay element to inspect.</p>
        )}
      </section>

      <section className="inspector-section">
        <h3>Scene Meta</h3>
        {scene ? (
          <SceneMetaEditor scene={scene} />
        ) : (
          <p className="inspector-empty">
            No scene heading above the current selection.
          </p>
        )}
      </section>

      {selected?.type === 'character' ||
      selected?.type === 'dialogue' ||
      selected?.type === 'parenthetical' ? (
        <section className="inspector-section">
          <h3>Dialogue Context</h3>
          <div className="inspector-row">
            <span>Preview</span>
            <span className="inspector-heading">
              {selected.text.trim() || 'Empty'}
            </span>
          </div>
        </section>
      ) : null}
    </>
  )
}

function CharacterInspector() {
  const navigate = useNavigate()
  const location = useLocation()
  const projectId = useScriptStore((s) => s.project.id)
  const elements = useScriptStore((s) => s.doc.elements)
  const directorySelection = useScriptStore((s) => s.directorySelection)
  const renameCharacter = useScriptStore((s) => s.renameCharacter)
  const revealElement = useScriptStore((s) => s.revealElement)

  const routeDetail = parseProjectPath(location.pathname)?.detail ?? null
  const name =
    routeDetail ??
    (directorySelection?.kind === 'character' ? directorySelection.name : null)

  const [draft, setDraft] = useState(name ?? '')
  useEffect(() => {
    setDraft(name ?? '')
  }, [name])

  const appearance = useMemo(
    () => (name ? getCharacterAppearance(elements, name) : null),
    [elements, name],
  )

  if (!name || !appearance) {
    return (
      <section className="inspector-section">
        <h3>Character</h3>
        <p className="inspector-empty">Select a character to inspect.</p>
      </section>
    )
  }

  const openInScript = (elementId: string) => {
    revealElement(elementId)
    navigate(projectPath(projectId, 'script'))
  }

  return (
    <>
      <section className="inspector-section">
        <h3>Character</h3>
        <div className="inspector-field">
          <label htmlFor="inspector-character-name">Name</label>
          <input
            id="inspector-character-name"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toUpperCase())}
            onBlur={() => {
              const next = draft.trim().toUpperCase()
              if (next && next !== name) {
                renameCharacter(name, next)
                if (routeDetail) {
                  navigate(characterPath(projectId, next), { replace: true })
                }
              } else setDraft(name)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        </div>
        <div className="inspector-row">
          <span>Appearances</span>
          <span>
            {appearance.cueCount} cue{appearance.cueCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="inspector-row">
          <span>Dialogue</span>
          <span>{appearance.dialogueCount}</span>
        </div>
        <div className="inspector-row">
          <span>Scenes</span>
          <span>{appearance.scenes.length}</span>
        </div>
        <button
          type="button"
          className="inspector-action"
          disabled={!appearance.firstCueId}
          onClick={() => {
            if (!appearance.firstCueId) return
            openInScript(appearance.firstCueId)
          }}
        >
          Open first cue in script
        </button>
      </section>

      <section className="inspector-section">
        <h3>Scenes</h3>
        {appearance.scenes.length === 0 ? (
          <p className="inspector-empty">No scene context for these cues.</p>
        ) : (
          <ul className="inspector-scene-list">
            {appearance.scenes.map((scene) => (
              <li key={scene.id}>
                <button
                  type="button"
                  className="inspector-scene-btn"
                  onClick={() => openInScript(scene.id)}
                >
                  <span className="inspector-scene-num">{scene.number}</span>
                  <span className="inspector-scene-heading">{scene.heading}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function LocationInspector() {
  const navigate = useNavigate()
  const projectId = useScriptStore((s) => s.project.id)
  const elements = useScriptStore((s) => s.doc.elements)
  const directorySelection = useScriptStore((s) => s.directorySelection)
  const renameLocation = useScriptStore((s) => s.renameLocation)
  const revealElement = useScriptStore((s) => s.revealElement)

  const name =
    directorySelection?.kind === 'location' ? directorySelection.name : null

  const [draft, setDraft] = useState(name ?? '')
  useEffect(() => {
    setDraft(name ?? '')
  }, [name])

  const appearance = useMemo(
    () => (name ? getLocationAppearance(elements, name) : null),
    [elements, name],
  )

  if (!name || !appearance) {
    return (
      <section className="inspector-section">
        <h3>Location</h3>
        <p className="inspector-empty">Select a location to inspect.</p>
      </section>
    )
  }

  return (
    <>
      <section className="inspector-section">
        <h3>Location</h3>
        <div className="inspector-field">
          <label htmlFor="inspector-location-name">Name</label>
          <input
            id="inspector-location-name"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toUpperCase())}
            onBlur={() => {
              const next = draft.trim().toUpperCase()
              if (next && next !== name) renameLocation(name, next)
              else setDraft(name)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        </div>
        <div className="inspector-row">
          <span>Scenes</span>
          <span>{appearance.sceneCount}</span>
        </div>
      </section>

      <section className="inspector-section">
        <h3>Used in</h3>
        {appearance.scenes.length === 0 ? (
          <p className="inspector-empty">No scenes use this location.</p>
        ) : (
          <ul className="inspector-scene-list">
            {appearance.scenes.map((scene) => (
              <li key={scene.id}>
                <button
                  type="button"
                  className="inspector-scene-btn"
                  onClick={() => {
                    revealElement(scene.id)
                    navigate(projectPath(projectId, 'script'))
                  }}
                >
                  <span className="inspector-scene-num">{scene.number}</span>
                  <span className="inspector-scene-heading">{scene.heading}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function OutlineInspector() {
  const navigate = useNavigate()
  const projectId = useScriptStore((s) => s.project.id)
  const elements = useScriptStore((s) => s.doc.elements)
  const directorySelection = useScriptStore((s) => s.directorySelection)
  const getScenes = useScriptStore((s) => s.getScenes)
  const revealElement = useScriptStore((s) => s.revealElement)

  const scenes = useMemo(() => getScenes(), [getScenes, elements])
  const sceneId =
    directorySelection?.kind === 'scene' ? directorySelection.sceneId : null
  const scene = scenes.find((s) => s.id === sceneId) ?? null

  if (!scene) {
    return (
      <section className="inspector-section">
        <h3>Scene</h3>
        <p className="inspector-empty">Select a scene in the outline.</p>
      </section>
    )
  }

  return (
    <>
      <section className="inspector-section">
        <h3>Scene {scene.number}</h3>
        <div className="inspector-row">
          <span>Heading</span>
          <span className="inspector-heading">{scene.heading}</span>
        </div>
        <button
          type="button"
          className="inspector-action"
          onClick={() => {
            revealElement(scene.id)
            navigate(projectPath(projectId, 'script'))
          }}
        >
          Open in script
        </button>
      </section>
      <section className="inspector-section">
        <h3>Scene Meta</h3>
        <SceneMetaEditor scene={scene} />
      </section>
    </>
  )
}

function ProjectInspector() {
  const project = useScriptStore((s) => s.project)
  const title = useScriptStore((s) => s.doc.title)
  const getPageEstimate = useScriptStore((s) => s.getPageEstimate)
  const getScenes = useScriptStore((s) => s.getScenes)
  const getCharacters = useScriptStore((s) => s.getCharacters)
  const getLocations = useScriptStore((s) => s.getLocations)
  const elements = useScriptStore((s) => s.doc.elements)

  const pages = getPageEstimate()
  const sceneCount = useMemo(() => getScenes().length, [getScenes, elements])
  const characterCount = useMemo(
    () => getCharacters().length,
    [getCharacters, elements],
  )
  const locationCount = useMemo(
    () => getLocations().length,
    [getLocations, elements],
  )

  return (
    <section className="inspector-section">
      <h3>Project</h3>
      <div className="inspector-row">
        <span>Name</span>
        <span>{project.name}</span>
      </div>
      <div className="inspector-row">
        <span>Script</span>
        <span>{title.trim() || 'Untitled Screenplay'}</span>
      </div>
      <div className="inspector-row">
        <span>Pages</span>
        <span>{pages}</span>
      </div>
      <div className="inspector-row">
        <span>Scenes</span>
        <span>{sceneCount}</span>
      </div>
      <div className="inspector-row">
        <span>Characters</span>
        <span>{characterCount}</span>
      </div>
      <div className="inspector-row">
        <span>Locations</span>
        <span>{locationCount}</span>
      </div>
    </section>
  )
}

function inspectorForView(view: StoryView | null) {
  switch (view) {
    case 'script':
      return <ScriptInspector />
    case 'characters':
      return <CharacterInspector />
    case 'locations':
      return <LocationInspector />
    case 'outline':
      return <OutlineInspector />
    default:
      return <ProjectInspector />
  }
}

export function InspectorPanel() {
  const location = useLocation()
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)
  const inspectorWidth = useLayoutStore((s) => s.inspectorWidth)
  const setInspectorOpen = useLayoutStore((s) => s.setInspectorOpen)
  const setInspectorWidth = useLayoutStore((s) => s.setInspectorWidth)

  const projectRoute = parseProjectPath(location.pathname)
  const view = projectRoute?.view ?? null

  if (!inspectorOpen) return null

  return (
    <aside
      className="inspector panel-surface panel-surface--right"
      style={{ width: inspectorWidth }}
      aria-label="Inspector"
    >
      <Resizer
        orientation="vertical-left"
        onResize={(delta) => setInspectorWidth(inspectorWidth - delta)}
      />
      <PanelHeader
        title="Inspector"
        actions={
          <IconButton
            label="Close inspector"
            size="sm"
            onClick={() => setInspectorOpen(false)}
          >
            <X size={15} strokeWidth={1.75} />
          </IconButton>
        }
      />
      <div className="panel-body">{inspectorForView(view)}</div>
    </aside>
  )
}
