import { create } from 'zustand'

import { createId } from '../model'

export type LogLevel = 'info' | 'error'

export interface LogEntry {
  id: string
  text: string
  level: LogLevel
}

export interface EditorState {
  projectId: string
  activeSceneId: string | null
  selectedObjectId: string | null
  running: boolean
  dirty: boolean
  log: LogEntry[]
  setProjectId: (projectId: string) => void
  setActiveSceneId: (sceneId: string | null) => void
  selectObject: (objectId: string | null) => void
  setRunning: (running: boolean) => void
  setDirty: (dirty: boolean) => void
  pushLog: (text: string, level?: LogLevel) => void
  clearLog: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  projectId: createId('project'),
  activeSceneId: null,
  selectedObjectId: null,
  running: false,
  dirty: false,
  log: [],

  setProjectId: (projectId) => set({ projectId }),
  setActiveSceneId: (activeSceneId) => set({ activeSceneId }),
  selectObject: (selectedObjectId) => set({ selectedObjectId }),
  setRunning: (running) => set({ running }),
  setDirty: (dirty) => set({ dirty }),
  pushLog: (text, level = 'info') =>
    set((state) => ({ log: [{ id: createId('log'), text, level }, ...state.log].slice(0, 20) })),
  clearLog: () => set({ log: [] }),
}))
