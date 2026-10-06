import {
  isActorShape,
  objectAppearance,
  resolveAttributeDefaults,
  sceneTransform,
  withDomainBases,
} from '../model'
import type { AttributeValue, ObjectInstance, ResolvedAppearance, Scene } from '../model'
import type { Actor, SceneState } from './types'

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
    physics: { enabled: scene.physics.enabled, gravityY: scene.physics.gravityY },
  }
}
