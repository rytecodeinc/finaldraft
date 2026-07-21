import { X } from 'lucide-react'
import { SceneMetaEditor } from '@/components/editor/SceneMetaEditor'
import { IconButton } from '@/components/ui/IconButton'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Resizer } from '@/components/ui/Resizer'
import { findSceneForElement } from '@/screenplay/elementRules'
import {
  ELEMENT_LABELS,
  ELEMENT_TYPES,
  type TitlePageInfo,
} from '@/screenplay/types'
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

export function InspectorPanel() {
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)
  const inspectorWidth = useLayoutStore((s) => s.inspectorWidth)
  const setInspectorOpen = useLayoutStore((s) => s.setInspectorOpen)
  const setInspectorWidth = useLayoutStore((s) => s.setInspectorWidth)

  const title = useScriptStore((s) => s.doc.title)
  const titlePage = useScriptStore((s) => s.doc.titlePage)
  const setTitle = useScriptStore((s) => s.setTitle)
  const updateTitlePage = useScriptStore((s) => s.updateTitlePage)
  const viewPage = useScriptStore((s) => s.viewPage)
  const elements = useScriptStore((s) => s.doc.elements)
  const selectedId = useScriptStore((s) => s.selectedId)
  const setElementType = useScriptStore((s) => s.setElementType)
  const pageCount = useScriptStore((s) => s.pageCount)

  const onTitlePage = viewPage === 'title'
  const selected =
    selectedId == null
      ? null
      : (elements.find((el) => el.id === selectedId) ?? null)
  const scene = findSceneForElement(elements, selectedId)

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
      <div className="panel-body">
        {onTitlePage ? (
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
        ) : (
          <section className="inspector-section">
            <h3>Screenplay</h3>
            <div className="inspector-field">
              <label htmlFor="inspector-title">Title</label>
              <input
                id="inspector-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Screenplay"
              />
            </div>
          </section>
        )}

        {!onTitlePage ? (
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
                <p className="inspector-empty">
                  Select a screenplay element to inspect.
                </p>
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

            <section className="inspector-section">
              <h3>Format</h3>
              <div className="chip-row">
                <span className="chip">Feature film</span>
                <span className="chip">US Letter</span>
                <span className="chip">SmartType</span>
              </div>
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: 'var(--text-muted)',
                }}
              >
                Title page, find (⌘/Ctrl+F), SmartType suggestions, and MORE/CONTINUED
                page breaks are active on the Script page.
              </p>
            </section>
          </>
        ) : (
          <section className="inspector-section">
            <h3>Format</h3>
            <div className="chip-row">
              <span className="chip">Feature film</span>
              <span className="chip">US Letter</span>
              <span className="chip">Title page</span>
            </div>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 12,
                lineHeight: 1.45,
                color: 'var(--text-muted)',
              }}
            >
              Edit any title-page field here or directly on the page. Changes stay in
              sync.
            </p>
          </section>
        )}
      </div>
    </aside>
  )
}
