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
import { resolveTabAction } from '@/screenplay/tabBehavior'
import type { ElementType, ScreenplayElement } from '@/screenplay/types'
import { ELEMENT_LABELS } from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

interface ScriptElementLineProps {
  element: ScreenplayElement
  isSelected: boolean
  shouldFocus: boolean
  isFindMatch?: boolean
  hasComment?: boolean
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
  hasComment = false,
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
  const rememberCaret = useScriptStore((s) => s.rememberCaret)
  const pruneBlankElements = useScriptStore((s) => s.pruneBlankElements)
  const focusCaret = useScriptStore((s) =>
    s.focusRequestId === element.id ? s.focusCaret : null,
  )
  const elements = useScriptStore((s) => s.doc.elements)

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [menuNavigated, setMenuNavigated] = useState(false)
  const suppressMenuRef = useRef(false)
  const armChainedMenuRef = useRef(false)

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

  const cyclingTypeRef = useRef(false)

  useLayoutEffect(() => {
    if (!isSingleLine && textareaRef.current) {
      autoResize(textareaRef.current)
    }
  }, [element.text, element.type, isSingleLine])

  // Restore focus after Tab type-cycles / undo / redo / page remounts.
  useLayoutEffect(() => {
    if (!shouldFocus) return
    const node = isSingleLine ? inputRef.current : textareaRef.current
    if (!node) return
    node.focus({ preventScroll: true })
    const len = node.value.length
    const start = focusCaret ? Math.min(focusCaret.start, len) : len
    const end = focusCaret ? Math.min(focusCaret.end, len) : len
    node.setSelectionRange(start, end)
    cyclingTypeRef.current = false
    clearFocusRequest()
  }, [shouldFocus, clearFocusRequest, isSingleLine, element.type, focusCaret])

  const syncCaret = useCallback(() => {
    const node = isSingleLine ? inputRef.current : textareaRef.current
    if (!node) return
    rememberCaret(element.id, {
      start: node.selectionStart ?? node.value.length,
      end: node.selectionEnd ?? node.value.length,
    })
  }, [element.id, isSingleLine, rememberCaret])

  useEffect(() => {
    setActiveSuggestion(0)
    if (suppressMenuRef.current) {
      suppressMenuRef.current = false
      armChainedMenuRef.current = false
      setMenuNavigated(false)
      setMenuOpen(false)
      return
    }
    const open = suggestions.length > 0 && isSelected
    setMenuOpen(open)
    // After INT/EXT or location accept, keep the next stage armed for Enter.
    if (armChainedMenuRef.current) {
      armChainedMenuRef.current = false
      setMenuNavigated(open)
      return
    }
    setMenuNavigated(false)
  }, [suggestions, isSelected, element.text])

  const applySuggestion = useCallback(
    (suggestion: SmartTypeSuggestion) => {
      // Scene headings are multi-step: INT/EXT → location → time.
      // Keep SmartType open for the next field when more options remain.
      const chainsNextField =
        element.type === 'sceneHeading' &&
        (suggestion.group === 'intExt' || suggestion.group === 'location')

      if (chainsNextField) {
        suppressMenuRef.current = false
        armChainedMenuRef.current = true
      } else {
        suppressMenuRef.current = true
        armChainedMenuRef.current = false
        setMenuOpen(false)
      }

      updateElementText(element.id, suggestion.insertText)
      setActiveSuggestion(0)

      window.requestAnimationFrame(() => {
        const node = isSingleLine ? inputRef.current : textareaRef.current
        if (!node) return
        node.focus()
        const len = suggestion.insertText.length
        node.setSelectionRange(len, len)
      })
    },
    [element.id, element.type, isSingleLine, updateElementText],
  )

  const applyTabText = useCallback(
    (nextText: string) => {
      updateElementText(element.id, nextText)
      setMenuOpen(true)
      window.requestAnimationFrame(() => {
        const node = isSingleLine ? inputRef.current : textareaRef.current
        if (!node) return
        node.focus()
        const len = nextText.length
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
    // Ignore blur caused by Tab remounting input/textarea during type cycle.
    if (cyclingTypeRef.current) return
    setMenuOpen(false)
    const formatted = formatElementText(element.type, element.text)
    if (formatted !== element.text) {
      updateElementText(element.id, formatted)
    }
    // Remove blank placeholders left behind, but keep the active writing line
    // (e.g. the empty element just created by Enter).
    window.requestAnimationFrame(() => {
      pruneBlankElements()
    })
  }, [element.id, element.text, element.type, pruneBlankElements, updateElementText])

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (event.key === 'ArrowDown' && menuOpen && suggestions.length > 0) {
        event.preventDefault()
        setMenuNavigated(true)
        setActiveSuggestion((i) => (i + 1) % suggestions.length)
        return
      }
      if (event.key === 'ArrowUp' && menuOpen && suggestions.length > 0) {
        event.preventDefault()
        setMenuNavigated(true)
        setActiveSuggestion(
          (i) => (i - 1 + suggestions.length) % suggestions.length,
        )
        return
      }
      if (event.key === 'Escape' && menuOpen) {
        event.preventDefault()
        setMenuOpen(false)
        setMenuNavigated(false)
        return
      }

      // Enter confirms the highlighted SmartType option whenever the menu is open.
      // Do not require prior arrow navigation — the first option is the default choice.
      if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        menuOpen &&
        suggestions.length > 0
      ) {
        event.preventDefault()
        applySuggestion(suggestions[activeSuggestion]!)
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        const action = resolveTabAction({
          elementType: element.type,
          text: element.text,
          shiftKey: event.shiftKey,
          elements,
        })

        if (action.kind === 'text') {
          applyTabText(action.text)
          return
        }
        if (action.kind === 'cycle') {
          cyclingTypeRef.current = true
          setMenuOpen(false)
          setMenuNavigated(false)
          cycleType(element.id, action.direction)
          return
        }
        return
      }

      // Enter without SmartType creates the next logical element (never cycles types).
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        setMenuOpen(false)
        // Prevent the outgoing blur prune from dropping the new empty line.
        cyclingTypeRef.current = true
        handleEnter(element.id)
        window.requestAnimationFrame(() => {
          cyclingTypeRef.current = false
        })
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
      applyTabText,
      cycleType,
      deleteElement,
      element.id,
      element.text,
      element.type,
      elements,
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
      // Caret updates after React applies the value; sync on next frame.
      window.requestAnimationFrame(() => syncCaret())
    },
    onSelect: () => syncCaret(),
    onKeyUp: () => syncCaret(),
    onBlur,
    onKeyDown,
    placeholder: placeholderFor(element.type),
  }

  return (
    <div
      className={`sp-element sp-element--${element.type} ${isSelected ? 'is-selected' : ''} ${isFindMatch ? 'is-find-match' : ''} ${hasComment ? 'has-comment' : ''}`.trim()}
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
            onHover={(index) => {
              setMenuNavigated(true)
              setActiveSuggestion(index)
            }}
            anchorRef={isSingleLine ? inputRef : textareaRef}
            insetRatio={
              element.type === 'character' || element.type === 'transition'
                ? 0.2
                : 0
            }
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
