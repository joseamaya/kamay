import { create } from 'zustand'

import type { RuntimeError, RuntimeStatus } from '../runtime/types'

export interface RuntimeStoreState {
  status: RuntimeStatus
  error: RuntimeError | null
  setStatus: (status: RuntimeStatus) => void
  setError: (error: RuntimeError | null) => void
}

export const useRuntimeStore = create<RuntimeStoreState>((set) => ({
  status: 'idle',
  error: null,
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}))
