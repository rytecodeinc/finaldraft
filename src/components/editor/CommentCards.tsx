import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import type { ElementComment } from '@/screenplay/types'

function authorInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Y'
  return trimmed.charAt(0).toUpperCase()
}

function formatCommentTime(timestamp: number): string {
  const date = new Date(timestamp)
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / (24 * 60 * 60 * 1000),
  )

  if (dayDiff === 0) return `${time} Today`
  if (dayDiff === 1) return `${time} Yesterday`
  return `${time} ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

interface CommentComposeCardProps {
  author: string
  text: string
  onChange: (text: string) => void
  onCancel: () => void
  onSubmit: () => void
  autoFocus?: boolean
}

export function CommentComposeCard({
  author,
  text,
  onChange,
  onCancel,
  onSubmit,
  autoFocus = true,
}: CommentComposeCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
  }, [autoFocus])

  const canSubmit = text.trim().length > 0

  return (
    <div className="script-comment-card script-comment-card--compose">
      <div className="script-comment-header">
        <span className="script-comment-avatar" aria-hidden>
          {authorInitial(author)}
        </span>
        <div className="script-comment-meta">
          <span className="script-comment-author">{author}</span>
        </div>
      </div>

      <input
        ref={inputRef}
        className="script-comment-input"
        type="text"
        value={text}
        placeholder="Add a comment"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit) {
            e.preventDefault()
            onSubmit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
      />

      <div className="script-comment-actions">
        <button type="button" className="script-comment-btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="script-comment-btn-submit"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          Comment
        </button>
      </div>
    </div>
  )
}

interface CommentThreadCardProps {
  comment: ElementComment
  isActive: boolean
  onActivate: () => void
  onResolve: () => void
}

export function CommentThreadCard({
  comment,
  isActive,
  onActivate,
  onResolve,
}: CommentThreadCardProps) {
  return (
    <div
      className={`script-comment-card ${isActive ? 'is-active' : ''}`.trim()}
      onClick={onActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
    >
      <div className="script-comment-header">
        <span className="script-comment-avatar" aria-hidden>
          {authorInitial(comment.author)}
        </span>
        <div className="script-comment-meta">
          <span className="script-comment-author">{comment.author}</span>
          <span className="script-comment-time">
            {formatCommentTime(comment.createdAt)}
          </span>
        </div>
        <button
          type="button"
          className="script-comment-resolve"
          title="Resolve comment"
          aria-label="Resolve comment"
          onClick={(e) => {
            e.stopPropagation()
            onResolve()
          }}
        >
          <Check size={16} strokeWidth={2.25} />
        </button>
      </div>
      <p className="script-comment-body">{comment.text}</p>
    </div>
  )
}
