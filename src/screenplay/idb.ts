import { createDefaultTitlePage, type ScriptDocument, type TitlePageInfo } from './types'
import { pruneBlankElements } from './elementRules'
import { ACTIVE_SCRIPT_KEY, createSampleScript } from './sampleScript'

const DB_NAME = 'scenedesk'
const DB_VERSION = 1
const STORE_NAME = 'scripts'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode)
        const store = tx.objectStore(STORE_NAME)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
        tx.oncomplete = () => db.close()
      }),
  )
}

export function normalizeScriptDocument(
  raw: Partial<ScriptDocument> & { elements?: ScriptDocument['elements'] },
): ScriptDocument {
  const sample = createSampleScript()
  const title = raw.titlePage?.title || raw.title || sample.title
  const mergedTitlePage = {
    ...createDefaultTitlePage(title),
    ...(raw.titlePage ?? {}),
    title,
  }
  // Legacy default stored "Written by" as a real value — treat as placeholder-only.
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
      : sample.elements
  const elements = pruneBlankElements(rawElements)
  const elementIds = new Set(elements.map((el) => el.id))

  return {
    id: ACTIVE_SCRIPT_KEY,
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
    createdAt: raw.createdAt ?? sample.createdAt,
    updatedAt: raw.updatedAt ?? Date.now(),
  }
}

export async function loadActiveScript(): Promise<ScriptDocument> {
  try {
    const existing = await withStore<ScriptDocument | undefined>('readonly', (store) =>
      store.get(ACTIVE_SCRIPT_KEY),
    )
    if (existing && Array.isArray(existing.elements) && existing.elements.length > 0) {
      return normalizeScriptDocument(existing)
    }
  } catch {
    // Fall through to sample script
  }

  const sample = createSampleScript()
  sample.id = ACTIVE_SCRIPT_KEY
  try {
    await saveActiveScript(sample)
  } catch {
    // Still return in-memory sample if first write fails
  }
  return sample
}

export async function saveActiveScript(doc: ScriptDocument): Promise<void> {
  const payload = normalizeScriptDocument({
    ...doc,
    updatedAt: Date.now(),
  })
  await withStore('readwrite', (store) => store.put(payload))
}
