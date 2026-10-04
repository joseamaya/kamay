import { useEffect, useRef } from 'react'

import { format, getMessages } from '../i18n'
import { evaluateMissions } from '../missions'
import { decodeSharePayload, readSharePayload, usePersistence } from '../persistence'
import { useRuntime } from '../runtime'
import {
  useEditorStore,
  useLevelsEffects,
  usePreferencesEffects,
  useProgressStore,
  useProjectStore,
} from '../store'
import { ActivityPanel } from './activity/ActivityPanel'
import { TopBar } from './bar/TopBar'
import { CodeView } from './code/CodeView'
import { FactoryView } from './factory/FactoryView'
import { GuidePanel } from './guide/GuidePanel'
import { ScenarioView } from './scenario/ScenarioView'

export function App() {
  usePreferencesEffects()
  useLevelsEffects()
  const persistence = usePersistence()
  const runtime = useRuntime()
  const project = useProjectStore((state) => state.project)
  const activeSceneId = useEditorStore((state) => state.activeSceneId)
  const setActiveSceneId = useEditorStore((state) => state.setActiveSceneId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const setDirty = useEditorStore((state) => state.setDirty)
  const pushLog = useEditorStore((state) => state.pushLog)
  const missionsInitialized = useRef(false)

  useEffect(() => {
    const messages = getMessages()
    const { completed, complete } = useProgressStore.getState()
    for (const id of evaluateMissions(project)) {
      if (completed.includes(id)) continue
      complete(id)
      if (missionsInitialized.current) {
        pushLog(format(messages.missions.completed, { title: messages.missions.list[id].title }))
      }
    }
    missionsInitialized.current = true
  }, [project, pushLog])

  useEffect(() => {
    if (!persistence.ready) return
    const payload = readSharePayload(window.location.hash)
    if (!payload) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    void decodeSharePayload(payload)
      .then(async (shared) => {
        await persistence.openShared(shared)
        selectObject(null)
        setDirty(false)
        pushLog(getMessages().activity.sharedOpened)
      })
      .catch(() => pushLog(getMessages().errors.share, 'error'))
  }, [persistence, selectObject, setDirty, pushLog])

  useEffect(() => {
    const exists = project.scenes.some((scene) => scene.id === activeSceneId)
    if (!exists) setActiveSceneId(project.scenes[0]?.id ?? null)
  }, [project, activeSceneId, setActiveSceneId])

  useEffect(() => {
    selectObject(null)
  }, [activeSceneId, selectObject])

  useEffect(
    () =>
      useProjectStore.subscribe((state, previous) => {
        if (state.project !== previous.project) setDirty(true)
      }),
    [setDirty],
  )

  return (
    <div className="flex h-screen flex-col">
      <TopBar persistence={persistence} runtime={runtime} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto lg:grid-cols-[18rem_minmax(0,1fr)_18rem] lg:overflow-hidden">
          <FactoryView />
          <ScenarioView />
          <div className="flex min-h-0 flex-col gap-3 overflow-auto">
            <GuidePanel />
          </div>
        </main>
        <CodeView />
      </div>
      <ActivityPanel />
    </div>
  )
}
