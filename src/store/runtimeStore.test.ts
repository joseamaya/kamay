import { beforeEach, describe, expect, it } from 'vitest'

import { createStepQueue } from '../runtime/steps'
import { useRuntimeStore } from './runtimeStore'

beforeEach(() => {
  useRuntimeStore.setState({ stepMode: false, stepQueue: createStepQueue() })
})

describe('runtimeStore step mode', () => {
  it('queues messages, advances the cursor and resets', () => {
    useRuntimeStore.getState().setStepMode(true)
    useRuntimeStore.getState().enqueueStep({ type: 'say', target: 'a', message: 'hola' })
    useRuntimeStore.getState().enqueueStep({ type: 'say', target: 'a', message: 'adios' })

    expect(useRuntimeStore.getState().stepMode).toBe(true)
    expect(useRuntimeStore.getState().stepQueue.steps).toHaveLength(2)
    expect(useRuntimeStore.getState().stepQueue.cursor).toBe(0)

    useRuntimeStore.getState().advanceStep()
    expect(useRuntimeStore.getState().stepQueue.cursor).toBe(1)

    useRuntimeStore.getState().resetSteps()
    expect(useRuntimeStore.getState().stepQueue).toEqual(createStepQueue())
  })
})
