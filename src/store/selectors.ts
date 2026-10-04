import { capabilitiesFor, FREE_CAPABILITIES } from '../levels'
import type { Capabilities } from '../levels'
import type { ObjectInstance, Scene } from '../model'
import { useEditorStore } from './editorStore'
import { useProgressStore } from './progressStore'
import { useProjectStore } from './store'

export function useActiveScene(): Scene | null {
  const project = useProjectStore((state) => state.project)
  const activeSceneId = useEditorStore((state) => state.activeSceneId)
  return project.scenes.find((scene) => scene.id === activeSceneId) ?? project.scenes[0] ?? null
}

export function useSelectedObject(): ObjectInstance | null {
  const scene = useActiveScene()
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId)
  if (!scene) return null
  return scene.objects.find((object) => object.id === selectedObjectId) ?? null
}

export function useLevel(): number {
  return useProgressStore((state) => state.unlockedLevel)
}

export function useCapabilities(): Capabilities {
  const level = useProgressStore((state) => state.unlockedLevel)
  const freeMode = useProgressStore((state) => state.freeMode)
  return freeMode ? FREE_CAPABILITIES : capabilitiesFor(level)
}
