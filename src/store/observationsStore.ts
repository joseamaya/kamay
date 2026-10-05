import { create } from 'zustand'

export interface StateChange {
  target: string
  name: string
  value: number | string | boolean
}

export interface ObservationsState {
  /** Latest runtime value of each data attribute, keyed by object name. */
  values: Record<string, Record<string, number | string | boolean>>
  /** Object names in the order they first reported state. */
  order: string[]
  record: (change: StateChange) => void
  reset: () => void
}

export const useObservationsStore = create<ObservationsState>((set) => ({
  values: {},
  order: [],
  record: ({ target, name, value }) =>
    set((state) => {
      const current = state.values[target] ?? {}
      if (current[name] === value) return state
      return {
        values: { ...state.values, [target]: { ...current, [name]: value } },
        order: state.order.includes(target) ? state.order : [...state.order, target],
      }
    }),
  reset: () => set({ values: {}, order: [] }),
}))
