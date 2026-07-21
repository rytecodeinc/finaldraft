import { useLayoutEffect, useMemo, useState } from 'react'
import {
  CommentComposeCard,
  CommentThreadCard,
} from '@/components/editor/CommentCards'
import { useScriptStore } from '@/stores/scriptStore'

const CARD_GAP = 10
const CARD_ESTIMATE = 118

interface RailItem {
  key: string
  elementId: string
  kind: 'draft' | 'comment'
  commentId?: string
  preferredTop: number
}

/**
 * Google Docs–style margin comments, aligned to script elements beside the page.
 */
export function ScriptCommentsRail() {
  const comments = useScriptStore((s) => s.doc.comments)
  const elements = useScriptStore((s) => s.doc.elements)
  const draft = useScriptStore((s) => s.commentDraft)
  const activeCommentId = useScriptStore((s) => s.activeCommentId)
  const setCommentDraftText = useScriptStore((s) => s.setCommentDraftText)
  const cancelCommentDraft = useScriptStore((s) => s.cancelCommentDraft)
  const submitCommentDraft = useScriptStore((s) => s.submitCommentDraft)
  const setActiveComment = useScriptStore((s) => s.setActiveComment)
  const deleteComment = useScriptStore((s) => s.deleteComment)
  const author = useScriptStore((s) => {
    const fromTitle = s.doc.titlePage.authors.trim().split('\n')[0]?.trim()
    return fromTitle || 'You'
  })

  const elementIds = useMemo(() => new Set(elements.map((el) => el.id)), [elements])

  const visibleComments = useMemo(
    () => comments.filter((comment) => elementIds.has(comment.elementId)),
    [comments, elementIds],
  )

  const [tops, setTops] = useState<Record<string, number>>({})
  const [railHeight, setRailHeight] = useState(0)

  useLayoutEffect(() => {
    const pages = document.querySelector('.script-stage-pages')
    const rail = document.querySelector('.script-comments-rail')
    if (!pages || !rail) return

    const measure = () => {
      const pageRect = pages.getBoundingClientRect()
      const next: Record<string, number> = {}
      const ids = new Set<string>()
      for (const comment of visibleComments) ids.add(comment.elementId)
      if (draft) ids.add(draft.elementId)

      for (const id of ids) {
        const node = document.querySelector(`[data-element-id="${id}"]`)
        if (!(node instanceof HTMLElement)) continue
        const rect = node.getBoundingClientRect()
        next[id] = rect.top - pageRect.top
      }

      setTops(next)
      setRailHeight(pages.scrollHeight)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(pages)
    const canvas = document.querySelector('.script-canvas')
    canvas?.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)

    return () => {
      ro.disconnect()
      canvas?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [visibleComments, draft, elements])

  const items = useMemo(() => {
    const list: RailItem[] = []

    for (const comment of visibleComments) {
      list.push({
        key: comment.id,
        elementId: comment.elementId,
        kind: 'comment',
        commentId: comment.id,
        preferredTop: tops[comment.elementId] ?? 0,
      })
    }

    if (draft && elementIds.has(draft.elementId)) {
      list.push({
        key: `draft:${draft.elementId}`,
        elementId: draft.elementId,
        kind: 'draft',
        preferredTop: tops[draft.elementId] ?? 0,
      })
    }

    list.sort((a, b) => a.preferredTop - b.preferredTop || a.key.localeCompare(b.key))

    // Stack cards so they don't overlap while staying near their anchors.
    let lastBottom = -CARD_GAP
    return list.map((item) => {
      const top = Math.max(item.preferredTop, lastBottom + CARD_GAP)
      lastBottom = top + CARD_ESTIMATE
      return { ...item, top }
    })
  }, [visibleComments, draft, elementIds, tops])

  if (items.length === 0) {
    return <aside className="script-comments-rail" aria-hidden style={{ minHeight: railHeight }} />
  }

  return (
    <aside
      className="script-comments-rail"
      aria-label="Script comments"
      style={{ minHeight: Math.max(railHeight, items[items.length - 1]!.top + CARD_ESTIMATE) }}
    >
      {items.map((item) => {
        if (item.kind === 'draft' && draft) {
          return (
            <div
              key={item.key}
              className="script-comment-anchor"
              style={{ top: item.top }}
            >
              <CommentComposeCard
                author={author}
                text={draft.text}
                onChange={setCommentDraftText}
                onCancel={cancelCommentDraft}
                onSubmit={submitCommentDraft}
              />
            </div>
          )
        }

        const comment = visibleComments.find((c) => c.id === item.commentId)
        if (!comment) return null

        return (
          <div
            key={item.key}
            className="script-comment-anchor"
            style={{ top: item.top }}
          >
            <CommentThreadCard
              comment={comment}
              isActive={activeCommentId === comment.id}
              onActivate={() => {
                setActiveComment(comment.id)
                document
                  .querySelector(`[data-element-id="${comment.elementId}"]`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              onResolve={() => deleteComment(comment.id)}
              onDelete={() => deleteComment(comment.id)}
            />
          </div>
        )
      })}
    </aside>
  )
}
