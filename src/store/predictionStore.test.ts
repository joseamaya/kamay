import { beforeEach, describe, expect, it } from 'vitest'

import type { PredictionScenario } from '../pedagogy'
import { usePredictionStore } from './predictionStore'
import { useProgressStore } from './progressStore'

const scenario: PredictionScenario = {
  objectName: 'perro1',
  className: 'Perro',
  attribute: 'energia',
  newValue: 20,
  siblingName: 'perro2',
  siblingValue: 50,
}

beforeEach(() => {
  usePredictionStore.getState().reset()
  useProgressStore.setState({ freeMode: false })
})

describe('predictionStore', () => {
  it('asks once per class and records the shared-state misconception', () => {
    usePredictionStore.getState().ask(scenario)
    expect(usePredictionStore.getState().pending).toEqual(scenario)

    usePredictionStore.getState().answer('changed')
    expect(usePredictionStore.getState().outcome).toBe('misconception')
    expect(usePredictionStore.getState().addressed).toContain('shared_state')

    usePredictionStore.getState().close()
    usePredictionStore.getState().ask(scenario)
    expect(usePredictionStore.getState().pending).toBeNull()
  })

  it('does not ask in free mode', () => {
    useProgressStore.setState({ freeMode: true })
    usePredictionStore.getState().ask(scenario)
    expect(usePredictionStore.getState().pending).toBeNull()
  })
})
