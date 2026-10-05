import { create } from 'zustand'

import type { MisconceptionId, PredictionScenario } from '../pedagogy'
import { useProgressStore } from './progressStore'

export type PredictionChoice = 'changed' | 'unchanged' | 'unknown'
export type PredictionOutcome = 'correct' | 'misconception' | 'explained'

export interface PredictionState {
  pending: PredictionScenario | null
  outcome: PredictionOutcome | null
  /** Classes already asked about, so the prompt does not nag. */
  askedClasses: string[]
  /** Misconceptions the student has been confronted with. */
  addressed: MisconceptionId[]
  ask: (scenario: PredictionScenario) => void
  answer: (choice: PredictionChoice) => void
  note: (id: MisconceptionId) => void
  close: () => void
  reset: () => void
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  pending: null,
  outcome: null,
  askedClasses: [],
  addressed: [],
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
    set((state) => ({
      outcome,
      askedClasses: [...state.askedClasses, pending.className],
      addressed:
        outcome === 'misconception' && !state.addressed.includes('shared_state')
          ? [...state.addressed, 'shared_state']
          : state.addressed,
    }))
  },
  note: (id) =>
    set((state) =>
      state.addressed.includes(id) ? state : { addressed: [...state.addressed, id] },
    ),
  close: () => set({ pending: null, outcome: null }),
  reset: () => set({ pending: null, outcome: null, askedClasses: [], addressed: [] }),
}))
