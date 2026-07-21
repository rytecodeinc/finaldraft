import {
  AlignLeft,
  Clapperboard,
  CornerDownRight,
  MessageSquarePlus,
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
  const startCommentDraft = useScriptStore((s) => s.startCommentDraft)
  const commentDraft = useScriptStore((s) => s.commentDraft)
  const comments = useScriptStore((s) => s.doc.comments)

  const selected =
    selectedId == null
      ? null
      : (elements.find((el) => el.id === selectedId) ?? null)

  const commentActive =
    Boolean(selected) &&
    (commentDraft?.elementId === selected?.id ||
      comments.some(
        (comment) => comment.elementId === selected?.id && !comment.resolved,
      ))

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
              requestFocus(
                selected.id,
                type === 'parenthetical' ? { start: 1, end: 1 } : null,
              )
            }}
          >
            <Icon size={16} strokeWidth={1.75} />
          </button>
        )
      })}

      <div className="quick-actions-divider" aria-hidden />

      <button
        type="button"
        className={`quick-actions-btn quick-actions-btn--comment ${commentActive ? 'is-active' : ''}`.trim()}
        title="Add comment"
        aria-label="Add comment"
        aria-pressed={commentActive}
        disabled={!selected}
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onClick={() => {
          if (!selected) return
          // Read live selection so a partial highlight can be commented.
          const node = document.getElementById(
            `el-${selected.id}`,
          ) as HTMLInputElement | HTMLTextAreaElement | null
          let range: { start: number; end: number; quote: string } | null = null
          if (node && typeof node.selectionStart === 'number') {
            const start = node.selectionStart
            const end = node.selectionEnd ?? start
            if (end > start) {
              // Strip CONT'D display suffix for character lines when present.
              const raw = selected.text
              const clippedEnd = Math.min(end, raw.length)
              const clippedStart = Math.min(start, clippedEnd)
              if (clippedEnd > clippedStart) {
                range = {
                  start: clippedStart,
                  end: clippedEnd,
                  quote: raw.slice(clippedStart, clippedEnd),
                }
              }
            }
          }
          startCommentDraft(selected.id, range)
        }}
      >
        <MessageSquarePlus size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}
