import type { RubricCriterionId } from '../missions'
import type { MisconceptionId } from '../pedagogy'
import type { Delivery } from '../persistence'

export const CRITERION_ORDER: RubricCriterionId[] = [
  'objects',
  'orders',
  'classes',
  'state',
  'inheritance',
  'polymorphism',
  'composition',
  'code',
]

export interface ConceptTally {
  id: RubricCriterionId
  demonstrated: number
  practiced: number
  introduced: number
}

export interface TeacherReport {
  count: number
  concepts: ConceptTally[]
  misconceptions: { id: MisconceptionId; count: number }[]
  predictions: { correct: number; total: number }
  missionsCompleted: number
  errors: { kind: string; count: number }[]
}

/** Aggregates imported student deliveries into a class-level report. */
export function aggregateDeliveries(deliveries: Delivery[]): TeacherReport {
  const concepts = new Map<RubricCriterionId, ConceptTally>(
    CRITERION_ORDER.map((id) => [id, { id, demonstrated: 0, practiced: 0, introduced: 0 }]),
  )
  const misconceptions = new Map<MisconceptionId, number>()
  const errors = new Map<string, number>()
  let correct = 0
  let total = 0
  let missionsCompleted = 0

  for (const delivery of deliveries) {
    for (const entry of delivery.rubric) {
      const tally = concepts.get(entry.id)
      if (tally) tally[entry.status] += 1
    }
    for (const id of delivery.evidence.misconceptions) {
      misconceptions.set(id, (misconceptions.get(id) ?? 0) + 1)
    }
    for (const tally of Object.values(delivery.evidence.predictions)) {
      if (!tally) continue
      correct += tally.correct
      total += tally.correct + tally.misconception + tally.explained
    }
    for (const item of delivery.analytics?.errorsByType ?? []) {
      errors.set(item.kind, (errors.get(item.kind) ?? 0) + item.count)
    }
    missionsCompleted += delivery.missions.completed.length
  }

  return {
    count: deliveries.length,
    concepts: CRITERION_ORDER.map((id) => concepts.get(id)!),
    misconceptions: [...misconceptions.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    predictions: { correct, total },
    missionsCompleted,
    errors: [...errors.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
  }
}
