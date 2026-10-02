import { describe, expect, it } from 'vitest'

import { RuntimeController } from './runtime'
import type { SceneState } from './types'

const scene: SceneState = {
  background: 'grass',
  actors: [
    {
      id: 'a1',
      name: 'circle1',
      shape: 'circle',
      color: '#ff0000',
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: 1 },
      zIndex: 0,
    },
  ],
}

describe('RuntimeController', () => {
  it('adds a speech bubble on say', () => {
    const controller = new RuntimeController()
    controller.reset(scene)

    controller.apply({ type: 'say', target: 'circle1', message: 'hola' })

    expect(controller.getBubbles()).toHaveLength(1)
    expect(controller.getBubbles()[0]?.message).toBe('hola')
  })

  it('moves an actor towards the target over time', () => {
    const controller = new RuntimeController()
    controller.reset(scene)

    controller.apply({ type: 'move', target: 'circle1', x: 10, y: -5 })
    controller.update(0.3)
    const actor = controller.getActors()[0]!
    expect(actor.transform.position.x).toBeGreaterThan(0)

    controller.update(0.3)
    expect(actor.transform.position.x).toBeCloseTo(10)
    expect(actor.transform.position.y).toBeCloseTo(-5)
  })

  it('delays commands that follow a wait', () => {
    const controller = new RuntimeController()
    controller.reset(scene)

    controller.apply({ type: 'say', target: 'circle1', message: 'hola' })
    controller.apply({ type: 'wait', seconds: 1 })
    controller.apply({ type: 'say', target: 'circle1', message: 'adios' })

    expect(controller.getBubbles()[0]?.message).toBe('hola')

    controller.update(0.5)
    expect(controller.getBubbles()[0]?.message).toBe('hola')

    controller.update(0.6)
    expect(controller.getBubbles()[0]?.message).toBe('adios')
  })

  it('ignores negative waits', () => {
    const controller = new RuntimeController()
    controller.reset(scene)

    controller.apply({ type: 'wait', seconds: -5 })
    controller.apply({ type: 'say', target: 'circle1', message: 'hola' })

    expect(controller.getBubbles()[0]?.message).toBe('hola')
  })

  it('applies movement instantly when reduced motion is on', () => {
    const controller = new RuntimeController()
    controller.reset(scene)
    controller.setReducedMotion(true)

    controller.apply({ type: 'move', target: 'circle1', x: 10, y: -5 })

    const actor = controller.getActors()[0]!
    expect(actor.transform.position.x).toBe(10)
    expect(actor.transform.position.y).toBe(-5)
  })

  it('expires bubbles after their lifetime', () => {
    const controller = new RuntimeController()
    controller.reset(scene)

    controller.apply({ type: 'say', target: 'circle1', message: 'hola' })
    controller.update(3)

    expect(controller.getBubbles()).toHaveLength(0)
  })

  it('ignores commands for unknown targets', () => {
    const controller = new RuntimeController()
    controller.reset(scene)

    controller.apply({ type: 'say', target: 'missing', message: 'x' })

    expect(controller.getBubbles()).toHaveLength(0)
  })
})
