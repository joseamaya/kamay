import { create } from 'zustand'

import type { RuntimeError, RuntimeStatus, WarmupStatus } from '../runtime/types'

export interface RuntimeStoreState {
  status: RuntimeStatus
  warmup: WarmupStatus
  error: RuntimeError | null
  setStatus: (status: RuntimeStatus) => void
  setWarmup: (warmup: WarmupStatus) => void
  setError: (error: RuntimeError | null) => void
}

export const useRuntimeStore = create<RuntimeStoreState>((set) => ({
  status: 'idle',
  warmup: 'idle',
  error: null,
  setStatus: (status) => set({ status }),
  setWarmup: (warmup) => set({ warmup }),
  setError: (error) => set({ error }),
}))
