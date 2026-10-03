import { describe, expect, it, vi } from 'vitest'

import { backgroundFill, renderScene, sceneToScreen } from './renderer'
import type { SceneState } from './types'

function createMockContext() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    setLineDash: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
  }
}

describe('sceneToScreen', () => {
  it('maps the origin to the canvas center and flips Y', () => {
    expect(sceneToScreen({ x: 0, y: 0 }, { width: 100, height: 100 })).toEqual({ x: 50, y: 50 })
    expect(sceneToScreen({ x: 10, y: 20 }, { width: 100, height: 100 })).toEqual({ x: 60, y: 30 })
  })
})

describe('backgroundFill', () => {
  it('returns known colors and falls back to the first background', () => {
    expect(backgroundFill('night')).toBe('#2b2f45')
    expect(backgroundFill('unknown')).toBe(backgroundFill('grass'))
  })
})

describe('renderScene', () => {
  it('paints the background and draws every actor', () => {
    const ctx = createMockContext()
    const scene: SceneState = {
      background: 'grass',
      actors: [
        {
          id: 'a',
          name: 'a',
          shape: 'circle',
          color: '#ff0000',
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: 1 },
          zIndex: 0,
        },
      ],
    }

    renderScene(ctx as unknown as CanvasRenderingContext2D, scene, { width: 100, height: 100 })

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100)
    expect(ctx.arc).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
  })

  it('draws a glyph actor with text instead of a shape', () => {
    const ctx = createMockContext()
    const scene: SceneState = {
      background: 'grass',
      actors: [
        {
          id: 'a',
          name: 'cat1',
          shape: 'circle',
          glyph: '🐱',
          color: '#e0a23c',
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: 1 },
          zIndex: 0,
        },
      ],
    }

    renderScene(ctx as unknown as CanvasRenderingContext2D, scene, { width: 100, height: 100 })

    expect(ctx.fillText).toHaveBeenCalledWith('🐱', 0, 0)
    expect(ctx.arc).not.toHaveBeenCalled()
  })

  it('draws a sprite when its image is available', () => {
    const ctx = createMockContext()
    const scene: SceneState = {
      background: 'grass',
      actors: [
        {
          id: 'a',
          name: 'a',
          shape: 'circle',
          image: 'data:image/png;base64,abc',
          color: '#ffffff',
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: 1 },
          zIndex: 0,
        },
      ],
    }
    const image = { width: 64, height: 32 } as unknown as CanvasImageSource

    renderScene(ctx as unknown as CanvasRenderingContext2D, scene, {
      width: 100,
      height: 100,
      images: new Map([['data:image/png;base64,abc', image]]),
    })

    expect(ctx.drawImage).toHaveBeenCalled()
    expect(ctx.arc).not.toHaveBeenCalled()
  })

  it('paints themed backgrounds with a gradient', () => {
    const ctx = createMockContext()
    const scene: SceneState = { background: 'space', actors: [] }

    renderScene(ctx as unknown as CanvasRenderingContext2D, scene, { width: 100, height: 100 })

    expect(ctx.createLinearGradient).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalled()
  })

  it('draws polygon-based shapes', () => {
    const ctx = createMockContext()
    const scene: SceneState = {
      background: 'grass',
      actors: [
        {
          id: 'a',
          name: 'star1',
          shape: 'star',
          color: '#e0a23c',
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: 1 },
          zIndex: 0,
        },
      ],
    }

    renderScene(ctx as unknown as CanvasRenderingContext2D, scene, { width: 100, height: 100 })

    expect(ctx.moveTo).toHaveBeenCalled()
    expect(ctx.lineTo).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
  })
})
