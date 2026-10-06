import { create } from 'zustand'

import { clearDeliveries, deleteDelivery, listDeliveries, saveDeliveries } from '../persistence'
import type { Delivery, DeliveryRecord } from '../persistence'

/** Locally persisted collection of imported student deliveries (teacher mode). */
export interface TeacherState {
  deliveries: DeliveryRecord[]
  hydrated: boolean
  /** Loads the stored deliveries once. */
  hydrate: () => Promise<void>
  add: (deliveries: Delivery[]) => Promise<void>
  remove: (id: string) => Promise<void>
  clear: () => Promise<void>
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  deliveries: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return
    const deliveries = await listDeliveries()
    set({ deliveries, hydrated: true })
  },
  add: async (incoming) => {
    const records = await saveDeliveries(incoming)
    set((state) => ({ deliveries: [...records, ...state.deliveries] }))
  },
  remove: async (id) => {
    await deleteDelivery(id)
    set((state) => ({ deliveries: state.deliveries.filter((record) => record.id !== id) }))
  },
  clear: async () => {
    await clearDeliveries()
    set({ deliveries: [] })
  },
}))
