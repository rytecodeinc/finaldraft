import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import type { SmartTypeSuggestion } from '@/screenplay/smartType'

interface SmartTypeMenuProps {
  suggestions: SmartTypeSuggestion[]
  activeIndex: number
  onSelect: (suggestion: SmartTypeSuggestion) => void
  onHover: (index: number) => void
  /** Element the menu should anchor to (input / textarea). */
  anchorRef: RefObject<HTMLElement | null>
  /** Horizontal inset as a fraction of anchor width (e.g. 0.2 for character). */
  insetRatio?: number
}

interface MenuCoords {
  top: number
  left: number
  width: number
  maxHeight: number
  openUp: boolean
}

export function SmartTypeMenu({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
  anchorRef,
  insetRatio = 0,
}: SmartTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<MenuCoords | null>(null)

  useLayoutEffect(() => {
    if (suggestions.length === 0) {
      setCoords(null)
      return
    }

    const update = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const inset = rect.width * insetRatio
      const width = Math.max(120, rect.width - inset * 2)
      const left = rect.left + inset
      const estimatedHeight = Math.min(220, suggestions.length * 34 + 12)
      const gap = 4
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
      const maxHeight = Math.min(220, openUp ? spaceAbove : spaceBelow)

      setCoords({
        top: openUp ? rect.top - gap : rect.bottom + gap,
        left,
        width,
        maxHeight: Math.max(80, maxHeight),
        openUp,
      })
    }

    update()
    // Capture scroll from nested script-canvas / page containers.
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchorRef, insetRatio, suggestions.length, suggestions])

  if (suggestions.length === 0 || !coords) return null

  const style: CSSProperties = {
    position: 'fixed',
    left: coords.left,
    width: coords.width,
    maxHeight: coords.maxHeight,
    zIndex: 80,
    ...(coords.openUp
      ? { bottom: window.innerHeight - coords.top, top: 'auto' }
      : { top: coords.top, bottom: 'auto' }),
  }

  return createPortal(
    <div
      ref={menuRef}
      className={`smarttype-menu ${coords.openUp ? 'is-open-up' : ''}`.trim()}
      style={style}
      role="listbox"
      aria-label="SmartType suggestions"
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className={`smarttype-item ${index === activeIndex ? 'is-active' : ''}`.trim()}
          onMouseDown={(event) => {
            event.preventDefault()
            onSelect(suggestion)
          }}
          onMouseEnter={() => onHover(index)}
        >
          <span className="smarttype-group">{suggestion.group}</span>
          <span className="smarttype-label">{suggestion.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  )
}
