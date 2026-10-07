import { create } from 'zustand'

import {
  addCatalogObject,
  addOrder as addOrderToScene,
  createEmptyProject,
  createScene,
  duplicateObject as duplicateObjectInScene,
  findCatalogItem,
  instantiateClass as instantiateClassInScene,
  nextSceneName,
  removeClass as removeClassFromScene,
  removeObject as removeObjectFromScene,
  removeOrder as removeOrderFromScene,
  removeScene as removeSceneFromProject,
  renameProject as renameProjectInProject,
  renameScene as renameSceneInProject,
  replaceScene,
  setOrderArg as setOrderArgInScene,
  setSceneBackground,
  setScenePhysics,
  updateObjectAttributes as updateObjectAttributesOnScene,
  updateObjectSimulation as updateObjectSimulationOnScene,
  upsertClass,
} from '../model'
import type { Action, ClassDefinition, Project, Scene, Simulation } from '../model'

const HISTORY_LIMIT = 50

export interface ProjectState {
  project: Project
  past: Project[]
  future: Project[]
  loadProject: (project: Project) => void
  updateProject: (updater: (project: Project) => Project) => void
  addObject: (sceneId: string, catalogItemId: string) => void
  removeObject: (sceneId: string, objectId: string) => void
  duplicateObject: (sceneId: string, objectId: string) => void
  updateObjectAttributes: (
    sceneId: string,
    objectId: string,
    patch: Record<string, number | string | boolean>,
  ) => void
  updateObjectSimulation: (sceneId: string, objectId: string, patch: Partial<Simulation>) => void
  setBackground: (sceneId: string, background: string) => void
  setPhysics: (sceneId: string, patch: Partial<Scene['physics']>) => void
  saveClass: (sceneId: string, definition: ClassDefinition) => void
  removeClass: (sceneId: string, classId: string) => void
  instantiateClass: (sceneId: string, classId: string) => void
  addOrder: (sceneId: string, action: Action) => void
  removeOrder: (sceneId: string, index: number) => void
  setOrderArg: (
    sceneId: string,
    index: number,
    parameter: string,
    value: number | string | boolean,
  ) => void
  renameProject: (name: string) => void
  addScene: () => string
  renameScene: (sceneId: string, name: string) => void
  removeScene: (sceneId: string) => void
  undo: () => void
  redo: () => void
}

function updateScene(project: Project, sceneId: string, updater: (scene: Scene) => Scene): Project {
  const scene = project.scenes.find((candidate) => candidate.id === sceneId)
  if (!scene) return project
  const next = updater(scene)
  return next === scene ? project : replaceScene(project, next)
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

  duplicateObject: (sceneId, objectId) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => duplicateObjectInScene(scene, objectId)),
    )
  },

  updateObjectAttributes: (sceneId, objectId, patch) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) =>
        updateObjectAttributesOnScene(scene, objectId, patch),
      ),
    )
  },

  updateObjectSimulation: (sceneId, objectId, patch) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) =>
        updateObjectSimulationOnScene(scene, objectId, patch),
      ),
    )
  },

  setBackground: (sceneId, background) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => setSceneBackground(scene, background)),
    )
  },

  setPhysics: (sceneId, patch) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => setScenePhysics(scene, patch)),
    )
  },

  saveClass: (sceneId, definition) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => upsertClass(scene, definition)),
    )
  },

  removeClass: (sceneId, classId) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => removeClassFromScene(scene, classId)),
    )
  },

  instantiateClass: (sceneId, classId) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => instantiateClassInScene(scene, classId)),
    )
  },

  addOrder: (sceneId, action) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => addOrderToScene(scene, action)),
    )
  },

  removeOrder: (sceneId, index) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => removeOrderFromScene(scene, index)),
    )
  },

  setOrderArg: (sceneId, index, parameter, value) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => setOrderArgInScene(scene, index, parameter, value)),
    )
  },

  renameProject: (name) => {
    get().updateProject((project) => renameProjectInProject(project, name))
  },

  addScene: () => {
    const scene = createScene(nextSceneName(get().project))
    get().updateProject((project) => ({ ...project, scenes: [...project.scenes, scene] }))
    return scene.id
  },

  renameScene: (sceneId, name) => {
    get().updateProject((project) => renameSceneInProject(project, sceneId, name))
  },

  removeScene: (sceneId) => {
    get().updateProject((project) => removeSceneFromProject(project, sceneId))
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
