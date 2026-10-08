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

/** A model entity focused in the inspector, linked to its location in the code. */
export type MemberRef =
  | { kind: 'object'; objectName: string }
  | { kind: 'method'; className: string; name: string }
  | { kind: 'attribute'; className: string; name: string }
  | { kind: 'component'; className: string; name: string }
  | { kind: 'order'; orderIndex: number }

/** Stable key for a member reference, used to compare and locate it. */
export function memberKey(member: MemberRef): string {
  switch (member.kind) {
    case 'object':
      return `object:${member.objectName}`
    case 'method':
      return `method:${member.className}:${member.name}`
    case 'attribute':
      return `attribute:${member.className}:${member.name}`
    case 'component':
      return `component:${member.className}:${member.name}`
    case 'order':
      return `order:${member.orderIndex}`
  }
}

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
  highlightedMember: MemberRef | null
  log: LogEntry[]
  toast: Toast | null
  /** How many hints have been revealed per mission. */
  revealedHints: Record<string, number>
  revealHint: (missionId: string) => void
  setProjectId: (projectId: string) => void
  setActiveSceneId: (sceneId: string | null) => void
  selectObject: (objectId: string | null) => void
  setHighlightedMember: (member: MemberRef | null) => void
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
  highlightedMember: null,
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
  selectObject: (selectedObjectId) => set({ selectedObjectId, highlightedMember: null }),
  setHighlightedMember: (highlightedMember) => set({ highlightedMember }),
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
