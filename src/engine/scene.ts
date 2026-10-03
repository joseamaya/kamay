import { isActorShape, readNumber, readString } from '../model'
import type { ObjectInstance, Scene } from '../model'
import type { Actor, SceneState } from './types'

export const DEFAULT_SHAPE = 'circle'
export const DEFAULT_COLOR = '#e2603a'

export function toActor(object: ObjectInstance, zIndex: number): Actor {
  const shape = object.attributes.shape
  const glyph = readString(object.attributes, 'glyph', '')
  return {
    id: object.id,
    name: object.name,
    shape: isActorShape(shape) ? shape : DEFAULT_SHAPE,
    glyph: glyph || undefined,
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

export function toSceneState(scene: Scene): SceneState {
  return {
    background: scene.background,
    actors: scene.objects.map((object, index) => toActor(object, index)),
    physics: { enabled: scene.physics.enabled, gravityY: scene.physics.gravityY },
  }
}
