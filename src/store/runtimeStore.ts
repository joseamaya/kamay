import { create } from 'zustand'

import { advance, createStepQueue, pushMessage } from '../runtime/steps'
import type { StepQueue } from '../runtime/steps'
import type { RuntimeError, RuntimeMessage, RuntimeStatus, WarmupStatus } from '../runtime/types'

export interface RuntimeStoreState {
  status: RuntimeStatus
  warmup: WarmupStatus
  error: RuntimeError | null
  /** When on, engine commands are queued and applied one step at a time. */
  stepMode: boolean
  stepQueue: StepQueue
  setStatus: (status: RuntimeStatus) => void
  setWarmup: (warmup: WarmupStatus) => void
  setError: (error: RuntimeError | null) => void
  setStepMode: (stepMode: boolean) => void
  enqueueStep: (message: RuntimeMessage) => void
  advanceStep: () => void
  setCursor: (cursor: number) => void
  resetSteps: () => void
}

export const useRuntimeStore = create<RuntimeStoreState>((set) => ({
  status: 'idle',
  warmup: 'idle',
  error: null,
  stepMode: false,
  stepQueue: createStepQueue(),
  setStatus: (status) => set({ status }),
  setWarmup: (warmup) => set({ warmup }),
  setError: (error) => set({ error }),
  setStepMode: (stepMode) => set({ stepMode }),
  enqueueStep: (message) => set((state) => ({ stepQueue: pushMessage(state.stepQueue, message) })),
  advanceStep: () => set((state) => ({ stepQueue: advance(state.stepQueue) })),
  setCursor: (cursor) =>
    set((state) => ({
      stepQueue: {
        ...state.stepQueue,
        cursor: Math.max(0, Math.min(cursor, state.stepQueue.steps.length)),
      },
    })),
  resetSteps: () => set({ stepQueue: createStepQueue() }),
}))
