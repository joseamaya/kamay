import { create } from 'zustand'

import {
  addCatalogObject,
  addEventAction,
  createEmptyProject,
  duplicateObject as duplicateObjectInScene,
  findCatalogItem,
  instantiateClass as instantiateClassInScene,
  removeClass as removeClassFromScene,
  removeEventAction,
  removeObject as removeObjectFromScene,
  renameProject as renameProjectInProject,
  replaceScene,
  setSceneBackground,
  updateObjectAttributes as updateObjectAttributesOnScene,
  upsertClass,
} from '../model'
import type { Action, ClassDefinition, EventType, Project, Scene } from '../model'

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
  setBackground: (sceneId: string, background: string) => void
  saveClass: (sceneId: string, definition: ClassDefinition) => void
  removeClass: (sceneId: string, classId: string) => void
  instantiateClass: (sceneId: string, classId: string) => void
  addAction: (sceneId: string, eventType: EventType, source: string | null, action: Action) => void
  removeAction: (
    sceneId: string,
    eventType: EventType,
    source: string | null,
    actionIndex: number,
  ) => void
  renameProject: (name: string) => void
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

  setBackground: (sceneId, background) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => setSceneBackground(scene, background)),
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

  addAction: (sceneId, eventType, source, action) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) => addEventAction(scene, eventType, source, action)),
    )
  },

  removeAction: (sceneId, eventType, source, actionIndex) => {
    get().updateProject((project) =>
      updateScene(project, sceneId, (scene) =>
        removeEventAction(scene, eventType, source, actionIndex),
      ),
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
