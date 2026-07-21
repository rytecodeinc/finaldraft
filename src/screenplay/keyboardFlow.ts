import type { ElementType } from './types'

/**
 * Enter creates the next logical screenplay element (Final Draft–style).
 */
export const ENTER_NEXT_TYPE: Record<ElementType, ElementType> = {
  sceneHeading: 'action',
  action: 'action',
  character: 'dialogue',
  parenthetical: 'dialogue',
  dialogue: 'action',
  transition: 'sceneHeading',
}

/**
 * Tab type cycle when not in SmartType / field-advance mode.
 * Order mirrors Final Draft: Action → Character → Dialogue → Parenthetical…
 */
export const TAB_TYPE_ORDER: ElementType[] = [
  'sceneHeading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
]

export function cycleTabElementType(
  type: ElementType,
  direction: 1 | -1 = 1,
): ElementType {
  const index = TAB_TYPE_ORDER.indexOf(type)
  const from = index >= 0 ? index : 0
  const next = (from + direction + TAB_TYPE_ORDER.length) % TAB_TYPE_ORDER.length
  return TAB_TYPE_ORDER[next]!
}
