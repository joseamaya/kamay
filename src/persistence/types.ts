import type { Project } from '../model'

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
}
