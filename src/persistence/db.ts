import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type { ProjectRecord } from './types'

export const DB_NAME = 'kamay'
export const DB_VERSION = 1

export interface KamayDB extends DBSchema {
  projects: {
    key: string
    value: ProjectRecord
  }
}

export function openKamayDb(): Promise<IDBPDatabase<KamayDB>> {
  return openDB<KamayDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' })
      }
    },
  })
}
