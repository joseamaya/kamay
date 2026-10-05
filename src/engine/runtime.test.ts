import { describe, expect, it } from 'vitest'

import { RuntimeController } from './runtime'
import type { SceneState } from './types'

function scene(): SceneState {
  return {
    background: 'grass',
    actors: [
      {
        id: 'a1',
        name: 'circle1',
        shape: 'circle',
        color: '#ffffff',
        transform: { position: { x: 0, y: 0 }, rotation: 0, scale: 1 },
        zIndex: 0,
      },
    ],
  }
}

describe('RuntimeController instant mode', () => {
  it('applies a move immediately when instant', () => {
    const controller = new RuntimeController()
    controller.reset(scene())
    controller.setInstant(true)

    controller.apply({ type: 'move', target: 'circle1', x: 50, y: 20 })

    expect(controller.getActors()[0]!.transform.position).toEqual({ x: 50, y: 20 })
  })

  it('animates a move with a tween when not instant', () => {
    const controller = new RuntimeController()
    controller.reset(scene())

    controller.apply({ type: 'move', target: 'circle1', x: 50, y: 20 })

    expect(controller.getActors()[0]!.transform.position).toEqual({ x: 0, y: 0 })
  })
})
