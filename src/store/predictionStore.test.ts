import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createScene, instantiateClass, upsertClass } from '../model'
import type { PredictionScenario } from '../pedagogy'
import { useEvidenceStore } from './evidenceStore'
import { askPredictionForAttribute, usePredictionStore } from './predictionStore'
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

  it('records a correction when the student retries', () => {
    usePredictionStore.getState().ask(scenario)
    usePredictionStore.getState().answer('changed')
    expect(useEvidenceStore.getState().predictions.state).toMatchObject({ misconception: 1 })

    usePredictionStore.getState().retry()
    expect(usePredictionStore.getState().outcome).toBeNull()

    usePredictionStore.getState().answer('unchanged')
    expect(usePredictionStore.getState().outcome).toBe('correct')
    expect(useEvidenceStore.getState().predictions.state).toMatchObject({
      misconception: 1,
      correct: 1,
    })
  })

  it('does not ask in free mode', () => {
    useProgressStore.setState({ freeMode: true })
    usePredictionStore.getState().ask(scenario)
    expect(usePredictionStore.getState().pending).toBeNull()
  })

  it('asks when an attribute changes through the shared helper', () => {
    const draft = createClassDraft('Perro')
    draft.attributes.push({ name: 'energia', type: 'number', initial: 50 })
    let scene = upsertClass(createScene('Principal'), draft)
    scene = instantiateClass(scene, draft.id)
    scene = instantiateClass(scene, draft.id)

    askPredictionForAttribute(scene, scene.objects[0]!, 'energia', 20)

    expect(usePredictionStore.getState().pending).toMatchObject({
      objectName: 'perro1',
      attribute: 'energia',
      newValue: 20,
    })
  })
})
