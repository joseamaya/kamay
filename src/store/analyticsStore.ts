import { create } from 'zustand'

import { clearAnalytics, loadAnalytics, saveAnalytics } from '../persistence'
import type { AnalyticsEvent } from '../pedagogy'

/** Keeps the log bounded; older events are dropped first. */
const MAX_EVENTS = 1000

export interface AnalyticsState {
  events: AnalyticsEvent[]
  hydrated: boolean
  /** Loads the durable log once. */
  hydrate: () => Promise<void>
  record: (event: Omit<AnalyticsEvent, 'at'> & { at?: string }) => void
  reset: () => void
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  events: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return
    const events = await loadAnalytics()
    set({ events, hydrated: true })
  },
  record: (event) => {
    const next = [...get().events, { ...event, at: event.at ?? new Date().toISOString() }].slice(
      -MAX_EVENTS,
    )
    set({ events: next })
    void saveAnalytics(next)
  },
  reset: () => {
    set({ events: [] })
    void clearAnalytics()
  },
}))
