import type { AttributeValue } from './attributes'
import { fullClassAncestry, resolveAttributeDefaults } from './classroom'
import { DOMAIN_BASES, isActorShape, withDomainBases } from './factory'
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

/** Class defaults merged with the object's own and observed runtime values. */
export function resolveObjectAttributes(
  scene: Scene,
  object: ObjectInstance,
  runtimeValues: Record<string, AttributeValue> = {},
): Record<string, AttributeValue> {
  const resolved = withDomainBases(scene)
  return {
    ...resolveAttributeDefaults(resolved, object.class),
    ...object.attributes,
    ...runtimeValues,
  }
}

/** Base appearance of a class, nearest non-null value winning along the ancestry. */
function resolveClassAppearance(
  scene: Scene,
  className: string,
): { color: string | null; shape: string | null; glyph: string | null; image: string | null } {
  const result: {
    color: string | null
    shape: string | null
    glyph: string | null
    image: string | null
  } = { color: null, shape: null, glyph: null, image: null }

  for (const name of fullClassAncestry(scene, className)) {
    const definition =
      scene.classes.find((candidate) => candidate.name === name) ?? DOMAIN_BASES[name]
    if (!definition) continue
    const appearance = definition.appearance
    if (result.color === null && appearance.color !== null) result.color = appearance.color
    if (result.shape === null && appearance.shape !== null) result.shape = appearance.shape
    if (result.glyph === null && appearance.glyph !== null) result.glyph = appearance.glyph
    if (result.image === null && definition.image !== null) result.image = definition.image
  }

  return result
}

/**
 * The appearance an object shows right now: the class's base look plus the first
 * matching state variant. Appearance belongs to the simulation, not to the
 * domain, and is defined only on the class.
 */
export function objectAppearance(
  scene: Scene,
  object: ObjectInstance,
  runtimeValues: Record<string, AttributeValue> = {},
): ResolvedAppearance {
  const resolved = withDomainBases(scene)
  const attributes = resolveObjectAttributes(scene, object, runtimeValues)
  const chain = resolveClassAppearance(resolved, object.class)

  const base: ResolvedAppearance = {
    glyph: chain.glyph,
    image: chain.image,
    color: chain.color ?? DEFAULT_COLOR,
    shape: isActorShape(chain.shape) ? chain.shape : DEFAULT_SHAPE,
  }

  const variant = matchVisualVariant(resolveVisualVariants(resolved, object.class), attributes)
  if (!variant) return base

  return {
    glyph: variant.glyph ?? base.glyph,
    image: variant.image ?? base.image,
    color: variant.color ?? base.color,
    shape: variant.shape && isActorShape(variant.shape) ? variant.shape : base.shape,
  }
}
