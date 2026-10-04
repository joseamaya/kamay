import { create } from 'zustand'

import type { MissionId } from '../missions'

const STORAGE_KEY = 'kamay.progress'

interface StoredProgress {
  completed: MissionId[]
  freeMode: boolean
  unlockedLevel: number
}

function asMissionIds(value: unknown): MissionId[] {
  return Array.isArray(value) ? (value.filter((id) => typeof id === 'string') as MissionId[]) : []
}

function readStored(): StoredProgress {
  const fallback: StoredProgress = { completed: [], freeMode: false, unlockedLevel: 1 }
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return { ...fallback, completed: asMissionIds(parsed) }
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      return {
        completed: asMissionIds(record.completed),
        freeMode: record.freeMode === true,
        unlockedLevel: typeof record.unlockedLevel === 'number' ? record.unlockedLevel : 1,
      }
    }
    return fallback
  } catch {
    return fallback
  }
}

function persist(progress: StoredProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage can be unavailable (private mode); progress stays in memory.
  }
}

export interface ProgressState extends StoredProgress {
  complete: (id: MissionId) => void
  setFreeMode: (freeMode: boolean) => void
  setUnlockedLevel: (level: number) => void
  reset: () => void
}

const stored = readStored()

function snapshot(state: ProgressState): StoredProgress {
  return {
    completed: state.completed,
    freeMode: state.freeMode,
    unlockedLevel: state.unlockedLevel,
  }
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...stored,
  complete: (id) => {
    if (get().completed.includes(id)) return
    set((state) => ({ completed: [...state.completed, id] }))
    persist(snapshot(get()))
  },
  setFreeMode: (freeMode) => {
    set({ freeMode })
    persist(snapshot(get()))
  },
  setUnlockedLevel: (unlockedLevel) => {
    set({ unlockedLevel })
    persist(snapshot(get()))
  },
  reset: () => {
    set({ completed: [], unlockedLevel: 1 })
    persist(snapshot(get()))
  },
}))
