import { isActorShape, objectAppearance, readNumber } from '../model'
import type { ObjectInstance, ResolvedAppearance, Scene } from '../model'
import type { Actor, SceneState } from './types'

export const DEFAULT_SHAPE = 'circle'
export const DEFAULT_COLOR = '#e2603a'

/** Transform comes from the domain state; appearance is applied separately. */
export function toActor(object: ObjectInstance, zIndex: number): Actor {
  return {
    id: object.id,
    name: object.name,
    shape: DEFAULT_SHAPE,
    color: DEFAULT_COLOR,
    transform: {
      position: {
        x: readNumber(object.attributes, 'x', 0),
        y: readNumber(object.attributes, 'y', 0),
      },
      rotation: readNumber(object.attributes, 'rotation', 0),
      scale: readNumber(object.attributes, 'scale', 1),
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
  return {
    background: scene.background,
    actors: scene.objects.map((object, index) =>
      applyAppearance(toActor(object, index), objectAppearance(scene, object)),
    ),
    physics: { enabled: scene.physics.enabled, gravityY: scene.physics.gravityY },
  }
}
