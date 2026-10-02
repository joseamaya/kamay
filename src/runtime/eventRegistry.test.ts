import { describe, expect, it, vi } from 'vitest'

import { EventRegistry } from './eventRegistry'

describe('EventRegistry', () => {
  it('registers and dispatches handlers by kind and source', () => {
    const registry = new EventRegistry()
    const handler = vi.fn()

    registry.register('click', 'heroe1', handler)

    expect(registry.has('click', 'heroe1')).toBe(true)
    expect(registry.dispatch('click', 'heroe1')).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
    expect(registry.dispatch('click', 'other')).toBe(false)
  })

  it('clears every handler', () => {
    const registry = new EventRegistry()
    registry.register('click', 'heroe1', vi.fn())

    registry.clear()

    expect(registry.dispatch('click', 'heroe1')).toBe(false)
  })
})
