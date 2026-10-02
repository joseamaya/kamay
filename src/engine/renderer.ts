import type { ActorShape } from '../model'
import type { Actor, RenderOptions, SceneState, Vector2 } from './types'

export const ACTOR_SIZE = 48

export interface BackgroundOption {
  id: string
  color: string
}

export const BACKGROUNDS: BackgroundOption[] = [
  { id: 'grass', color: '#dcead3' },
  { id: 'sky', color: '#dbeaf7' },
  { id: 'sunset', color: '#f7e3cd' },
  { id: 'night', color: '#2b2f45' },
]

export function backgroundFill(id: string): string {
  return BACKGROUNDS.find((background) => background.id === id)?.color ?? BACKGROUNDS[0]!.color
}

/** Scene coordinates: origin at the center, Y pointing up. */
export function sceneToScreen(
  position: Vector2,
  options: Pick<RenderOptions, 'width' | 'height'>,
): Vector2 {
  return {
    x: options.width / 2 + position.x,
    y: options.height / 2 - position.y,
  }
}

function drawShape(ctx: CanvasRenderingContext2D, shape: ActorShape, size: number): void {
  const radius = size / 2
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
  } else if (shape === 'square') {
    ctx.rect(-radius, -radius, size, size)
  } else {
    ctx.moveTo(0, -radius)
    ctx.lineTo(radius, radius)
    ctx.lineTo(-radius, radius)
    ctx.closePath()
  }
  ctx.fill()
}

function renderActor(ctx: CanvasRenderingContext2D, actor: Actor, options: RenderOptions): void {
  const screen = sceneToScreen(actor.transform.position, options)
  ctx.save()
  ctx.translate(screen.x, screen.y)
  ctx.rotate((-actor.transform.rotation * Math.PI) / 180)
  ctx.scale(actor.transform.scale, actor.transform.scale)
  ctx.fillStyle = actor.color
  drawShape(ctx, actor.shape, ACTOR_SIZE)
  ctx.restore()

  if (actor.id === options.selectedId) {
    const radius = (ACTOR_SIZE / 2) * Math.max(actor.transform.scale, 0.2) + 5
    ctx.save()
    ctx.strokeStyle = '#e2603a'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: SceneState,
  options: RenderOptions,
): void {
  ctx.clearRect(0, 0, options.width, options.height)
  ctx.fillStyle = backgroundFill(scene.background)
  ctx.fillRect(0, 0, options.width, options.height)

  const actors = [...scene.actors].sort((a, b) => a.zIndex - b.zIndex)
  for (const actor of actors) renderActor(ctx, actor, options)
}
