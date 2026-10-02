import type { IDBPDatabase } from 'idb'

import type { KamayDB } from './db'
import type { ProjectRepository } from './types'

export function createRepository(db: IDBPDatabase<KamayDB>): ProjectRepository {
  return {
    list: async () => {
      const records = await db.getAll('projects')
      return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    get: async (id) => (await db.get('projects', id)) ?? null,
    save: async (record) => {
      await db.put('projects', record)
    },
    remove: async (id) => {
      await db.delete('projects', id)
    },
  }
}
