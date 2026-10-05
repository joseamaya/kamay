import { create } from 'zustand'

import type { PredictionChoice, PredictionOutcome, PredictionScenario } from '../pedagogy'
import { useEvidenceStore } from './evidenceStore'
import { useProgressStore } from './progressStore'

export type { PredictionChoice, PredictionOutcome } from '../pedagogy'

export interface PredictionState {
  pending: PredictionScenario | null
  outcome: PredictionOutcome | null
  /** Classes already asked about, so the prompt does not nag. */
  askedClasses: string[]
  ask: (scenario: PredictionScenario) => void
  answer: (choice: PredictionChoice) => void
  close: () => void
  reset: () => void
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  pending: null,
  outcome: null,
  askedClasses: [],
  ask: (scenario) => {
    if (useProgressStore.getState().freeMode) return
    if (get().pending) return
    if (get().askedClasses.includes(scenario.className)) return
    set({ pending: scenario, outcome: null })
  },
  answer: (choice) => {
    const pending = get().pending
    if (!pending) return
    const outcome: PredictionOutcome =
      choice === 'changed' ? 'misconception' : choice === 'unchanged' ? 'correct' : 'explained'
    useEvidenceStore.getState().recordPrediction(pending.concept, outcome)
    if (outcome === 'misconception') useEvidenceStore.getState().recordMisconception('shared_state')
    set((state) => ({ outcome, askedClasses: [...state.askedClasses, pending.className] }))
  },
  close: () => set({ pending: null, outcome: null }),
  reset: () => set({ pending: null, outcome: null, askedClasses: [] }),
}))
