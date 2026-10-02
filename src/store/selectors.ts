import type { ObjectInstance, Scene } from '../model'
import { useEditorStore } from './editorStore'
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
