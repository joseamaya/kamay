import { create } from 'zustand'

import { createEmptyProject } from '../model'
import type { Project } from '../model'

const HISTORY_LIMIT = 50

export interface ProjectState {
  project: Project
  past: Project[]
  future: Project[]
  loadProject: (project: Project) => void
  updateProject: (updater: (project: Project) => Project) => void
  undo: () => void
  redo: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: createEmptyProject(),
  past: [],
  future: [],

  loadProject: (project) => set({ project, past: [], future: [] }),

  updateProject: (updater) =>
    set((state) => {
      const next = updater(state.project)
      if (next === state.project) return state
      return {
        project: next,
        past: [state.project, ...state.past].slice(0, HISTORY_LIMIT),
        future: [],
      }
    }),

  undo: () =>
    set((state) => {
      const [previous, ...rest] = state.past
      if (!previous) return state
      return { project: previous, past: rest, future: [state.project, ...state.future] }
    }),

  redo: () =>
    set((state) => {
      const [next, ...rest] = state.future
      if (!next) return state
      return { project: next, past: [state.project, ...state.past], future: rest }
    }),
}))

export const canUndo = (state: ProjectState): boolean => state.past.length > 0
export const canRedo = (state: ProjectState): boolean => state.future.length > 0
