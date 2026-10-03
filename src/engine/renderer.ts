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
  { id: 'forest', color: '#8fbf87' },
  { id: 'desert', color: '#e0b06a' },
  { id: 'space', color: '#2b2f52' },
  { id: 'city', color: '#7d6b8a' },
]

export function backgroundFill(id: string): string {
  return BACKGROUNDS.find((background) => background.id === id)?.color ?? BACKGROUNDS[0]!.color
}

interface ThemedBackground {
  from: string
  to: string
  decorate?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
}

const STARS: [number, number][] = [
  [0.12, 0.2],
  [0.3, 0.12],
  [0.48, 0.28],
  [0.62, 0.1],
  [0.78, 0.24],
  [0.88, 0.42],
  [0.2, 0.44],
  [0.4, 0.5],
  [0.7, 0.48],
]

function drawHills(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#6fa86a'
  ctx.beginPath()
  ctx.arc(width * 0.3, height + height * 0.1, height * 0.4, Math.PI, 0)
  ctx.fill()
  ctx.fillStyle = '#5c9a58'
  ctx.beginPath()
  ctx.arc(width * 0.74, height + height * 0.15, height * 0.5, Math.PI, 0)
  ctx.fill()
}

function drawSun(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#ffd27a'
  ctx.beginPath()
  ctx.arc(width * 0.82, height * 0.22, Math.min(width, height) * 0.09, 0, Math.PI * 2)
  ctx.fill()
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#f4f1d0'
  for (const [x, y] of STARS) {
    ctx.beginPath()
    ctx.arc(x * width, y * height, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBuildings(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const columns = [0.05, 0.18, 0.3, 0.46, 0.6, 0.75, 0.88]
  const buildingWidth = width * 0.12
  const heights = columns.map((x) => height * (0.3 + ((x * 7) % 0.3)))
  ctx.fillStyle = '#3d3a52'
  columns.forEach((x, index) => {
    ctx.fillRect(x * width, height - heights[index]!, buildingWidth, heights[index]!)
  })
  ctx.fillStyle = '#ffd98a'
  columns.forEach((x, index) => {
    for (let row = 0; row < 3; row += 1) {
      const y = height - heights[index]! + 12 + row * 16
      ctx.fillRect(x * width + buildingWidth * 0.2, y, buildingWidth * 0.22, 6)
      ctx.fillRect(x * width + buildingWidth * 0.58, y, buildingWidth * 0.22, 6)
    }
  })
}

const THEMED_BACKGROUNDS: Record<string, ThemedBackground> = {
  forest: { from: '#dcead3', to: '#8fbf87', decorate: drawHills },
  desert: { from: '#f7e2b8', to: '#e0b06a', decorate: drawSun },
  space: { from: '#10122a', to: '#2b2f52', decorate: drawStars },
  city: { from: '#f6c9a8', to: '#7d6b8a', decorate: drawBuildings },
}

export function paintBackground(
  ctx: CanvasRenderingContext2D,
  id: string,
  width: number,
  height: number,
): void {
  const themed = THEMED_BACKGROUNDS[id]
  if (!themed) {
    ctx.fillStyle = backgroundFill(id)
    ctx.fillRect(0, 0, width, height)
    return
  }

  let fill: string | CanvasGradient = themed.from
  if (typeof ctx.createLinearGradient === 'function') {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, themed.from)
    gradient.addColorStop(1, themed.to)
    fill = gradient
  }
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, width, height)
  themed.decorate?.(ctx, width, height)
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

function drawSprite(ctx: CanvasRenderingContext2D, image: CanvasImageSource, size: number): void {
  const source = image as {
    width?: number
    height?: number
    naturalWidth?: number
    naturalHeight?: number
  }
  const naturalWidth = source.naturalWidth || source.width || size
  const naturalHeight = source.naturalHeight || source.height || size
  const scale = Math.min(size / naturalWidth, size / naturalHeight)
  const width = naturalWidth * scale
  const height = naturalHeight * scale
  ctx.drawImage(image, -width / 2, -height / 2, width, height)
}

function renderActor(ctx: CanvasRenderingContext2D, actor: Actor, options: RenderOptions): void {
  const screen = sceneToScreen(actor.transform.position, options)
  const image = actor.image ? options.images?.get(actor.image) : undefined
  ctx.save()
  ctx.translate(screen.x, screen.y)
  ctx.rotate((-actor.transform.rotation * Math.PI) / 180)
  ctx.scale(actor.transform.scale, actor.transform.scale)
  ctx.fillStyle = actor.color
  if (image) {
    drawSprite(ctx, image, ACTOR_SIZE)
  } else if (actor.glyph) {
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
  paintBackground(ctx, scene.background, options.width, options.height)

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
