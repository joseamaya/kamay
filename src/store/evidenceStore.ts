import { create } from 'zustand'

import { emptyEvidence, EVIDENCE_VERSION, withMisconception, withPrediction } from '../pedagogy'
import type { ConceptId, Evidence, MisconceptionId, PredictionOutcome } from '../pedagogy'

const STORAGE_KEY = 'kamay.evidence'

function asMisconceptionIds(value: unknown): MisconceptionId[] {
  return Array.isArray(value)
    ? (value.filter((id) => typeof id === 'string') as MisconceptionId[])
    : []
}

function readStored(): Evidence {
  if (typeof localStorage === 'undefined') return emptyEvidence()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyEvidence()
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyEvidence()
    const record = parsed as Record<string, unknown>
    if (record.version !== EVIDENCE_VERSION) return emptyEvidence()
    return {
      version: EVIDENCE_VERSION,
      misconceptions: asMisconceptionIds(record.misconceptions),
      predictions:
        record.predictions && typeof record.predictions === 'object'
          ? (record.predictions as Evidence['predictions'])
          : {},
    }
  } catch {
    return emptyEvidence()
  }
}

function persist(evidence: Evidence): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evidence))
  } catch {
    // Storage can be unavailable (private mode); evidence stays in memory.
  }
}

export interface EvidenceState extends Evidence {
  recordMisconception: (id: MisconceptionId) => void
  recordPrediction: (concept: ConceptId, outcome: PredictionOutcome) => void
  reset: () => void
}

/** The durable part of the store, suitable for export. */
export function selectEvidence(state: EvidenceState): Evidence {
  return {
    version: state.version,
    misconceptions: state.misconceptions,
    predictions: state.predictions,
  }
}

export const useEvidenceStore = create<EvidenceState>((set, get) => ({
  ...readStored(),
  recordMisconception: (id) => {
    const next = withMisconception(selectEvidence(get()), id)
    set(next)
    persist(next)
  },
  recordPrediction: (concept, outcome) => {
    const next = withPrediction(selectEvidence(get()), concept, outcome)
    set(next)
    persist(next)
  },
  reset: () => {
    const next = emptyEvidence()
    set(next)
    persist(next)
  },
}))
