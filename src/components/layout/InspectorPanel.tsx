import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Resizer } from '@/components/ui/Resizer'
import { useLayoutStore } from '@/stores/layoutStore'

export function InspectorPanel() {
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)
  const inspectorWidth = useLayoutStore((s) => s.inspectorWidth)
  const setInspectorOpen = useLayoutStore((s) => s.setInspectorOpen)
  const setInspectorWidth = useLayoutStore((s) => s.setInspectorWidth)

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
        <section className="inspector-section">
          <h3>Selection</h3>
          <div className="inspector-row">
            <span>Element</span>
            <span>Scene Heading</span>
          </div>
          <div className="inspector-row">
            <span>Page</span>
            <span>12</span>
          </div>
          <div className="inspector-row">
            <span>Scene #</span>
            <span>14</span>
          </div>
        </section>

        <section className="inspector-section">
          <h3>Scene Meta</h3>
          <div className="inspector-row">
            <span>INT / EXT</span>
            <span>INT.</span>
          </div>
          <div className="inspector-row">
            <span>Time of day</span>
            <span>NIGHT</span>
          </div>
          <div className="inspector-row">
            <span>Location</span>
            <span>APARTMENT</span>
          </div>
        </section>

        <section className="inspector-section">
          <h3>Tags</h3>
          <div className="chip-row">
            <span className="chip">Act II</span>
            <span className="chip">Midpoint</span>
            <span className="chip">A-Story</span>
          </div>
        </section>

        <section className="inspector-section">
          <h3>Notes</h3>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)' }}>
            Inspector content is placeholder for this milestone. Future versions will bind
            selection, scene metadata, and production fields here.
          </p>
        </section>
      </div>
    </aside>
  )
}
