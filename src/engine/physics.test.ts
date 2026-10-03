import { describe, expect, it } from 'vitest'

import { PhysicsController } from './physics'
import type { Actor } from './types'

function actor(id: string, name: string, x: number, y: number): Actor {
  return {
    id,
    name,
    shape: 'circle',
    color: '#ffffff',
    transform: { position: { x, y }, rotation: 0, scale: 1 },
    zIndex: 0,
  }
}

describe('PhysicsController', () => {
  it('makes a body fall under gravity', async () => {
    const physics = new PhysicsController()
    const actors = [actor('a1', 'circle1', 0, 0)]
    physics.reset({ enabled: true, gravityY: -9.8 }, actors)
    await physics.ready()

    for (let frame = 0; frame < 60; frame += 1) physics.step(1 / 60, actors)

    expect(actors[0]!.transform.position.y).toBeLessThan(-1)
  })

  it('reports a contact between overlapping bodies', async () => {
    const physics = new PhysicsController()
    const actors = [actor('a1', 'circle1', 0, 0), actor('a2', 'circle2', 10, 0)]
    physics.reset({ enabled: true, gravityY: 0 }, actors)
    await physics.ready()

    for (let frame = 0; frame < 10; frame += 1) physics.step(1 / 60, actors)

    expect(physics.getCollisions().has('circle1|circle2')).toBe(true)
  })

  it('does nothing when disabled', () => {
    const physics = new PhysicsController()
    const actors = [actor('a1', 'circle1', 0, 0)]
    physics.reset({ enabled: false, gravityY: -9.8 }, actors)

    physics.step(1, actors)

    expect(actors[0]!.transform.position.y).toBe(0)
  })
})
