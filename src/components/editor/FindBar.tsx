import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { findInScript } from '@/screenplay/findScript'
import { ELEMENT_LABELS, ELEMENT_TYPES } from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

export function FindBar() {
  const open = useScriptStore((s) => s.findOpen)
  const query = useScriptStore((s) => s.findQuery)
  const typeFilter = useScriptStore((s) => s.findTypeFilter)
  const matchIndex = useScriptStore((s) => s.findMatchIndex)
  const elements = useScriptStore((s) => s.doc.elements)
  const setFindQuery = useScriptStore((s) => s.setFindQuery)
  const setFindTypeFilter = useScriptStore((s) => s.setFindTypeFilter)
  const goToFindMatch = useScriptStore((s) => s.goToFindMatch)
  const closeFind = useScriptStore((s) => s.closeFind)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastJumpKey = useRef('')

  const matches = findInScript(elements, query, typeFilter)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [open])

  useEffect(() => {
    if (!open || !query.trim() || matches.length === 0) return
    const key = `${query}|${typeFilter}|${matches.map((m) => m.elementId).join(',')}`
    if (key === lastJumpKey.current) return
    lastJumpKey.current = key
    goToFindMatch(0)
  }, [open, query, typeFilter, matches, goToFindMatch])

  if (!open) return null

  const displayIndex = matches.length === 0 ? 0 : matchIndex + 1

  return (
    <div className="find-bar" role="search" aria-label="Find in script">
      <input
        ref={inputRef}
        className="find-bar-input"
        type="search"
        value={query}
        placeholder="Find in script…"
        onChange={(e) => setFindQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            closeFind()
          } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            goToFindMatch(matchIndex - 1)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            goToFindMatch(matchIndex + 1)
          }
        }}
      />

      <select
        className="find-bar-filter"
        value={typeFilter}
        aria-label="Filter by element type"
        onChange={(e) =>
          setFindTypeFilter(e.target.value as typeof typeFilter)
        }
      >
        <option value="all">All types</option>
        {ELEMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {ELEMENT_LABELS[type]}
          </option>
        ))}
      </select>

      <span className="find-bar-count">
        {matches.length === 0 ? 'No matches' : `${displayIndex} of ${matches.length}`}
      </span>

      <IconButton
        label="Previous match"
        size="sm"
        onClick={() => goToFindMatch(matchIndex - 1)}
        disabled={matches.length === 0}
      >
        <ChevronUp size={15} strokeWidth={1.75} />
      </IconButton>
      <IconButton
        label="Next match"
        size="sm"
        onClick={() => goToFindMatch(matchIndex + 1)}
        disabled={matches.length === 0}
      >
        <ChevronDown size={15} strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Close find" size="sm" onClick={closeFind}>
        <X size={15} strokeWidth={1.75} />
      </IconButton>
    </div>
  )
}
