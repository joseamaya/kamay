import { useEffect, useMemo, useRef, useState } from 'react'

import { createId } from '../model'
import { useEditorStore, useProjectStore } from '../store'
import type { Autosave } from './autosave'
import { createAutosave } from './autosave'
import { openKamayDb } from './db'
import { exportProject, projectFileName, readProjectFile } from './file'
import { createRepository } from './repository'
import type { ProjectRecord, ProjectRepository } from './types'

export interface PersistenceApi {
  ready: boolean
  save: () => Promise<boolean>
  list: () => Promise<ProjectRecord[]>
  openProject: (id: string) => Promise<void>
  removeProject: (id: string) => Promise<void>
  exportFile: () => void
  importFile: (file: File) => Promise<void>
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function usePersistence(): PersistenceApi {
  const [ready, setReady] = useState(false)
  const repositoryRef = useRef<ProjectRepository | null>(null)
  const autosaveRef = useRef<Autosave | null>(null)

  useEffect(() => {
    let active = true
    void openKamayDb().then((db) => {
      if (!active) return
      const repository = createRepository(db)
      repositoryRef.current = repository
      autosaveRef.current = createAutosave(repository)
      setReady(true)
    })
    return () => {
      active = false
      autosaveRef.current?.stop()
      autosaveRef.current = null
      repositoryRef.current = null
    }
  }, [])

  return useMemo<PersistenceApi>(
    () => ({
      ready,
      save: async () => {
        if (!autosaveRef.current) return false
        await autosaveRef.current.saveNow()
        return true
      },
      list: async () => (repositoryRef.current ? repositoryRef.current.list() : []),
      openProject: async (id) => {
        const repository = repositoryRef.current
        if (!repository) return
        const record = await repository.get(id)
        if (!record) return
        useProjectStore.getState().loadProject(record.project)
        useEditorStore.getState().setProjectId(record.id)
      },
      removeProject: async (id) => {
        await repositoryRef.current?.remove(id)
      },
      exportFile: () => {
        const project = useProjectStore.getState().project
        download(exportProject(project), projectFileName(project))
      },
      importFile: async (file) => {
        const project = await readProjectFile(file)
        useProjectStore.getState().loadProject(project)
        useEditorStore.getState().setProjectId(createId('project'))
        await autosaveRef.current?.saveNow()
      },
    }),
    [ready],
  )
}
