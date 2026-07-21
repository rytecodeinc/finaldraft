import { createElement } from './elementRules'
import { createId } from './ids'
import {
  createDefaultProjectFields,
  createDefaultTitlePage,
  type Project,
  type ScriptDocument,
} from './types'

/** Legacy IndexedDB key from single-script era (migrated on load). */
export const LEGACY_ACTIVE_SCRIPT_KEY = 'active'

export function createSampleScript(projectId: string, scriptId?: string): ScriptDocument {
  const now = Date.now()
  const title = 'Untitled Screenplay'
  return {
    id: scriptId ?? createId('script'),
    projectId,
    title,
    format: 'feature',
    titlePage: {
      ...createDefaultTitlePage(title),
      authors: 'Your Name',
      contact: 'your@email.com\n(555) 555-5555',
      copyright: `© ${new Date().getFullYear()}`,
      revision: 'First Draft',
    },
    createdAt: now,
    updatedAt: now,
    comments: [],
    characterProfiles: [],
    elements: [
      createElement('sceneHeading', "INT. WRITER'S STUDY - NIGHT"),
      createElement(
        'action',
        'Rain ticks against the window. A desk lamp pools warm light over a blank page.',
      ),
      createElement('action', 'MAYA (30s) sits forward, fingers hovering above the keys.'),
      createElement('character', 'MAYA'),
      createElement('parenthetical', '(to herself)'),
      createElement(
        'dialogue',
        "Just one true scene. That's all. Something that feels like it was always waiting on the page.",
      ),
      createElement('action', 'She types. Deletes. Types again.'),
      createElement('character', 'MAYA'),
      createElement(
        'dialogue',
        "If I can hear it — really hear it — then maybe the rest will follow. One line. Then another. Then the cut that makes it cinema.",
      ),
      createElement('transition', 'CUT TO:'),
      createElement('sceneHeading', 'EXT. CITY STREET - DAWN'),
      createElement(
        'action',
        'The storm has passed. Maya walks with printed pages under her arm, smiling despite herself.',
      ),
      createElement('character', 'MAYA'),
      createElement('dialogue', 'Okay. That one stays.'),
    ],
  }
}

function buildProjectShell(
  name: string,
  script: ScriptDocument,
): Project {
  const now = Date.now()
  return {
    id: script.projectId,
    name,
    format: 'feature',
    scriptId: script.id,
    createdAt: now,
    updatedAt: now,
    ...createDefaultProjectFields(),
  }
}

/** First-run / migration seed with sample pages. */
export function createUntitledProject(): {
  project: Project
  script: ScriptDocument
} {
  const projectId = createId('proj')
  const scriptId = createId('script')
  const script = createSampleScript(projectId, scriptId)
  return {
    project: buildProjectShell('Untitled', script),
    script,
  }
}

/** Fresh project for the New Project action — empty writing surface. */
export function createBlankProject(name = 'Untitled Project'): {
  project: Project
  script: ScriptDocument
} {
  const now = Date.now()
  const projectId = createId('proj')
  const scriptId = createId('script')
  const title = 'Untitled Screenplay'
  const script: ScriptDocument = {
    id: scriptId,
    projectId,
    title,
    format: 'feature',
    titlePage: createDefaultTitlePage(title),
    createdAt: now,
    updatedAt: now,
    comments: [],
    characterProfiles: [],
    elements: [
      createElement('sceneHeading', 'INT. LOCATION - DAY'),
      createElement('action', ''),
    ],
  }
  return {
    project: buildProjectShell(name, script),
    script,
  }
}
