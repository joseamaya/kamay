import type { PhysicsConfig } from '../model'
import type { ActorShape } from '../model/factory'

export interface Vector2 {
  x: number
  y: number
}

export interface Transform {
  position: Vector2
  rotation: number
  scale: number
}

export interface Actor {
  id: string
  name: string
  shape: ActorShape
  glyph?: string
  image?: string
  color: string
  transform: Transform
  zIndex: number
}

/** A reference held by an object, drawn as an arrow between two actors. */
export interface SceneLink {
  /** Actor id of the holder. */
  from: string
  /** Actor id of the referenced object. */
  to: string
  /** Attribute name through which the reference is held. */
  label: string
}

export interface SceneState {
  background: string
  actors: Actor[]
  links?: SceneLink[]
  physics?: PhysicsConfig
}

export interface Bubble {
  target: string
  message: string
  ttl: number
}

export interface RenderOptions {
  width: number
  height: number
  selectedId?: string | null
  images?: Map<string, CanvasImageSource>
}
