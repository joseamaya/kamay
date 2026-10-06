import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type { AnalyticsRecord, DeliveryRecord, ProjectRecord } from './types'

export const DB_NAME = 'kamay'
export const DB_VERSION = 3

export interface KamayDB extends DBSchema {
  projects: {
    key: string
    value: ProjectRecord
  }
  deliveries: {
    key: string
    value: DeliveryRecord
  }
  analytics: {
    key: string
    value: AnalyticsRecord
  }
}

export function openKamayDb(): Promise<IDBPDatabase<KamayDB>> {
  return openDB<KamayDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('deliveries')) {
        db.createObjectStore('deliveries', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics', { keyPath: 'id' })
      }
    },
  })
}
