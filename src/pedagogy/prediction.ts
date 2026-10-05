import { resolveAttributeDefaults, resolveCustomAttributes } from '../model'
import type { ObjectInstance, Scene } from '../model'

export type AttributeValue = number | string | boolean

export interface PredictionScenario {
  objectName: string
  className: string
  attribute: string
  newValue: AttributeValue
  siblingName: string
  siblingValue: AttributeValue
}

/**
 * Builds a class-vs-object prediction when an instance changes a custom
 * attribute and another instance of the same class exists. Returns `null` when
 * there is nothing to ask (not a custom attribute, no sibling, or the sibling
 * already holds the new value).
 */
export function buildPrediction(
  scene: Scene,
  object: ObjectInstance,
  attribute: string,
  newValue: AttributeValue,
): PredictionScenario | null {
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
    objectName: object.name,
    className: object.class,
    attribute,
    newValue,
    siblingName: sibling.name,
    siblingValue,
  }
}
