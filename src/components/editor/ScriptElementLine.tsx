import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { formatElementText } from '@/screenplay/elementRules'
import type { ElementType, ScreenplayElement } from '@/screenplay/types'
import { ELEMENT_LABELS } from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

interface ScriptElementLineProps {
  element: ScreenplayElement
  isSelected: boolean
  shouldFocus: boolean
  characterNames: string[]
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = '0px'
  el.style.height = `${el.scrollHeight}px`
}

export function ScriptElementLine({
  element,
  isSelected,
  shouldFocus,
  characterNames,
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

  const isSingleLine =
    element.type === 'character' ||
    element.type === 'transition' ||
    element.type === 'sceneHeading' ||
    element.type === 'parenthetical'

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
    const formatted = formatElementText(element.type, element.text)
    if (formatted !== element.text) {
      updateElementText(element.id, formatted)
    }
  }, [element.id, element.text, element.type, updateElementText])

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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
    [cycleType, deleteElement, element.id, element.text, handleEnter, setElementType],
  )

  const listId = `character-suggest-${element.id}`
  const shared = {
    id: `el-${element.id}`,
    className: 'sp-element-input',
    value: element.text,
    onFocus: () => selectElement(element.id),
    onClick: () => selectElement(element.id),
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    onBlur,
    onKeyDown,
    placeholder: placeholderFor(element.type),
  }

  return (
    <div
      className={`sp-element sp-element--${element.type} ${isSelected ? 'is-selected' : ''}`.trim()}
      data-element-id={element.id}
      data-element-type={element.type}
    >
      <div className="sp-element-gutter" aria-hidden>
        <span className="sp-element-type">{shortLabel(element.type)}</span>
      </div>
      <label className="sr-only" htmlFor={`el-${element.id}`}>
        {ELEMENT_LABELS[element.type]}
      </label>
      {isSingleLine ? (
        <>
          <input
            {...shared}
            ref={inputRef}
            type="text"
            spellCheck={false}
            list={element.type === 'character' ? listId : undefined}
            autoComplete="off"
          />
          {element.type === 'character' ? (
            <datalist id={listId}>
              {characterNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          ) : null}
        </>
      ) : (
        <textarea
          {...shared}
          ref={textareaRef}
          rows={1}
          spellCheck={element.type === 'action' || element.type === 'dialogue'}
        />
      )}
    </div>
  )
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
