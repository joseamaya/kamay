import { beforeEach, describe, expect, it } from 'vitest'

import type { PredictionScenario } from '../pedagogy'
import { useEvidenceStore } from './evidenceStore'
import { usePredictionStore } from './predictionStore'
import { useProgressStore } from './progressStore'

const scenario: PredictionScenario = {
  concept: 'state',
  objectName: 'perro1',
  className: 'Perro',
  attribute: 'energia',
  newValue: 20,
  siblingName: 'perro2',
  siblingValue: 50,
}

beforeEach(() => {
  usePredictionStore.getState().reset()
  useEvidenceStore.getState().reset()
  useProgressStore.setState({ freeMode: false })
})

describe('predictionStore', () => {
  it('asks once per class and records the shared-state misconception as evidence', () => {
    usePredictionStore.getState().ask(scenario)
    expect(usePredictionStore.getState().pending).toEqual(scenario)

    usePredictionStore.getState().answer('changed')
    expect(usePredictionStore.getState().outcome).toBe('misconception')
    expect(useEvidenceStore.getState().misconceptions).toContain('shared_state')
    expect(useEvidenceStore.getState().predictions.state).toMatchObject({ misconception: 1 })

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
