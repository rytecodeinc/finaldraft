import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { SmartTypeMenu } from '@/components/editor/SmartTypeMenu'
import { formatElementText } from '@/screenplay/elementRules'
import { getSmartTypeSuggestions, type SmartTypeSuggestion } from '@/screenplay/smartType'
import type { ElementType, ScreenplayElement } from '@/screenplay/types'
import { ELEMENT_LABELS } from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

interface ScriptElementLineProps {
  element: ScreenplayElement
  isSelected: boolean
  shouldFocus: boolean
  isFindMatch?: boolean
  showContinued?: boolean
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = '0px'
  el.style.height = `${el.scrollHeight}px`
}

export function ScriptElementLine({
  element,
  isSelected,
  shouldFocus,
  isFindMatch = false,
  showContinued = false,
}: ScriptElementLineProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateElementText = useScriptStore((s) => s.updateElementText)
  const selectElement = useScriptStore((s) => s.selectElement)
  const cycleType = useScriptStore((s) => s.cycleType)
  const handleEnter = useScriptStore((s) => s.handleEnter)
  const deleteElement = useScriptStore((s) => s.deleteElement)
  const setElementType = useScriptStore((s) => s.setElementType)
  const clearFocusRequest = useScriptStore((s) => s.clearFocusRequest)
  const elements = useScriptStore((s) => s.doc.elements)

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)

  const isSingleLine =
    element.type === 'character' ||
    element.type === 'transition' ||
    element.type === 'sceneHeading' ||
    element.type === 'parenthetical'

  const suggestions = useMemo(() => {
    if (
      element.type !== 'character' &&
      element.type !== 'transition' &&
      element.type !== 'sceneHeading'
    ) {
      return [] as SmartTypeSuggestion[]
    }
    return getSmartTypeSuggestions(element.type, element.text, elements, element.id)
  }, [element.id, element.text, element.type, elements])

  useLayoutEffect(() => {
    if (!isSingleLine && textareaRef.current) {
      autoResize(textareaRef.current)
    }
  }, [element.text, element.type, isSingleLine])

  useEffect(() => {
    if (!shouldFocus) return
    const node = isSingleLine ? inputRef.current : textareaRef.current
    if (!node) return
    node.focus()
    const len = node.value.length
    node.setSelectionRange(len, len)
    clearFocusRequest()
  }, [shouldFocus, clearFocusRequest, isSingleLine])

  useEffect(() => {
    setActiveSuggestion(0)
    setMenuOpen(suggestions.length > 0 && isSelected)
  }, [suggestions, isSelected, element.text])

  const applySuggestion = useCallback(
    (suggestion: SmartTypeSuggestion) => {
      updateElementText(element.id, suggestion.insertText)
      setMenuOpen(false)
      window.requestAnimationFrame(() => {
        const node = isSingleLine ? inputRef.current : textareaRef.current
        if (!node) return
        node.focus()
        const len = suggestion.insertText.length
        node.setSelectionRange(len, len)
      })
    },
    [element.id, isSingleLine, updateElementText],
  )

  const onChange = useCallback(
    (value: string) => {
      let next = value
      if (
        element.type === 'sceneHeading' ||
        element.type === 'character' ||
        element.type === 'transition'
      ) {
        next = value.toUpperCase()
      }
      updateElementText(element.id, next)
    },
    [element.id, element.type, updateElementText],
  )

  const onBlur = useCallback(() => {
    setMenuOpen(false)
    let text = element.text
    if (showContinued && element.type === 'character') {
      // Keep CONT'D as display-only; stored text stays clean
    }
    const formatted = formatElementText(element.type, text)
    if (formatted !== element.text) {
      updateElementText(element.id, formatted)
    }
  }, [element.id, element.text, element.type, showContinued, updateElementText])

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (menuOpen && suggestions.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setActiveSuggestion((i) => (i + 1) % suggestions.length)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setActiveSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length)
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          setMenuOpen(false)
          return
        }
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          applySuggestion(suggestions[activeSuggestion]!)
          return
        }
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault()
          applySuggestion(suggestions[activeSuggestion]!)
          return
        }
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        cycleType(element.id, event.shiftKey ? -1 : 1)
        return
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleEnter(element.id)
        return
      }

      if (event.key === 'Backspace' && element.text === '') {
        event.preventDefault()
        deleteElement(element.id)
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === '1') {
        event.preventDefault()
        setElementType(element.id, 'sceneHeading')
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === '2') {
        event.preventDefault()
        setElementType(element.id, 'action')
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === '3') {
        event.preventDefault()
        setElementType(element.id, 'character')
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === '4') {
        event.preventDefault()
        setElementType(element.id, 'dialogue')
      }
    },
    [
      activeSuggestion,
      applySuggestion,
      cycleType,
      deleteElement,
      element.id,
      element.text,
      handleEnter,
      menuOpen,
      setElementType,
      suggestions,
    ],
  )

  const displayValue =
    showContinued && element.type === 'character'
      ? withContd(element.text)
      : element.text

  const shared = {
    id: `el-${element.id}`,
    className: 'sp-element-input',
    value: displayValue,
    onFocus: () => {
      selectElement(element.id)
      if (suggestions.length > 0) setMenuOpen(true)
    },
    onClick: () => selectElement(element.id),
    onChange: (e: { target: { value: string } }) => {
      let next = e.target.value
      if (showContinued && element.type === 'character') {
        next = stripContd(next)
      }
      onChange(next)
    },
    onBlur,
    onKeyDown,
    placeholder: placeholderFor(element.type),
  }

  return (
    <div
      className={`sp-element sp-element--${element.type} ${isSelected ? 'is-selected' : ''} ${isFindMatch ? 'is-find-match' : ''}`.trim()}
      data-element-id={element.id}
      data-element-type={element.type}
    >
      <div className="sp-element-gutter" aria-hidden>
        <span className="sp-element-type">{shortLabel(element.type)}</span>
      </div>
      <div className="sp-element-main">
        <label className="sr-only" htmlFor={`el-${element.id}`}>
          {ELEMENT_LABELS[element.type]}
        </label>
        {isSingleLine ? (
          <input
            {...shared}
            ref={inputRef}
            type="text"
            spellCheck={false}
            autoComplete="off"
          />
        ) : (
          <textarea
            {...shared}
            ref={textareaRef}
            rows={1}
            spellCheck={element.type === 'action' || element.type === 'dialogue'}
          />
        )}
        {menuOpen && isSelected ? (
          <SmartTypeMenu
            suggestions={suggestions}
            activeIndex={activeSuggestion}
            onSelect={applySuggestion}
            onHover={setActiveSuggestion}
          />
        ) : null}
      </div>
    </div>
  )
}

function withContd(text: string): string {
  const clean = stripContd(text).trim()
  if (!clean) return "(CONT'D)"
  if (/\(CONT'D\)/i.test(text)) return text.toUpperCase()
  return `${clean} (CONT'D)`
}

function stripContd(text: string): string {
  return text.replace(/\s*\(CONT['’]?D\)\s*/gi, ' ').replace(/\s+/g, ' ').trim()
}

function shortLabel(type: ElementType): string {
  switch (type) {
    case 'sceneHeading':
      return 'Scene'
    case 'action':
      return 'Action'
    case 'character':
      return 'Char'
    case 'parenthetical':
      return 'Paren'
    case 'dialogue':
      return 'Dial'
    case 'transition':
      return 'Trans'
  }
}

function placeholderFor(type: ElementType): string {
  switch (type) {
    case 'sceneHeading':
      return 'INT. LOCATION - DAY'
    case 'action':
      return 'Describe the action…'
    case 'character':
      return 'CHARACTER'
    case 'parenthetical':
      return '(beat)'
    case 'dialogue':
      return 'Dialogue…'
    case 'transition':
      return 'CUT TO:'
  }
}
