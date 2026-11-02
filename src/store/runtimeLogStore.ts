import { create } from 'zustand'

import type { RuntimeEvent } from '../runtime/types'

export interface RuntimeLogState {
  /** Ordered domain events of the current run, rebuilt on replay. */
  events: RuntimeEvent[]
  record: (event: RuntimeEvent) => void
  reset: () => void
}

export const useRuntimeLogStore = create<RuntimeLogState>((set) => ({
  events: [],
  record: (event) => set((state) => ({ events: [...state.events, event] })),
  reset: () => set({ events: [] }),
}))
