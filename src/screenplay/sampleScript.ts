import { createElement } from './elementRules'
import type { ScriptDocument } from './types'

export const ACTIVE_SCRIPT_KEY = 'active'

export function createSampleScript(): ScriptDocument {
  const now = Date.now()
  return {
    id: 'script_active',
    title: 'Untitled Screenplay',
    format: 'feature',
    createdAt: now,
    updatedAt: now,
    elements: [
      createElement('sceneHeading', "INT. WRITER'S STUDY - NIGHT"),
      createElement(
        'action',
        'Rain ticks against the window. A desk lamp pools warm light over a blank page.',
      ),
      createElement('action', 'MAYA (30s) sits forward, fingers hovering above the keys.'),
      createElement('character', 'MAYA'),
      createElement('parenthetical', '(to herself)'),
      createElement('dialogue', "Just one true scene. That's all."),
      createElement('action', 'She types. Deletes. Types again.'),
      createElement('transition', 'CUT TO:'),
      createElement('sceneHeading', 'EXT. CITY STREET - DAWN'),
      createElement(
        'action',
        'The storm has passed. Maya walks with printed pages under her arm, smiling despite herself.',
      ),
    ],
  }
}
