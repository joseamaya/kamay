import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  createEmptyProject,
  createScene,
  removeObject,
  renameProject,
  setSceneBackground,
  updateObjectAttributes,
} from './index'

const circle = ACTOR_CATALOG.find((item) => item.id === 'circle')!

describe('ACTOR_CATALOG', () => {
  it('exposes the geometric primitives', () => {
    expect(ACTOR_CATALOG.map((item) => item.id)).toEqual(['circle', 'square', 'triangle'])
  })
})

describe('addCatalogObject', () => {
  it('adds the class once and creates named instances', () => {
    const first = addCatalogObject(createScene('Principal'), circle)
    const second = addCatalogObject(first, circle)

    expect(first.classes).toHaveLength(1)
    expect(first.classes[0]?.name).toBe('Circle')
    expect(first.objects[0]?.name).toBe('circle1')
    expect(second.classes).toHaveLength(1)
    expect(second.objects.map((object) => object.name)).toEqual(['circle1', 'circle2'])
  })

  it('seeds the object visual attributes', () => {
    const scene = addCatalogObject(createScene('Principal'), circle)
    expect(scene.objects[0]?.attributes).toMatchObject({
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      shape: 'circle',
      color: circle.color,
    })
  })
})

describe('scene operations', () => {
  it('removes an object by id', () => {
    const scene = addCatalogObject(createScene('Principal'), circle)
    const id = scene.objects[0]!.id
    expect(removeObject(scene, id).objects).toHaveLength(0)
  })

  it('patches object attributes immutably', () => {
    const scene = addCatalogObject(createScene('Principal'), circle)
    const id = scene.objects[0]!.id
    const next = updateObjectAttributes(scene, id, { x: 42, color: '#000000' })

    expect(next.objects[0]?.attributes.x).toBe(42)
    expect(next.objects[0]?.attributes.color).toBe('#000000')
    expect(scene.objects[0]?.attributes.x).toBe(0)
  })

  it('sets the background', () => {
    expect(setSceneBackground(createScene('Principal'), 'night').background).toBe('night')
  })
})

describe('renameProject', () => {
  it('renames the project meta', () => {
    const project = createEmptyProject({ name: 'Demo' })
    expect(renameProject(project, 'Nuevo').meta.name).toBe('Nuevo')
  })
})
