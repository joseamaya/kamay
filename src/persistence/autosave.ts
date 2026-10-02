import { useEditorStore, useProjectStore } from '../store'
import type { ProjectRepository } from './types'

export interface Autosave {
  saveNow: () => Promise<void>
  flush: () => Promise<void>
  stop: () => void
}

export function createAutosave(repository: ProjectRepository, delay = 600): Autosave {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending = false

  const persist = async () => {
    const project = useProjectStore.getState().project
    const projectId = useEditorStore.getState().projectId
    await repository.save({
      id: projectId,
      name: project.meta.name,
      updatedAt: new Date().toISOString(),
      project,
    })
    pending = false
  }

  const unsubscribe = useProjectStore.subscribe((state, previous) => {
    if (state.project === previous.project) return
    pending = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      void persist()
    }, delay)
  })

  return {
    saveNow: persist,
    flush: async () => {
      if (timer) clearTimeout(timer)
      timer = null
      if (pending) await persist()
    },
    stop: () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    },
  }
}
