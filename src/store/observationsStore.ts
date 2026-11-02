import { create } from 'zustand'

export interface StateChange {
  target: string
  name: string
  value: number | string | boolean
}

type ValueMap = Record<string, Record<string, number | string | boolean>>

export interface ObservationsState {
  /** Latest runtime value of each data attribute, keyed by object name. */
  values: ValueMap
  /** Value each attribute had right before its latest recorded change. */
  before: ValueMap
  /** Object names in the order they first reported state. */
  order: string[]
  record: (change: StateChange) => void
  reset: () => void
}

export const useObservationsStore = create<ObservationsState>((set) => ({
  values: {},
  before: {},
  order: [],
  record: ({ target, name, value }) =>
    set((state) => {
      const current = state.values[target] ?? {}
      if (current[name] === value) return state
      const prior = name in current ? current[name]! : value
      const targetBefore = state.before[target] ?? {}
      return {
        values: { ...state.values, [target]: { ...current, [name]: value } },
        before: { ...state.before, [target]: { ...targetBefore, [name]: prior } },
        order: state.order.includes(target) ? state.order : [...state.order, target],
      }
    }),
  reset: () => set({ values: {}, before: {}, order: [] }),
}))
