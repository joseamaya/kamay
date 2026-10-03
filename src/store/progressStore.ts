import { create } from 'zustand'

import type { MissionId } from '../missions'

const STORAGE_KEY = 'kamay.progress'

function readStored(): MissionId[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? (parsed.filter((id) => typeof id === 'string') as MissionId[])
      : []
  } catch {
    return []
  }
}

function persist(completed: MissionId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
  } catch {
    // Storage can be unavailable (private mode); progress stays in memory.
  }
}

export interface ProgressState {
  completed: MissionId[]
  complete: (id: MissionId) => void
  reset: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  completed: readStored(),
  complete: (id) => {
    if (get().completed.includes(id)) return
    const completed = [...get().completed, id]
    set({ completed })
    persist(completed)
  },
  reset: () => {
    set({ completed: [] })
    persist([])
  },
}))
