import {
  AlignLeft,
  Clapperboard,
  CornerDownRight,
  MessageSquareText,
  MoveRight,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { ELEMENT_LABELS, ELEMENT_TYPES, type ElementType } from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

const TYPE_ICONS: Record<ElementType, LucideIcon> = {
  sceneHeading: Clapperboard,
  action: AlignLeft,
  character: UserRound,
  parenthetical: CornerDownRight,
  dialogue: MessageSquareText,
  transition: MoveRight,
}

export function ElementTypeQuickBar() {
  const selectedId = useScriptStore((s) => s.selectedId)
  const elements = useScriptStore((s) => s.doc.elements)
  const setElementType = useScriptStore((s) => s.setElementType)
  const requestFocus = useScriptStore((s) => s.requestFocus)

  const selected =
    selectedId == null
      ? null
      : (elements.find((el) => el.id === selectedId) ?? null)

  return (
    <div className="quick-actions" role="toolbar" aria-label="Element type">
      <div className="quick-actions-label">Type</div>
      {ELEMENT_TYPES.map((type) => {
        const Icon = TYPE_ICONS[type]
        const active = selected?.type === type
        return (
          <button
            key={type}
            type="button"
            className={`quick-actions-btn ${active ? 'is-active' : ''}`.trim()}
            title={ELEMENT_LABELS[type]}
            aria-label={ELEMENT_LABELS[type]}
            aria-pressed={active}
            disabled={!selected}
            onMouseDown={(event) => {
              // Keep script caret from blurring before the click applies.
              event.preventDefault()
            }}
            onClick={() => {
              if (!selected) return
              setElementType(selected.id, type)
              requestFocus(selected.id)
            }}
          >
            <Icon size={16} strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}
