import { create } from 'zustand'

import { createId } from '../model'
import { revealNext } from '../pedagogy'

export type LogLevel = 'info' | 'error'

export interface LogEntry {
  id: string
  text: string
  level: LogLevel
}

export type Toast = { kind: 'mission'; detail: string } | { kind: 'level'; level: number }

export const CODE_MIN_HEIGHT = 120

export interface EditorState {
  projectId: string
  activeSceneId: string | null
  selectedObjectId: string | null
  running: boolean
  dirty: boolean
  codeHeight: number
  codeCollapsed: boolean
  codeFile: string | null
  log: LogEntry[]
  toast: Toast | null
  /** How many hints have been revealed per mission. */
  revealedHints: Record<string, number>
  revealHint: (missionId: string) => void
  setProjectId: (projectId: string) => void
  setActiveSceneId: (sceneId: string | null) => void
  selectObject: (objectId: string | null) => void
  setRunning: (running: boolean) => void
  setDirty: (dirty: boolean) => void
  setCodeHeight: (height: number) => void
  setCodeCollapsed: (collapsed: boolean) => void
  setCodeFile: (file: string | null) => void
  pushLog: (text: string, level?: LogLevel) => void
  clearLog: () => void
  showToast: (toast: Toast) => void
  hideToast: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  projectId: createId('project'),
  activeSceneId: null,
  selectedObjectId: null,
  running: false,
  dirty: false,
  codeHeight: 240,
  codeCollapsed: false,
  codeFile: null,
  log: [],
  toast: null,
  revealedHints: {},

  revealHint: (missionId) =>
    set((state) => ({
      revealedHints: {
        ...state.revealedHints,
        [missionId]: revealNext(state.revealedHints[missionId] ?? 0),
      },
    })),
  setProjectId: (projectId) => set({ projectId }),
  setActiveSceneId: (activeSceneId) => set({ activeSceneId }),
  selectObject: (selectedObjectId) => set({ selectedObjectId }),
  setRunning: (running) => set({ running }),
  setDirty: (dirty) => set({ dirty }),
  setCodeHeight: (codeHeight) => set({ codeHeight }),
  setCodeCollapsed: (codeCollapsed) => set({ codeCollapsed }),
  setCodeFile: (codeFile) => set({ codeFile }),
  pushLog: (text, level = 'info') =>
    set((state) => ({ log: [{ id: createId('log'), text, level }, ...state.log].slice(0, 20) })),
  clearLog: () => set({ log: [] }),
  showToast: (toast) => set({ toast }),
  hideToast: () => set({ toast: null }),
}))
