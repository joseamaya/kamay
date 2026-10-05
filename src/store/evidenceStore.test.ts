import { beforeEach, describe, expect, it } from 'vitest'

import { EVIDENCE_VERSION } from '../pedagogy'
import { selectEvidence, useEvidenceStore } from './evidenceStore'

beforeEach(() => {
  localStorage.clear()
  useEvidenceStore.getState().reset()
})

describe('evidenceStore', () => {
  it('records a misconception only once', () => {
    useEvidenceStore.getState().recordMisconception('shared_state')
    useEvidenceStore.getState().recordMisconception('shared_state')

    expect(useEvidenceStore.getState().misconceptions).toEqual(['shared_state'])
  })

  it('tallies prediction outcomes per concept', () => {
    useEvidenceStore.getState().recordPrediction('state', 'correct')
    useEvidenceStore.getState().recordPrediction('state', 'misconception')
    useEvidenceStore.getState().recordPrediction('state', 'correct')

    expect(useEvidenceStore.getState().predictions.state).toEqual({
      correct: 2,
      misconception: 1,
      explained: 0,
    })
  })

  it('records a mission date once', () => {
    useEvidenceStore.getState().recordMission('first_object')
    const first = useEvidenceStore.getState().missionDates.first_object
    expect(first).toBeTruthy()

    useEvidenceStore.getState().recordMission('first_object')
    expect(useEvidenceStore.getState().missionDates.first_object).toBe(first)
  })

  it('persists to localStorage', () => {
    useEvidenceStore.getState().recordMisconception('shared_state')

    const raw = localStorage.getItem('kamay.evidence')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { version: number; misconceptions: string[] }
    expect(parsed.version).toBe(EVIDENCE_VERSION)
    expect(parsed.misconceptions).toEqual(['shared_state'])
  })

  it('exposes only the durable fields for export', () => {
    useEvidenceStore.getState().recordMisconception('shared_state')

    expect(selectEvidence(useEvidenceStore.getState())).toEqual({
      version: EVIDENCE_VERSION,
      misconceptions: ['shared_state'],
      predictions: {},
      missionDates: {},
    })
  })
})
