import type { Project } from '../model'
import type { AnalyticsEvent } from '../pedagogy'
import type { Delivery } from './delivery'

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

/** A student delivery stored locally by teacher mode. */
export interface DeliveryRecord {
  id: string
  delivery: Delivery
}

/** The local, durable activity log (a single record). */
export interface AnalyticsRecord {
  id: string
  events: AnalyticsEvent[]
}
