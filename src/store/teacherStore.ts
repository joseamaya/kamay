import { create } from 'zustand'

import type { Delivery } from '../persistence'

/** In-memory collection of imported student deliveries (teacher mode). */
export interface TeacherState {
  deliveries: Delivery[]
  add: (deliveries: Delivery[]) => void
  remove: (index: number) => void
  clear: () => void
}

export const useTeacherStore = create<TeacherState>((set) => ({
  deliveries: [],
  add: (incoming) => set((state) => ({ deliveries: [...state.deliveries, ...incoming] })),
  remove: (index) =>
    set((state) => ({ deliveries: state.deliveries.filter((_, i) => i !== index) })),
  clear: () => set({ deliveries: [] }),
}))
