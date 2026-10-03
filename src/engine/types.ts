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
  color: string
  transform: Transform
  zIndex: number
}

export interface SceneState {
  background: string
  actors: Actor[]
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
}
