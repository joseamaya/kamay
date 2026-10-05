import { BASE_CLASS, classCustomAttributes } from '../model'
import type { ClassDefinition, Scene } from '../model'
import type { MisconceptionId } from './concepts'

/** Names of the classes a class inherits from, up to (but excluding) `Actor`. */
function ancestorNames(scene: Scene, className: string | null): Set<string> {
  const names = new Set<string>()
  const visited = new Set<string>()
  let current = className

  while (current && current !== BASE_CLASS && !visited.has(current)) {
    visited.add(current)
    names.add(current)
    current = scene.classes.find((candidate) => candidate.name === current)?.inherits ?? null
  }

  return names
}

/**
 * Deterministic, model-based misconception detectors for a class draft. Only
 * situations that can be inferred reliably from the model are reported.
 */
export function detectMisconceptions(scene: Scene, definition: ClassDefinition): MisconceptionId[] {
  const result: MisconceptionId[] = []
  const base = definition.inherits
  const baseDefinition =
    base && base !== BASE_CLASS
      ? scene.classes.find((candidate) => candidate.name === base)
      : undefined

  if (baseDefinition) {
    const baseHasMembers =
      baseDefinition.methods.length > 0 || classCustomAttributes(baseDefinition).length > 0
    const addsNothing =
      definition.methods.length === 0 && classCustomAttributes(definition).length === 0
    if (baseHasMembers && addsNothing) result.push('inheritance_for_reuse')
  }

  const ancestors = ancestorNames(scene, base ?? null)
  if (definition.components.some((component) => ancestors.has(component.class))) {
    result.push('inheritance_vs_composition')
  }

  return result
}
