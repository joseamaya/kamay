import { migrateProject } from './migrations'
import { CURRENT_SCHEMA_VERSION, projectSchema } from './schema'
import type { Project, ProjectMeta, Scene } from './schema'

export * from './schema'
export * from './migrations'

export function createId(prefix = 'id'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}-${random}`
}

export function createScene(name: string): Scene {
  return {
    id: createId('scene'),
    name,
    background: 'grass',
    classes: [],
    objects: [],
    events: [],
  }
}

export function createEmptyProject(meta: Partial<ProjectMeta> = {}): Project {
  return {
    version: CURRENT_SCHEMA_VERSION,
    meta: {
      name: meta.name ?? 'Proyecto sin título',
      author: meta.author ?? '',
      created: meta.created ?? new Date().toISOString(),
    },
    scenes: [createScene('Principal')],
  }
}

/**
 * Migrates and validates raw data (for example, imported JSON).
 * Returns a discriminated result so callers can surface clear Spanish errors.
 */
export function parseProject(input: unknown) {
  return projectSchema.safeParse(migrateProject(input))
}
