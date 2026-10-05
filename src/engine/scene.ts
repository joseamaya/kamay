import { isActorShape, objectAppearance, readNumber, readString } from '../model'
import type { ObjectInstance, ResolvedAppearance, Scene } from '../model'
import type { Actor, SceneState } from './types'

export const DEFAULT_SHAPE = 'circle'
export const DEFAULT_COLOR = '#e2603a'

export function toActor(
  object: ObjectInstance,
  zIndex: number,
  image: string | null = null,
): Actor {
  const shape = object.attributes.shape
  const glyph = readString(object.attributes, 'glyph', '')
  return {
    id: object.id,
    name: object.name,
    shape: isActorShape(shape) ? shape : DEFAULT_SHAPE,
    glyph: glyph || undefined,
    image: image ?? undefined,
    color: readString(object.attributes, 'color', DEFAULT_COLOR),
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
  const images = new Map(scene.classes.map((definition) => [definition.name, definition.image]))
  return {
    background: scene.background,
    actors: scene.objects.map((object, index) => {
      const actor = toActor(object, index, images.get(object.class) ?? null)
      return applyAppearance(actor, objectAppearance(scene, object))
    }),
    physics: { enabled: scene.physics.enabled, gravityY: scene.physics.gravityY },
  }
}
