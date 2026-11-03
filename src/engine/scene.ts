import {
  isActorShape,
  objectAppearance,
  resolveAttributeDefaults,
  resolveAttributes,
  sceneTransform,
  withDomainBases,
} from '../model'
import type { AttributeValue, ObjectInstance, ResolvedAppearance, Scene } from '../model'
import type { Actor, SceneLink, SceneState } from './types'

export const DEFAULT_SHAPE = 'circle'
export const DEFAULT_COLOR = '#e2603a'

/** Transform comes from the simulation state plus the interpreted domain attributes. */
export function toActor(
  object: ObjectInstance,
  zIndex: number,
  attributes: Record<string, AttributeValue> = object.attributes,
): Actor {
  const scene = sceneTransform(object.simulation, attributes)
  return {
    id: object.id,
    name: object.name,
    shape: DEFAULT_SHAPE,
    color: DEFAULT_COLOR,
    transform: {
      position: { x: scene.x, y: scene.y },
      rotation: scene.rotation,
      scale: scene.scale,
    },
    zIndex,
  }
}

/** Overrides an actor's look with a resolved appearance. */
export function applyAppearance(actor: Actor, appearance: ResolvedAppearance): Actor {
  return {
    ...actor,
    glyph: appearance.glyph ?? undefined,
    image: appearance.image ?? undefined,
    color: appearance.color,
    shape: isActorShape(appearance.shape) ? appearance.shape : actor.shape,
  }
}

/** Reference links between scene objects, resolved by name or id. */
export function referenceLinks(scene: Scene): SceneLink[] {
  const links: SceneLink[] = []
  for (const object of scene.objects) {
    for (const attribute of resolveAttributes(scene, object.class)) {
      if (attribute.type !== 'reference') continue
      const target = object.attributes[attribute.name]
      if (typeof target !== 'string' || target.length === 0) continue
      const referenced = scene.objects.find(
        (candidate) => candidate.id === target || candidate.name === target,
      )
      if (!referenced || referenced.id === object.id) continue
      links.push({ from: object.id, to: referenced.id, label: attribute.name })
    }
  }
  return links
}

export function toSceneState(scene: Scene): SceneState {
  const resolved = withDomainBases(scene)
  return {
    background: scene.background,
    actors: scene.objects.map((object, index) => {
      const attributes = {
        ...resolveAttributeDefaults(resolved, object.class),
        ...object.attributes,
      }
      return applyAppearance(toActor(object, index, attributes), objectAppearance(scene, object))
    }),
    links: referenceLinks(resolved),
    physics: { enabled: scene.physics.enabled, gravityY: scene.physics.gravityY },
  }
}
