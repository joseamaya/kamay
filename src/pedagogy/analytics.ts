import type { ConceptId } from './concepts'

export type AnalyticsEventType = 'mission' | 'prediction' | 'misconception' | 'error'

/** A durable, timestamped learning-activity event. */
export interface AnalyticsEvent {
  type: AnalyticsEventType
  at: string
  concept?: ConceptId
  /** Mission id, prediction outcome, misconception id or runtime error kind. */
  detail?: string
}

/** How long a concept stayed active, from its first to its last event. */
export interface ConceptActivity {
  concept: ConceptId
  first: string
  last: string
  durationMs: number
  events: number
}

export interface AnalyticsSummary {
  errorsByType: { kind: string; count: number }[]
  concepts: ConceptActivity[]
  predictions: number
}

export function conceptActivity(events: AnalyticsEvent[]): ConceptActivity[] {
  const byConcept = new Map<ConceptId, { first: string; last: string; events: number }>()
  for (const event of events) {
    if (!event.concept) continue
    const current = byConcept.get(event.concept)
    if (!current) {
      byConcept.set(event.concept, { first: event.at, last: event.at, events: 1 })
    } else {
      byConcept.set(event.concept, {
        first: current.first,
        last: event.at,
        events: current.events + 1,
      })
    }
  }

  return [...byConcept.entries()]
    .map(([concept, { first, last, events }]) => ({
      concept,
      first,
      last,
      events,
      durationMs: Math.max(0, Date.parse(last) - Date.parse(first)),
    }))
    .sort((a, b) => b.durationMs - a.durationMs)
}

export function errorsByType(events: AnalyticsEvent[]): { kind: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    if (event.type !== 'error' || !event.detail) continue
    counts.set(event.detail, (counts.get(event.detail) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)
}

export function emptyAnalytics(): AnalyticsSummary {
  return { errorsByType: [], concepts: [], predictions: 0 }
}

/** Compact, serializable view used by the rubric, the delivery and teacher mode. */
export function summarizeAnalytics(events: AnalyticsEvent[]): AnalyticsSummary {
  return {
    errorsByType: errorsByType(events),
    concepts: conceptActivity(events),
    predictions: events.filter((event) => event.type === 'prediction').length,
  }
}
