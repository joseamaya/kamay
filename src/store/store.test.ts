import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../model'
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

  it('duplicates an object with a new name', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')
    const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id

    useProjectStore.getState().duplicateObject(sceneId, objectId)

    const objects = useProjectStore.getState().project.scenes[0]!.objects
    expect(objects).toHaveLength(2)
    expect(objects[1]?.name).toBe('circle2')
  })

  it('saves a class and instantiates it', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    const definition = createClassDraft('Heroe')

    useProjectStore.getState().saveClass(sceneId, definition)
    expect(useProjectStore.getState().project.scenes[0]?.classes).toHaveLength(1)

    useProjectStore.getState().instantiateClass(sceneId, definition.id)
    expect(useProjectStore.getState().project.scenes[0]?.objects[0]?.class).toBe('Heroe')
  })

  it('does not remove a class that still has instances', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    const definition = createClassDraft('Heroe')
    useProjectStore.getState().saveClass(sceneId, definition)
    useProjectStore.getState().instantiateClass(sceneId, definition.id)

    useProjectStore.getState().removeClass(sceneId, definition.id)
    expect(useProjectStore.getState().project.scenes[0]?.classes).toHaveLength(1)
  })

  it('adds and removes scene actions', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addAction(sceneId, 'on_start', null, {
      target: 'circle1',
      method: 'decir',
      args: { mensaje: 'hola' },
    })

    const events = useProjectStore.getState().project.scenes[0]!.events
    expect(events[0]?.actions).toHaveLength(1)
    expect(events[0]?.actions[0]?.method).toBe('decir')

    useProjectStore.getState().removeAction(sceneId, 'on_start', null, 0)
    expect(useProjectStore.getState().project.scenes[0]!.events[0]?.actions).toHaveLength(0)
  })
})
