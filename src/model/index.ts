import { createId } from './ids'
import { migrateProject } from './migrations'
import { CURRENT_SCHEMA_VERSION, projectSchema } from './schema'
import type { Project, ProjectMeta, Scene } from './schema'

export * from './schema'
export * from './migrations'
export * from './factory'
export * from './attributes'
export * from './methods'
export { createId } from './ids'

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
