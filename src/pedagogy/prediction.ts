import { resolveAttributeDefaults, resolveAttributes, resolveCustomAttributes } from '../model'
import type { ObjectInstance, Scene } from '../model'
import type { ConceptId } from './concepts'

export type AttributeValue = number | string | boolean

export type PredictionChoice = 'changed' | 'unchanged' | 'unknown'
export type PredictionOutcome = 'correct' | 'misconception' | 'explained'

/** Two instances with independent state, or two objects sharing one reference. */
export type PredictionKind = 'independent' | 'shared'

export interface PredictionScenario {
  kind: PredictionKind
  concept: ConceptId
  objectName: string
  className: string
  attribute: string
  newValue: AttributeValue
  siblingName: string
  siblingValue: AttributeValue
  /** Reference attribute through which the sibling reaches the object (shared only). */
  siblingAttribute?: string
}

/**
 * An object that reaches `target` through a reference attribute, if any. It is
 * the shared-state counterpart of a sibling instance.
 */
function findReferenceHolder(
  scene: Scene,
  target: ObjectInstance,
): { holder: ObjectInstance; attribute: string } | null {
  for (const holder of scene.objects) {
    if (holder.id === target.id) continue
    for (const attribute of resolveAttributes(scene, holder.class)) {
      if (attribute.type !== 'reference') continue
      const value = holder.attributes[attribute.name]
      if (typeof value === 'string' && (value === target.name || value === target.id)) {
        return { holder, attribute: attribute.name }
      }
    }
  }
  return null
}

function buildSharedPrediction(
  scene: Scene,
  object: ObjectInstance,
  attribute: string,
  newValue: AttributeValue,
): PredictionScenario | null {
  const isCustom = resolveCustomAttributes(scene, object.class).some(
    (candidate) => candidate.name === attribute,
  )
  if (!isCustom) return null

  const reference = findReferenceHolder(scene, object)
  if (!reference) return null

  const defaults = resolveAttributeDefaults(scene, object.class)
  const siblingValue = object.attributes[attribute] ?? defaults[attribute] ?? 0
  if (siblingValue === newValue) return null

  return {
    kind: 'shared',
    concept: 'state',
    objectName: object.name,
    className: object.class,
    attribute,
    newValue,
    siblingName: reference.holder.name,
    siblingValue,
    siblingAttribute: reference.attribute,
  }
}

/**
 * Builds a prediction when a custom attribute changes:
 *
 * - `shared` when another object reaches this one through a reference, so the
 *   change is visible from both sides;
 * - `independent` when another instance of the same class exists, so the other
 *   one keeps its own state.
 *
 * Returns `null` when there is nothing to ask.
 */
export function buildPrediction(
  scene: Scene,
  object: ObjectInstance,
  attribute: string,
  newValue: AttributeValue,
): PredictionScenario | null {
  const shared = buildSharedPrediction(scene, object, attribute, newValue)
  if (shared) return shared

  const isCustom = resolveCustomAttributes(scene, object.class).some(
    (candidate) => candidate.name === attribute,
  )
  if (!isCustom) return null

  const sibling = scene.objects.find(
    (candidate) => candidate.class === object.class && candidate.id !== object.id,
  )
  if (!sibling) return null

  const defaults = resolveAttributeDefaults(scene, object.class)
  const siblingValue = sibling.attributes[attribute] ?? defaults[attribute] ?? 0
  if (siblingValue === newValue) return null

  return {
    kind: 'independent',
    concept: 'state',
    objectName: object.name,
    className: object.class,
    attribute,
    newValue,
    siblingName: sibling.name,
    siblingValue,
  }
}
