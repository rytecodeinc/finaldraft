import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Resizer } from '@/components/ui/Resizer'
import { useLayoutStore } from '@/stores/layoutStore'

const TABS = [
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'timeline', label: 'Timeline' },
] as const

export function BottomPanel() {
  const bottomPanelOpen = useLayoutStore((s) => s.bottomPanelOpen)
  const bottomPanelHeight = useLayoutStore((s) => s.bottomPanelHeight)
  const bottomPanelTab = useLayoutStore((s) => s.bottomPanelTab)
  const setBottomPanelOpen = useLayoutStore((s) => s.setBottomPanelOpen)
  const setBottomPanelHeight = useLayoutStore((s) => s.setBottomPanelHeight)
  const setBottomPanelTab = useLayoutStore((s) => s.setBottomPanelTab)

  if (!bottomPanelOpen) return null

  return (
    <section
      className="bottom-panel panel-surface panel-surface--bottom"
      style={{ height: bottomPanelHeight }}
      aria-label="Bottom panel"
    >
      <Resizer
        orientation="horizontal"
        onResize={(delta) => setBottomPanelHeight(bottomPanelHeight - delta)}
      />
      <div className="panel-tabs" role="tablist" aria-label="Bottom panel tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={bottomPanelTab === tab.id}
            className={`panel-tab ${bottomPanelTab === tab.id ? 'panel-tab--active' : ''}`.trim()}
            onClick={() => setBottomPanelTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div className="menubar-spacer" />
        <IconButton
          label="Close bottom panel"
          size="sm"
          onClick={() => setBottomPanelOpen(false)}
        >
          <X size={15} strokeWidth={1.75} />
        </IconButton>
      </div>
      <div className="panel-body" role="tabpanel">
        {bottomPanelTab === 'problems' ? (
          <div className="bottom-list">
            <div className="bottom-list-item">
              <strong>Info</strong>
              <span>No screenplay validation rules are active yet.</span>
              <span>Shell</span>
            </div>
            <div className="bottom-list-item">
              <strong>Hint</strong>
              <span>Connect the structured editor in a later milestone.</span>
              <span>Editor</span>
            </div>
          </div>
        ) : null}
        {bottomPanelTab === 'output' ? (
          <div className="bottom-list">
            <div className="bottom-list-item">
              <strong>00:00</strong>
              <span>SceneDesk workspace ready.</span>
              <span>System</span>
            </div>
            <div className="bottom-list-item">
              <strong>00:00</strong>
              <span>Layout preferences restored from local storage.</span>
              <span>Layout</span>
            </div>
          </div>
        ) : null}
        {bottomPanelTab === 'timeline' ? (
          <div className="bottom-list">
            <div className="bottom-list-item">
              <strong>Act I</strong>
              <span>Setup — placeholder beat markers</span>
              <span>0–25</span>
            </div>
            <div className="bottom-list-item">
              <strong>Act II</strong>
              <span>Confrontation — placeholder beat markers</span>
              <span>25–75</span>
            </div>
            <div className="bottom-list-item">
              <strong>Act III</strong>
              <span>Resolution — placeholder beat markers</span>
              <span>75–100</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
