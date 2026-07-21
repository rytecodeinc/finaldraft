import type { SmartTypeSuggestion } from '@/screenplay/smartType'

interface SmartTypeMenuProps {
  suggestions: SmartTypeSuggestion[]
  activeIndex: number
  onSelect: (suggestion: SmartTypeSuggestion) => void
  onHover: (index: number) => void
}

export function SmartTypeMenu({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
}: SmartTypeMenuProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="smarttype-menu" role="listbox" aria-label="SmartType suggestions">
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
    </div>
  )
}
