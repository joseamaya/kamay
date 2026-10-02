import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../model'
import { canRedo, canUndo, useProjectStore } from './store'

function resetStore() {
  useProjectStore.setState({
    project: createEmptyProject({ name: 'Demo' }),
    past: [],
    future: [],
  })
}

describe('useProjectStore', () => {
  beforeEach(resetStore)

  it('records history when the project changes', () => {
    useProjectStore.getState().updateProject((project) => ({
      ...project,
      meta: { ...project.meta, name: 'Cambiado' },
    }))

    const state = useProjectStore.getState()
    expect(state.project.meta.name).toBe('Cambiado')
    expect(state.past).toHaveLength(1)
    expect(state.future).toHaveLength(0)
    expect(canUndo(state)).toBe(true)
    expect(canRedo(state)).toBe(false)
  })

  it('undoes and redoes a change', () => {
    useProjectStore.getState().updateProject((project) => ({
      ...project,
      meta: { ...project.meta, name: 'Cambiado' },
    }))

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.meta.name).toBe('Demo')
    expect(canRedo(useProjectStore.getState())).toBe(true)

    useProjectStore.getState().redo()
    expect(useProjectStore.getState().project.meta.name).toBe('Cambiado')
  })

  it('does not record history when the updater returns the same reference', () => {
    useProjectStore.getState().updateProject((project) => project)
    expect(useProjectStore.getState().past).toHaveLength(0)
  })

  it('does nothing when there is nothing to undo', () => {
    const before = useProjectStore.getState().project
    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project).toBe(before)
  })

  it('adds an object from the catalog and records history', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')

    const scene = useProjectStore.getState().project.scenes[0]!
    expect(scene.objects).toHaveLength(1)
    expect(scene.classes[0]?.name).toBe('Circle')
    expect(useProjectStore.getState().past).toHaveLength(1)

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.scenes[0]?.objects).toHaveLength(0)
  })

  it('ignores unknown catalog items', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'unknown')
    expect(useProjectStore.getState().project.scenes[0]?.objects).toHaveLength(0)
  })

  it('updates and removes an object', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')
    const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id

    useProjectStore
      .getState()
      .updateObjectAttributes(sceneId, objectId, { x: 10, color: '#000000' })
    const updated = useProjectStore.getState().project.scenes[0]!.objects[0]!
    expect(updated.attributes.x).toBe(10)
    expect(updated.attributes.color).toBe('#000000')

    useProjectStore.getState().removeObject(sceneId, objectId)
    expect(useProjectStore.getState().project.scenes[0]?.objects).toHaveLength(0)
  })

  it('sets the active scene background', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().setBackground(sceneId, 'night')
    expect(useProjectStore.getState().project.scenes[0]?.background).toBe('night')
  })
})
