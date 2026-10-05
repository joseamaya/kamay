import { readString } from './attributes'
import type { AttributeValue } from './attributes'
import { resolveAttributeDefaults } from './classroom'
import { isActorShape } from './factory'
import { createId } from './ids'
import type { ObjectInstance, Scene, VisualVariant } from './schema'

export const DEFAULT_SHAPE = 'circle'
export const DEFAULT_COLOR = '#e2603a'

/** The concrete look of an object after applying its matching variant. */
export interface ResolvedAppearance {
  glyph: string | null
  image: string | null
  color: string
  shape: string
}

export function newVisualVariant(attribute: string, value: AttributeValue): VisualVariant {
  return {
    id: createId('variant'),
    name: 'variante',
    when: [{ attribute, value }],
    glyph: null,
    image: null,
    color: null,
    shape: null,
  }
}

/** Own variants first, then inherited ones (a class can override a parent's). */
export function resolveVisualVariants(scene: Scene, className: string): VisualVariant[] {
  const result: VisualVariant[] = []
  const seen = new Set<string>()
  const visited = new Set<string>()
  let current: string | null = className

  while (current && !visited.has(current)) {
    visited.add(current)
    const definition = scene.classes.find((candidate) => candidate.name === current)
    if (!definition) break
    for (const variant of definition.visuals) {
      if (!seen.has(variant.id)) {
        seen.add(variant.id)
        result.push(variant)
      }
    }
    current = definition.inherits
  }

  return result
}

/** First variant whose conditions all hold against the given attributes. */
export function matchVisualVariant(
  variants: VisualVariant[],
  attributes: Record<string, AttributeValue>,
): VisualVariant | null {
  return (
    variants.find((variant) =>
      variant.when.every((condition) => attributes[condition.attribute] === condition.value),
    ) ?? null
  )
}

/**
 * The appearance an object should show right now: its base look (class defaults
 * plus object/runtime attributes) with the first matching variant applied.
 */
export function objectAppearance(
  scene: Scene,
  object: ObjectInstance,
  runtimeValues: Record<string, AttributeValue> = {},
): ResolvedAppearance {
  const attributes: Record<string, AttributeValue> = {
    ...resolveAttributeDefaults(scene, object.class),
    ...object.attributes,
    ...runtimeValues,
  }
  const definition = scene.classes.find((candidate) => candidate.name === object.class)

  const base: ResolvedAppearance = {
    glyph: readString(attributes, 'glyph', '') || null,
    image: definition?.image ?? null,
    color: readString(attributes, 'color', DEFAULT_COLOR),
    shape: isActorShape(attributes.shape) ? attributes.shape : DEFAULT_SHAPE,
  }

  const variant = matchVisualVariant(resolveVisualVariants(scene, object.class), attributes)
  if (!variant) return base

  return {
    glyph: variant.glyph ?? base.glyph,
    image: variant.image ?? base.image,
    color: variant.color ?? base.color,
    shape: variant.shape && isActorShape(variant.shape) ? variant.shape : base.shape,
  }
}
