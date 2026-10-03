import type { ActorShape } from '../model'
import type { Actor, Bubble, RenderOptions, SceneState, Vector2 } from './types'

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

const GLYPH_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'

function polygon(ctx: CanvasRenderingContext2D, sides: number, radius: number): void {
  for (let i = 0; i < sides; i += 1) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function star(ctx: CanvasRenderingContext2D, radius: number): void {
  const inner = radius * 0.42
  for (let i = 0; i < 10; i += 1) {
    const point = i % 2 === 0 ? radius : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const x = Math.cos(angle) * point
    const y = Math.sin(angle) * point
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function heart(ctx: CanvasRenderingContext2D, radius: number): void {
  const top = -radius * 0.6
  ctx.moveTo(0, radius * 0.8)
  ctx.bezierCurveTo(
    radius * 1.1,
    radius * 0.1,
    radius * 0.6,
    top - radius * 0.3,
    0,
    top + radius * 0.2,
  )
  ctx.bezierCurveTo(-radius * 0.6, top - radius * 0.3, -radius * 1.1, radius * 0.1, 0, radius * 0.8)
  ctx.closePath()
}

function drawShape(ctx: CanvasRenderingContext2D, shape: ActorShape, size: number): void {
  const radius = size / 2
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
  } else if (shape === 'square') {
    ctx.rect(-radius, -radius, size, size)
  } else if (shape === 'rectangle') {
    ctx.rect(-radius, -radius * 0.6, size, size * 0.6)
  } else if (shape === 'triangle') {
    polygon(ctx, 3, radius)
  } else if (shape === 'diamond') {
    polygon(ctx, 4, radius)
  } else if (shape === 'pentagon') {
    polygon(ctx, 5, radius)
  } else if (shape === 'hexagon') {
    polygon(ctx, 6, radius)
  } else if (shape === 'star') {
    star(ctx, radius)
  } else {
    heart(ctx, radius)
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
  if (actor.glyph) {
    ctx.font = `${ACTOR_SIZE}px ${GLYPH_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(actor.glyph, 0, 0)
  } else {
    drawShape(ctx, actor.shape, ACTOR_SIZE)
  }
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

export function renderBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  actors: Actor[],
  options: RenderOptions,
): void {
  for (const bubble of bubbles) {
    const actor = actors.find((candidate) => candidate.id === bubble.target)
    if (!actor) continue

    const screen = sceneToScreen(actor.transform.position, options)
    const padding = 8
    const height = 28

    ctx.save()
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const width = ctx.measureText(bubble.message).width + padding * 2
    const x = screen.x - width / 2
    const y = screen.y - (ACTOR_SIZE / 2) * Math.max(actor.transform.scale, 0.2) - height - 8

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#c2603a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#1f1a17'
    ctx.fillText(bubble.message, screen.x, y + height / 2)
    ctx.restore()
  }
}
