import { describe, expect, it } from 'vitest'

import { emptyEvidence, withMisconception, withMissionDate, withPrediction } from './evidence'

describe('evidence reducers', () => {
  it('keeps the first date of a mission', () => {
    const first = withMissionDate(emptyEvidence(), 'first_object', '2026-01-01T00:00:00Z')
    const second = withMissionDate(first, 'first_object', '2026-02-01T00:00:00Z')

    expect(second.missionDates.first_object).toBe('2026-01-01T00:00:00Z')
  })

  it('dedupes misconceptions and tallies predictions', () => {
    let evidence = emptyEvidence()
    evidence = withMisconception(evidence, 'shared_state')
    evidence = withMisconception(evidence, 'shared_state')
    evidence = withPrediction(evidence, 'state', 'correct')

    expect(evidence.misconceptions).toEqual(['shared_state'])
    expect(evidence.predictions.state).toMatchObject({ correct: 1 })
  })
})
