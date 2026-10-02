import type { Project } from '../model'

/**
 * Persistence contract: IndexedDB for autosave plus file export/import.
 *
 * Phase 0 only defines the types; the implementation lands in Phase 1.
 *
 * TODO(Phase 1): implement an IndexedDB repository and `.kamay.json` export.
 */

export interface ProjectRecord {
  id: string
  name: string
  updatedAt: string
  project: Project
}

export interface ProjectRepository {
  list: () => Promise<ProjectRecord[]>
  get: (id: string) => Promise<ProjectRecord | null>
  save: (record: ProjectRecord) => Promise<void>
  remove: (id: string) => Promise<void>
  exportToFile: (project: Project) => Blob
  importFromFile: (file: File) => Promise<Project>
}
