import type { MissionId } from '../missions'
import type { ConceptId, MisconceptionId } from './concepts'
import type { PredictionOutcome } from './prediction'

export interface PredictionTally {
  correct: number
  misconception: number
  explained: number
}

/** Durable, local record of how the student has interacted with concepts. */
export interface Evidence {
  version: 1
  /** Misconceptions the student has been confronted with. */
  misconceptions: MisconceptionId[]
  /** Prediction answers tallied per concept. */
  predictions: Partial<Record<ConceptId, PredictionTally>>
  /** When each mission was completed, as an ISO timestamp. */
  missionDates: Partial<Record<MissionId, string>>
}

export const EVIDENCE_VERSION = 1

export function emptyEvidence(): Evidence {
  return { version: EVIDENCE_VERSION, misconceptions: [], predictions: {}, missionDates: {} }
}

export function withPrediction(
  evidence: Evidence,
  concept: ConceptId,
  outcome: PredictionOutcome,
): Evidence {
  const tally = evidence.predictions[concept] ?? { correct: 0, misconception: 0, explained: 0 }
  return {
    ...evidence,
    predictions: {
      ...evidence.predictions,
      [concept]: { ...tally, [outcome]: tally[outcome] + 1 },
    },
  }
}

export function withMisconception(evidence: Evidence, id: MisconceptionId): Evidence {
  if (evidence.misconceptions.includes(id)) return evidence
  return { ...evidence, misconceptions: [...evidence.misconceptions, id] }
}

export function withMissionDate(evidence: Evidence, id: MissionId, date: string): Evidence {
  if (evidence.missionDates[id]) return evidence
  return { ...evidence, missionDates: { ...evidence.missionDates, [id]: date } }
}
