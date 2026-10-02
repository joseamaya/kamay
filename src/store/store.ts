import { create } from 'zustand'

import {
  addCatalogObject,
  createEmptyProject,
  findCatalogItem,
  removeObject as removeObjectFromScene,
  renameProject as renameProjectInProject,
  replaceScene,
  setSceneBackground,
  updateObjectAttributes as updateObjectAttributesOnScene,
} from '../model'
import type { Project, Scene } from '../model'

const HISTORY_LIMIT = 50

export interface ProjectState {
  project: Project
  past: Project[]
  future: Project[]
  loadProject: (project: Project) => void
  updateProject: (updater: (project: Project) => Project) => void
  addObject: (sceneId: string, catalogItemId: string) => void
  removeObject: (sceneId: string, objectId: string) => void
  updateObjectAttributes: (
    sceneId: string,
    objectId: string,
    patch: Record<string, number | string | boolean>,
  ) => void
  setBackground: (sceneId: string, background: string) => void
  renameProject: (name: string) => void
  undo: () => void
  redo: () => void
}

function updateScene(project: Project, sceneId: string, updater: (scene: Scene) => Scene): Project {
  const scene = project.scenes.find((candidate) => candidate.id === sceneId)
  if (!scene) return project
  return replaceScene(project, updater(scene))
}

export const useProjectStore = create<ProjectState>((set, get) => ({
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

  addObject: (sceneId, catalogItemId) => {
    const item = findCatalogItem(catalogItemId)
    if (!item) return
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => addCatalogObject(scene, item)),
    )
  },

  removeObject: (sceneId, objectId) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => removeObjectFromScene(scene, objectId)),
    )
  },

  updateObjectAttributes: (sceneId, objectId, patch) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) =>
        updateObjectAttributesOnScene(scene, objectId, patch),
      ),
    )
  },

  setBackground: (sceneId, background) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => setSceneBackground(scene, background)),
    )
  },

  renameProject: (name) => {
    get().updateProject((project) => renameProjectInProject(project, name))
  },

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
