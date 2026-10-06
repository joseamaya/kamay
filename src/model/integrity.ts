import { DOMAIN_BASES } from './factory'
import type { Project, Scene } from './schema'

export type IntegrityIssueCode =
  | 'object_class_missing'
  | 'inherits_missing'
  | 'inheritance_cycle'
  | 'component_class_missing'
  | 'composition_cycle'
  | 'event_source_missing'
  | 'event_other_missing'
  | 'action_target_missing'
  | 'action_class_missing'

export interface IntegrityIssue {
  code: IntegrityIssueCode
  sceneId: string
  /** Name or id that could not be resolved. */
  detail: string
}

function classExists(scene: Scene, name: string): boolean {
  return name in DOMAIN_BASES || scene.classes.some((definition) => definition.name === name)
}

function objectExists(scene: Scene, ref: string): boolean {
  return scene.objects.some((object) => object.id === ref || object.name === ref)
}

function hasCycle(scene: Scene, edges: (name: string) => string[]): boolean {
  const byName = new Map(scene.classes.map((definition) => [definition.name, definition]))
  const state = new Map<string, 'visiting' | 'done'>()

  const visit = (name: string): boolean => {
    const current = state.get(name)
    if (current === 'visiting') return true
    if (current === 'done') return false
    state.set(name, 'visiting')
    for (const next of edges(name)) {
      if (byName.has(next) && visit(next)) return true
    }
    state.set(name, 'done')
    return false
  }

  for (const name of byName.keys()) {
    if (visit(name)) return true
  }
  return false
}

/**
 * Reports dangling references and cycles in a project, without rejecting it.
 * Used to warn on import/share instead of failing the load.
 */
export function validateProjectIntegrity(project: Project): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []

  for (const scene of project.scenes) {
    for (const object of scene.objects) {
      if (!classExists(scene, object.class)) {
        issues.push({ code: 'object_class_missing', sceneId: scene.id, detail: object.class })
      }
    }

    for (const definition of scene.classes) {
      if (definition.inherits && !classExists(scene, definition.inherits)) {
        issues.push({ code: 'inherits_missing', sceneId: scene.id, detail: definition.inherits })
      }
      for (const component of definition.components) {
        if (!classExists(scene, component.class)) {
          issues.push({
            code: 'component_class_missing',
            sceneId: scene.id,
            detail: component.class,
          })
        }
      }
    }

    if (
      hasCycle(scene, (name) => {
        const inherits = scene.classes.find((definition) => definition.name === name)?.inherits
        return inherits ? [inherits] : []
      })
    ) {
      issues.push({ code: 'inheritance_cycle', sceneId: scene.id, detail: '' })
    }

    if (
      hasCycle(scene, (name) => {
        const definition = scene.classes.find((candidate) => candidate.name === name)
        return definition ? definition.components.map((component) => component.class) : []
      })
    ) {
      issues.push({ code: 'composition_cycle', sceneId: scene.id, detail: '' })
    }

    for (const event of scene.events) {
      if (event.source && !objectExists(scene, event.source)) {
        issues.push({ code: 'event_source_missing', sceneId: scene.id, detail: event.source })
      }
      if (event.other && !objectExists(scene, event.other)) {
        issues.push({ code: 'event_other_missing', sceneId: scene.id, detail: event.other })
      }
      for (const action of event.actions) {
        if (action.kind === 'for_each') {
          if (!action.class || !classExists(scene, action.class)) {
            issues.push({
              code: 'action_class_missing',
              sceneId: scene.id,
              detail: action.class ?? '',
            })
          }
        } else if (!objectExists(scene, action.target)) {
          issues.push({ code: 'action_target_missing', sceneId: scene.id, detail: action.target })
        }
      }
    }
  }

  return issues
}
