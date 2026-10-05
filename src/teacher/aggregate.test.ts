import { describe, expect, it } from 'vitest'

import { createEmptyProject } from '../model'
import type { Delivery } from '../persistence'
import { aggregateDeliveries } from './aggregate'

function delivery(overrides: Partial<Delivery> = {}): Delivery {
  return {
    app: 'kamay',
    kind: 'entrega',
    exportedAt: '2026-01-01T00:00:00Z',
    project: createEmptyProject({ name: 'Demo' }),
    python: {},
    missions: { completed: [], total: 16 },
    rubric: [{ id: 'objects', status: 'introduced', count: 0 }],
    evidence: { version: 1, misconceptions: [], predictions: {}, missionDates: {} },
    ...overrides,
  }
}

describe('aggregateDeliveries', () => {
  it('aggregates concepts, misconceptions, predictions and missions', () => {
    const report = aggregateDeliveries([
      delivery({
        rubric: [{ id: 'objects', status: 'demonstrated', count: 2 }],
        evidence: {
          version: 1,
          misconceptions: ['shared_state'],
          predictions: { state: { correct: 2, misconception: 1, explained: 0 } },
          missionDates: {},
        },
        missions: { completed: ['first_object'], total: 16 },
      }),
      delivery({
        rubric: [{ id: 'objects', status: 'practiced', count: 1 }],
        evidence: {
          version: 1,
          misconceptions: ['shared_state', 'inheritance_for_reuse'],
          predictions: { state: { correct: 0, misconception: 0, explained: 1 } },
          missionDates: {},
        },
        missions: { completed: ['first_object', 'give_order'], total: 16 },
      }),
    ])

    expect(report.count).toBe(2)
    const objects = report.concepts.find((concept) => concept.id === 'objects')!
    expect(objects.demonstrated).toBe(1)
    expect(objects.practiced).toBe(1)
    expect(report.misconceptions.find((item) => item.id === 'shared_state')?.count).toBe(2)
    expect(report.predictions).toEqual({ correct: 2, total: 4 })
    expect(report.missionsCompleted).toBe(3)
  })

  it('returns an empty report for no deliveries', () => {
    const report = aggregateDeliveries([])

    expect(report.count).toBe(0)
    expect(report.concepts).toHaveLength(9)
    expect(report.misconceptions).toEqual([])
    expect(report.predictions).toEqual({ correct: 0, total: 0 })
  })
})
