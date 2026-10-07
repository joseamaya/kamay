import { createId } from './ids'
import { migrateProject } from './migrations'
import { CURRENT_SCHEMA_VERSION, projectSchema } from './schema'
import type { Project, ProjectMeta, Scene } from './schema'

export * from './schema'
export * from './migrations'
export * from './factory'
export * from './classroom'
export * from './blocks'
export * from './blocksParser'
export * from './attributes'
export * from './methods'
export * from './visuals'
export * from './integrity'
export { createId } from './ids'

export function createScene(name: string): Scene {
  return {
    id: createId('scene'),
    name,
    background: 'grass',
    physics: { enabled: false, gravityY: -9.8 },
    classes: [],
    objects: [],
    orders: [],
  }
}

/** Suggests an unused scene name based on the current count. */
export function nextSceneName(project: Project): string {
  const base = 'Escena'
  const names = new Set(project.scenes.map((scene) => scene.name))
  let index = project.scenes.length + 1
  while (names.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export function renameScene(project: Project, sceneId: string, name: string): Project {
  return {
    ...project,
    scenes: project.scenes.map((scene) => (scene.id === sceneId ? { ...scene, name } : scene)),
  }
}

/** Removes a scene, keeping at least one in the project. */
export function removeScene(project: Project, sceneId: string): Project {
  if (project.scenes.length <= 1) return project
  return { ...project, scenes: project.scenes.filter((scene) => scene.id !== sceneId) }
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
