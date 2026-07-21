import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Resizer } from '@/components/ui/Resizer'
import { useScriptPagination } from '@/hooks/useScriptPagination'
import { ELEMENT_LABELS } from '@/screenplay/types'
import { useLayoutStore } from '@/stores/layoutStore'
import { useScriptStore } from '@/stores/scriptStore'

type StatusFilter = 'all' | 'open' | 'resolved'
type PageFilter = 'all' | 'this' | 'next' | 'first' | 'last'

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

function authorInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'Y'
}

export function CommentsPanel() {
  const commentsOpen = useLayoutStore((s) => s.commentsOpen)
  const commentsWidth = useLayoutStore((s) => s.commentsWidth)
  const setCommentsOpen = useLayoutStore((s) => s.setCommentsOpen)
  const setCommentsWidth = useLayoutStore((s) => s.setCommentsWidth)

  const comments = useScriptStore((s) => s.doc.comments)
  const elements = useScriptStore((s) => s.doc.elements)
  const selectedId = useScriptStore((s) => s.selectedId)
  const activeCommentId = useScriptStore((s) => s.activeCommentId)
  const setActiveComment = useScriptStore((s) => s.setActiveComment)
  const selectElement = useScriptStore((s) => s.selectElement)
  const resolveComment = useScriptStore((s) => s.resolveComment)
  const deleteComment = useScriptStore((s) => s.deleteComment)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [pageFilter, setPageFilter] = useState<PageFilter>('all')

  const { pages } = useScriptPagination(elements)

  const elementPage = useMemo(() => {
    const map = new Map<string, number>()
    for (const page of pages) {
      for (const element of page.elements) {
        map.set(element.id, page.pageNumber)
      }
    }
    return map
  }, [pages])

  const currentPage = useMemo(() => {
    if (selectedId && elementPage.has(selectedId)) {
      return elementPage.get(selectedId)!
    }
    return pages[0]?.pageNumber ?? 1
  }, [selectedId, elementPage, pages])

  const lastPage = pages[pages.length - 1]?.pageNumber ?? 1
  const firstPage = pages[0]?.pageNumber ?? 1

  const filtered = useMemo(() => {
    return comments
      .filter((comment) => {
        if (statusFilter === 'open' && comment.resolved) return false
        if (statusFilter === 'resolved' && !comment.resolved) return false

        if (pageFilter === 'all') return true
        const page = elementPage.get(comment.elementId)
        if (page == null) return false
        if (pageFilter === 'this') return page === currentPage
        if (pageFilter === 'next') return page === currentPage + 1
        if (pageFilter === 'first') return page === firstPage
        if (pageFilter === 'last') return page === lastPage
        return true
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [
    comments,
    statusFilter,
    pageFilter,
    elementPage,
    currentPage,
    firstPage,
    lastPage,
  ])

  if (!commentsOpen) return null

  return (
    <aside
      className="comments-panel panel-surface panel-surface--right"
      style={{ width: commentsWidth }}
      aria-label="Comments"
    >
      <Resizer
        orientation="vertical-left"
        onResize={(delta) => setCommentsWidth(commentsWidth - delta)}
      />
      <PanelHeader
        title="Comments"
        actions={
          <IconButton
            label="Close comments"
            size="sm"
            onClick={() => setCommentsOpen(false)}
          >
            <X size={15} strokeWidth={1.75} />
          </IconButton>
        }
      />

      <div className="comments-panel-filters">
        <label className="sr-only" htmlFor="comments-status-filter">
          Comment status
        </label>
        <select
          id="comments-status-filter"
          className="comments-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All Types</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>

        <label className="sr-only" htmlFor="comments-page-filter">
          Comment page
        </label>
        <select
          id="comments-page-filter"
          className="comments-filter-select"
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value as PageFilter)}
        >
          <option value="all">All Pages</option>
          <option value="this">This page</option>
          <option value="next">Next page</option>
          <option value="first">First page</option>
          <option value="last">Last page</option>
        </select>
      </div>

      <div className="panel-body comments-panel-body">
        {filtered.length === 0 ? (
          <p className="comments-panel-empty">No comments match these filters.</p>
        ) : (
          <ul className="comments-panel-list">
            {filtered.map((comment) => {
              const element = elements.find((el) => el.id === comment.elementId)
              const page = elementPage.get(comment.elementId)
              const active = activeCommentId === comment.id
              return (
                <li key={comment.id}>
                  <div
                    className={`comments-panel-item ${active ? 'is-active' : ''} ${comment.resolved ? 'is-resolved' : ''}`.trim()}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveComment(comment.id)
                      selectElement(comment.elementId)
                      document
                        .querySelector(`[data-element-id="${comment.elementId}"]`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setActiveComment(comment.id)
                        selectElement(comment.elementId)
                        document
                          .querySelector(`[data-element-id="${comment.elementId}"]`)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }}
                  >
                    <div className="comments-panel-item-header">
                      <span className="script-comment-avatar" aria-hidden>
                        {authorInitial(comment.author)}
                      </span>
                      <div className="script-comment-meta">
                        <span className="script-comment-author">{comment.author}</span>
                        <span className="script-comment-time">
                          {formatCommentTime(comment.createdAt)}
                          {page != null ? ` · p. ${page}` : ''}
                        </span>
                      </div>
                      <span
                        className={`comments-panel-status ${comment.resolved ? 'is-resolved' : ''}`.trim()}
                      >
                        {comment.resolved ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                    <p className="comments-panel-item-text">{comment.text}</p>
                    <div className="comments-panel-item-meta">
                      <span>
                        {element ? ELEMENT_LABELS[element.type] : 'Missing element'}
                      </span>
                      <span className="comments-panel-item-actions">
                        {!comment.resolved ? (
                          <button
                            type="button"
                            className="comments-panel-action"
                            onClick={(e) => {
                              e.stopPropagation()
                              resolveComment(comment.id)
                            }}
                          >
                            Resolve
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="comments-panel-action is-danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteComment(comment.id)
                          }}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
