import { beforeEach, describe, expect, it } from 'vitest'

import { useObservationsStore } from './observationsStore'

beforeEach(() => {
  useObservationsStore.getState().reset()
})

describe('observationsStore', () => {
  it('records the value before each change', () => {
    const store = useObservationsStore.getState()
    store.record({ target: 'a', name: 'x', value: 1 })
    store.record({ target: 'a', name: 'x', value: 2 })
    store.record({ target: 'a', name: 'x', value: 3 })

    const state = useObservationsStore.getState()
    expect(state.values.a?.x).toBe(3)
    expect(state.before.a?.x).toBe(2)
  })

  it('tracks independent objects in first-seen order', () => {
    const store = useObservationsStore.getState()
    store.record({ target: 'a', name: 'x', value: 1 })
    store.record({ target: 'b', name: 'x', value: 10 })

    const state = useObservationsStore.getState()
    expect(state.order).toEqual(['a', 'b'])
    expect(state.values.b?.x).toBe(10)
  })

  it('ignores a record that does not change the value', () => {
    const store = useObservationsStore.getState()
    store.record({ target: 'a', name: 'x', value: 1 })
    const snapshot = useObservationsStore.getState()
    store.record({ target: 'a', name: 'x', value: 1 })

    expect(useObservationsStore.getState()).toBe(snapshot)
  })
})
