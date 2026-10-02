import { useEffect } from 'react'

import { usePersistence } from '../persistence'
import { useEditorStore, useProjectStore } from '../store'
import { ActivityPanel } from './activity/ActivityPanel'
import { TopBar } from './bar/TopBar'
import { CodeView } from './code/CodeView'
import { FactoryView } from './factory/FactoryView'
import { AttributesPanel } from './inspector/AttributesPanel'
import { ScenarioView } from './scenario/ScenarioView'

export function App() {
  const persistence = usePersistence()
  const project = useProjectStore((state) => state.project)
  const activeSceneId = useEditorStore((state) => state.activeSceneId)
  const setActiveSceneId = useEditorStore((state) => state.setActiveSceneId)
  const setDirty = useEditorStore((state) => state.setDirty)

  useEffect(() => {
    const exists = project.scenes.some((scene) => scene.id === activeSceneId)
    if (!exists) setActiveSceneId(project.scenes[0]?.id ?? null)
  }, [project, activeSceneId, setActiveSceneId])

  useEffect(
    () =>
      useProjectStore.subscribe((state, previous) => {
        if (state.project !== previous.project) setDirty(true)
      }),
    [setDirty],
  )

  return (
    <div className="flex h-screen flex-col">
      <TopBar persistence={persistence} />
      <main className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-3 lg:grid-cols-[18rem_1fr_26rem] lg:overflow-hidden">
        <FactoryView />
        <ScenarioView />
        <div className="flex min-h-0 flex-col gap-3">
          <AttributesPanel />
          <CodeView />
        </div>
      </main>
      <ActivityPanel />
    </div>
  )
}
