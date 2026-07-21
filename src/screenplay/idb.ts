import { createId } from './ids'
import { pruneBlankElements } from './elementRules'
import {
  createUntitledProject,
  LEGACY_ACTIVE_SCRIPT_KEY,
} from './sampleScript'
import {
  createDefaultProjectFields,
  createDefaultTitlePage,
  createEmptyCharacterProfile,
  PROJECT_FORMATS,
  PROJECT_STATUSES,
  type CharacterProfile,
  type Project,
  type ProjectFormat,
  type ProjectStatus,
  type ScriptDocument,
  type TitlePageInfo,
  type WorkspaceMeta,
} from './types'

const DB_NAME = 'scenedesk'
const DB_VERSION = 2
const SCRIPTS_STORE = 'scripts'
const PROJECTS_STORE = 'projects'
const WORKSPACE_STORE = 'workspace'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SCRIPTS_STORE)) {
        db.createObjectStore(SCRIPTS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
        db.createObjectStore(WORKSPACE_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () =>
          reject(request.error ?? new Error('IndexedDB request failed'))
        tx.oncomplete = () => db.close()
      }),
  )
}

function withStores(
  storeNames: string[],
  mode: IDBTransactionMode,
  fn: (stores: Record<string, IDBObjectStore>) => void,
): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, mode)
        const stores: Record<string, IDBObjectStore> = {}
        for (const name of storeNames) {
          stores[name] = tx.objectStore(name)
        }
        try {
          fn(stores)
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
          return
        }
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () =>
          reject(tx.error ?? new Error('IndexedDB transaction failed'))
      }),
  )
}

export function normalizeScriptDocument(
  raw: Partial<ScriptDocument> & { elements?: ScriptDocument['elements'] },
  fallbackProjectId: string,
): ScriptDocument {
  const title =
    raw.titlePage?.title || raw.title || 'Untitled Screenplay'
  const mergedTitlePage = {
    ...createDefaultTitlePage(title),
    ...(raw.titlePage ?? {}),
    title,
  }
  const titlePage: TitlePageInfo = {
    ...mergedTitlePage,
    credit:
      mergedTitlePage.credit.trim().toLowerCase() === 'written by'
        ? ''
        : mergedTitlePage.credit,
  }

  const rawElements =
    Array.isArray(raw.elements) && raw.elements.length > 0
      ? raw.elements
      : createUntitledProject().script.elements
  const elements = pruneBlankElements(rawElements)
  const elementIds = new Set(elements.map((el) => el.id))
  const projectId =
    typeof raw.projectId === 'string' && raw.projectId.length > 0
      ? raw.projectId
      : fallbackProjectId
  const id =
    typeof raw.id === 'string' &&
    raw.id.length > 0 &&
    raw.id !== LEGACY_ACTIVE_SCRIPT_KEY
      ? raw.id
      : createId('script')

  const characterProfiles: CharacterProfile[] = Array.isArray(
    raw.characterProfiles,
  )
    ? raw.characterProfiles
        .filter(
          (profile): profile is CharacterProfile =>
            typeof profile?.name === 'string' &&
            profile.name.trim().length > 0,
        )
        .map((profile) => ({
          ...createEmptyCharacterProfile(profile.name),
          aliases: typeof profile.aliases === 'string' ? profile.aliases : '',
          role: typeof profile.role === 'string' ? profile.role : '',
          ageRange: typeof profile.ageRange === 'string' ? profile.ageRange : '',
          gender: typeof profile.gender === 'string' ? profile.gender : '',
          castingNotes:
            typeof profile.castingNotes === 'string' ? profile.castingNotes : '',
          wardrobeNotes:
            typeof profile.wardrobeNotes === 'string'
              ? profile.wardrobeNotes
              : '',
          relationshipNotes:
            typeof profile.relationshipNotes === 'string'
              ? profile.relationshipNotes
              : '',
          arcNotes: typeof profile.arcNotes === 'string' ? profile.arcNotes : '',
          notes: typeof profile.notes === 'string' ? profile.notes : '',
          productionNotes:
            typeof profile.productionNotes === 'string'
              ? profile.productionNotes
              : '',
        }))
    : []

  return {
    id,
    projectId,
    title,
    format: 'feature',
    titlePage,
    elements,
    comments: Array.isArray(raw.comments)
      ? raw.comments
          .map((comment) => {
            const startOffset =
              typeof comment.startOffset === 'number' &&
              Number.isFinite(comment.startOffset)
                ? Math.max(0, Math.floor(comment.startOffset))
                : undefined
            const endOffset =
              typeof comment.endOffset === 'number' &&
              Number.isFinite(comment.endOffset)
                ? Math.max(0, Math.floor(comment.endOffset))
                : undefined
            const quote =
              typeof comment.quote === 'string' && comment.quote.length > 0
                ? comment.quote
                : undefined
            return {
              ...comment,
              resolved: Boolean(comment.resolved),
              startOffset,
              endOffset,
              quote,
            }
          })
          .filter((comment) => elementIds.has(comment.elementId))
      : [],
    characterProfiles,
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
  }
}

function normalizeProjectFormat(value: unknown): ProjectFormat {
  return PROJECT_FORMATS.includes(value as ProjectFormat)
    ? (value as ProjectFormat)
    : 'feature'
}

function normalizeProjectStatus(value: unknown): ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus)
    ? (value as ProjectStatus)
    : 'drafting'
}

function normalizeProject(
  raw: Partial<Project>,
  scriptId: string,
): Project {
  const now = Date.now()
  const defaults = createDefaultProjectFields()
  return {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : createId('proj'),
    name:
      typeof raw.name === 'string' && raw.name.trim().length > 0
        ? raw.name.trim()
        : 'Untitled',
    format: normalizeProjectFormat(raw.format),
    scriptId,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    genre: typeof raw.genre === 'string' ? raw.genre : defaults.genre,
    status: normalizeProjectStatus(raw.status),
    coverImage:
      typeof raw.coverImage === 'string' ? raw.coverImage : defaults.coverImage,
    author: typeof raw.author === 'string' ? raw.author : defaults.author,
    writingGoals:
      typeof raw.writingGoals === 'string'
        ? raw.writingGoals
        : defaults.writingGoals,
    targetPages:
      typeof raw.targetPages === 'number' &&
      Number.isFinite(raw.targetPages) &&
      raw.targetPages > 0
        ? Math.floor(raw.targetPages)
        : 0,
    notes: typeof raw.notes === 'string' ? raw.notes : defaults.notes,
  }
}

async function getAllScripts(): Promise<ScriptDocument[]> {
  const rows = await withStore<ScriptDocument[]>(SCRIPTS_STORE, 'readonly', (store) =>
    store.getAll(),
  )
  return Array.isArray(rows) ? rows : []
}

async function getAllProjects(): Promise<Project[]> {
  const rows = await withStore<Project[]>(PROJECTS_STORE, 'readonly', (store) =>
    store.getAll(),
  )
  return Array.isArray(rows) ? rows : []
}

async function getWorkspaceMeta(): Promise<WorkspaceMeta | undefined> {
  return withStore<WorkspaceMeta | undefined>(WORKSPACE_STORE, 'readonly', (store) =>
    store.get('workspace'),
  )
}

export interface LoadedWorkspace {
  project: Project
  script: ScriptDocument
  projects: Project[]
}

/**
 * Load the active project + script, migrating the legacy single-script DB if needed.
 */
export async function loadWorkspace(): Promise<LoadedWorkspace> {
  let projects = await getAllProjects()
  let scripts = await getAllScripts()
  let meta = await getWorkspaceMeta()

  // Migrate legacy `scripts['active']` → Untitled project + one script.
  const legacy = scripts.find((s) => s.id === LEGACY_ACTIVE_SCRIPT_KEY)
  if (projects.length === 0) {
    if (legacy && Array.isArray(legacy.elements) && legacy.elements.length > 0) {
      const projectId = createId('proj')
      const scriptId = createId('script')
      const script = normalizeScriptDocument(
        { ...legacy, id: scriptId, projectId },
        projectId,
      )
      const project = normalizeProject(
        {
          name: script.title.trim() || 'Untitled',
          createdAt: script.createdAt,
          updatedAt: script.updatedAt,
        },
        scriptId,
      )
      project.id = projectId

      await withStores(
        [SCRIPTS_STORE, PROJECTS_STORE, WORKSPACE_STORE],
        'readwrite',
        (stores) => {
          stores[SCRIPTS_STORE]!.put(script)
          stores[SCRIPTS_STORE]!.delete(LEGACY_ACTIVE_SCRIPT_KEY)
          stores[PROJECTS_STORE]!.put(project)
          stores[WORKSPACE_STORE]!.put({
            id: 'workspace',
            activeProjectId: project.id,
          } satisfies WorkspaceMeta)
        },
      )

      projects = [project]
      scripts = [script]
      meta = { id: 'workspace', activeProjectId: project.id }
    } else {
      const { project, script } = createUntitledProject()
      await withStores(
        [SCRIPTS_STORE, PROJECTS_STORE, WORKSPACE_STORE],
        'readwrite',
        (stores) => {
          stores[SCRIPTS_STORE]!.put(script)
          stores[PROJECTS_STORE]!.put(project)
          stores[WORKSPACE_STORE]!.put({
            id: 'workspace',
            activeProjectId: project.id,
          } satisfies WorkspaceMeta)
        },
      )
      projects = [project]
      scripts = [script]
      meta = { id: 'workspace', activeProjectId: project.id }
    }
  }

  const activeId =
    meta?.activeProjectId && projects.some((p) => p.id === meta.activeProjectId)
      ? meta.activeProjectId
      : projects[0]!.id

  const project = projects.find((p) => p.id === activeId) ?? projects[0]!
  let script = scripts.find((s) => s.id === project.scriptId)

  if (!script || !Array.isArray(script.elements) || script.elements.length === 0) {
    script = normalizeScriptDocument(
      { projectId: project.id, id: project.scriptId },
      project.id,
    )
    script.id = project.scriptId
    await withStore(SCRIPTS_STORE, 'readwrite', (store) => store.put(script!))
  } else {
    script = normalizeScriptDocument(script, project.id)
  }

  if (meta?.activeProjectId !== project.id) {
    await withStore(WORKSPACE_STORE, 'readwrite', (store) =>
      store.put({
        id: 'workspace',
        activeProjectId: project.id,
      } satisfies WorkspaceMeta),
    )
  }

  return {
    project: normalizeProject(project, script.id),
    script,
    projects: projects.map((p) =>
      normalizeProject(p, p.scriptId || script!.id),
    ),
  }
}

export async function saveScriptDocument(doc: ScriptDocument): Promise<ScriptDocument> {
  const payload = normalizeScriptDocument(
    { ...doc, updatedAt: Date.now() },
    doc.projectId,
  )
  await withStore(SCRIPTS_STORE, 'readwrite', (store) => store.put(payload))
  return payload
}

export async function saveProject(project: Project): Promise<void> {
  await withStore(PROJECTS_STORE, 'readwrite', (store) =>
    store.put({ ...project, updatedAt: Date.now() }),
  )
}

export async function setActiveProjectId(projectId: string): Promise<void> {
  await withStore(WORKSPACE_STORE, 'readwrite', (store) =>
    store.put({
      id: 'workspace',
      activeProjectId: projectId,
    } satisfies WorkspaceMeta),
  )
}

export async function listProjects(): Promise<Project[]> {
  const projects = await getAllProjects()
  return projects
    .map((p) => normalizeProject(p, p.scriptId))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Load a project + its script without changing the active workspace. */
export async function loadProjectBundle(
  projectId: string,
): Promise<{ project: Project; script: ScriptDocument } | null> {
  const projects = await getAllProjects()
  const rawProject = projects.find((p) => p.id === projectId)
  if (!rawProject) return null

  const project = normalizeProject(rawProject, rawProject.scriptId)
  const scripts = await getAllScripts()
  let script = scripts.find((s) => s.id === project.scriptId)

  if (!script || !Array.isArray(script.elements) || script.elements.length === 0) {
    script = normalizeScriptDocument(
      { projectId: project.id, id: project.scriptId },
      project.id,
    )
    script.id = project.scriptId
  } else {
    script = normalizeScriptDocument(script, project.id)
  }

  return { project, script }
}

/** @deprecated Use loadWorkspace / saveScriptDocument */
export async function loadActiveScript(): Promise<ScriptDocument> {
  const { script } = await loadWorkspace()
  return script
}

/** @deprecated Use saveScriptDocument */
export async function saveActiveScript(doc: ScriptDocument): Promise<void> {
  await saveScriptDocument(doc)
}
