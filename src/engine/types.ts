/**
 * Canvas 2D engine contract.
 *
 * Phase 0 only defines the types; the game loop and rendering are implemented
 * in Phase 1.
 *
 * TODO(Phase 1): implement a `requestAnimationFrame` loop with fixed-step
 * updates, actor transforms and simple AABB/circle collisions.
 */

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
  class: string
  image: string | null
  transform: Transform
  zIndex: number
}

export interface SceneState {
  background: string
  actors: Actor[]
}

export interface Tween {
  objectId: string
  property: 'position' | 'rotation' | 'scale'
  from: number | Vector2
  to: number | Vector2
  duration: number
  elapsed: number
}

export interface Engine {
  mount: (canvas: HTMLCanvasElement) => void
  unmount: () => void
  loadScene: (state: SceneState) => void
  applyCommand: (command: import('../runtime/types').RuntimeCommand) => void
  update: (deltaSeconds: number) => void
  render: () => void
}
