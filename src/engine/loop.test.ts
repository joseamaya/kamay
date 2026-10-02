import { describe, expect, it } from 'vitest'

import { createLoop } from './loop'

describe('createLoop', () => {
  it('steps update and render with the given delta', () => {
    const updates: number[] = []
    let renders = 0
    const loop = createLoop({
      update: (delta) => updates.push(delta),
      render: () => (renders += 1),
    })

    loop.step(0.016)

    expect(updates).toEqual([0.016])
    expect(renders).toBe(1)
  })

  it('starts and stops with the injected frame scheduler', () => {
    const callbacks: FrameRequestCallback[] = []
    const loop = createLoop({
      update: () => {},
      render: () => {},
      requestFrame: (callback) => {
        callbacks.push(callback)
        return callbacks.length
      },
      cancelFrame: () => {},
    })

    loop.start()
    expect(loop.isRunning()).toBe(true)
    expect(callbacks).toHaveLength(1)

    callbacks[0]!(0)
    expect(callbacks).toHaveLength(2)

    loop.stop()
    expect(loop.isRunning()).toBe(false)
  })
})
