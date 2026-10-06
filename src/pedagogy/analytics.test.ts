import { describe, expect, it } from 'vitest'

import { conceptActivity, errorsByType, summarizeAnalytics } from './analytics'
import type { AnalyticsEvent } from './analytics'

const events: AnalyticsEvent[] = [
  { type: 'mission', at: '2026-01-01T10:00:00Z', concept: 'class' },
  { type: 'prediction', at: '2026-01-01T10:05:00Z', concept: 'state', detail: 'correct' },
  { type: 'error', at: '2026-01-01T10:06:00Z', detail: 'NameError' },
  { type: 'error', at: '2026-01-01T10:07:00Z', detail: 'NameError' },
  { type: 'mission', at: '2026-01-01T10:20:00Z', concept: 'class' },
]

describe('conceptActivity', () => {
  it('measures the span of each concept from its first to its last event', () => {
    const activity = conceptActivity(events)
    const classActivity = activity.find((item) => item.concept === 'class')

    expect(classActivity?.events).toBe(2)
    expect(classActivity?.durationMs).toBe(20 * 60 * 1000)
  })

  it('ignores events without a concept', () => {
    expect(conceptActivity(events).some((item) => item.concept === 'state')).toBe(true)
    expect(conceptActivity([{ type: 'error', at: '2026-01-01T00:00:00Z' }])).toEqual([])
  })
})

describe('errorsByType', () => {
  it('counts runtime errors by kind', () => {
    expect(errorsByType(events)).toEqual([{ kind: 'NameError', count: 2 }])
  })
})

describe('summarizeAnalytics', () => {
  it('bundles errors, concepts and prediction attempts', () => {
    const summary = summarizeAnalytics(events)
    expect(summary.predictions).toBe(1)
    expect(summary.errorsByType).toEqual([{ kind: 'NameError', count: 2 }])
    expect(summary.concepts).toHaveLength(2)
  })
})
