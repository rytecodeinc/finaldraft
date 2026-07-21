import type { ScriptDocument } from './types'
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

export async function loadActiveScript(): Promise<ScriptDocument> {
  try {
    const existing = await withStore<ScriptDocument | undefined>('readonly', (store) =>
      store.get(ACTIVE_SCRIPT_KEY),
    )
    if (existing && Array.isArray(existing.elements) && existing.elements.length > 0) {
      return {
        ...existing,
        id: ACTIVE_SCRIPT_KEY,
        format: 'feature',
      }
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
  const payload: ScriptDocument = {
    ...doc,
    id: ACTIVE_SCRIPT_KEY,
    format: 'feature',
    updatedAt: Date.now(),
  }
  await withStore('readwrite', (store) => store.put(payload))
}
