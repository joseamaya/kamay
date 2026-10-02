import { describe, expect, it, vi } from 'vitest'

import { EventRegistry } from './eventRegistry'

describe('EventRegistry', () => {
  it('registers and dispatches handlers by kind and source', () => {
    const registry = new EventRegistry()
    let calls = 0

    registry.register('click', 'heroe1', () => {
      calls += 1
    })

    expect(registry.has('click', 'heroe1')).toBe(true)
    expect(registry.dispatch('click', 'heroe1')).toBe(true)
    expect(calls).toBe(1)
    expect(registry.dispatch('click', 'other')).toBe(false)
  })

  it('destroys handlers on clear', () => {
    const registry = new EventRegistry()
    const destroy = vi.fn()
    registry.register(
      'click',
      'heroe1',
      Object.assign(() => {}, { destroy }),
    )

    registry.clear()

    expect(destroy).toHaveBeenCalledOnce()
    expect(registry.dispatch('click', 'heroe1')).toBe(false)
  })
})
