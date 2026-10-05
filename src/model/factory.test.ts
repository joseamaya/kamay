import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  addEventAction,
  createEmptyProject,
  createScene,
  findEvent,
  removeEventAction,
  removeObject,
  renameProject,
  setActionArg,
  setSceneBackground,
  updateObjectAttributes,
} from './index'

const circle = ACTOR_CATALOG.find((item) => item.id === 'circle')!
const cat = ACTOR_CATALOG.find((item) => item.id === 'cat')!

describe('ACTOR_CATALOG', () => {
  it('exposes the geometric primitives', () => {
    expect(ACTOR_CATALOG.filter((item) => item.kind === 'shape').map((item) => item.id)).toEqual([
      'circle',
      'square',
      'triangle',
      'rectangle',
      'diamond',
      'pentagon',
      'hexagon',
      'heart',
      'star',
    ])
  })

  it('exposes characters and things as glyphs', () => {
    expect(
      ACTOR_CATALOG.filter((item) => item.kind === 'glyph' && !item.group).map((item) => item.id),
    ).toEqual(['cat', 'dog', 'robot', 'rocket', 'apple', 'ball', 'tree', 'house'])
    expect(cat.glyph).toBe('🐱')
  })

  it('exposes the real-world domain catalog with domain bases', () => {
    const domain = ACTOR_CATALOG.filter((item) => item.group)

    expect(domain.map((item) => item.id)).toEqual([
      'carro',
      'bicicleta',
      'moto',
      'perro',
      'gato',
      'pajaro',
      'casa',
      'arbol',
      'robot',
      'cohete',
      'pelota',
    ])
    expect(domain.every((item) => item.base != null)).toBe(true)
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

  it('seeds the glyph attribute for characters and things', () => {
    const scene = addCatalogObject(createScene('Principal'), cat)
    expect(scene.classes[0]?.name).toBe('Cat')
    expect(scene.classes[0]?.attributes).toContainEqual({
      name: 'glyph',
      type: 'string',
      initial: '🐱',
    })
    expect(scene.objects[0]?.attributes.glyph).toBe('🐱')
  })

  it('adds the domain base chain for a real-world entity', () => {
    const carro = ACTOR_CATALOG.find((item) => item.id === 'carro')!
    const scene = addCatalogObject(createScene('Principal'), carro)

    expect(scene.classes.map((definition) => definition.name)).toEqual(['Vehiculo', 'Carro'])
    const entity = scene.classes.find((definition) => definition.name === 'Carro')!
    expect(entity.inherits).toBe('Vehiculo')
    expect(entity.methods.map((method) => method.name)).toContain('tocar_bocina')
    expect(
      scene.classes.find((definition) => definition.name === 'Vehiculo')?.methods,
    ).toHaveLength(3)
  })
})

describe('setActionArg', () => {
  it('updates a single action argument immutably', () => {
    let scene = addCatalogObject(createScene('Principal'), circle)
    const name = scene.objects[0]!.name
    scene = addEventAction(scene, 'on_start', null, null, {
      target: name,
      method: 'decir',
      args: { mensaje: 'hola' },
    })

    const next = setActionArg(scene, 'on_start', null, null, 0, 'mensaje', 'adios')

    expect(next.events[0]?.actions[0]?.args.mensaje).toBe('adios')
    expect(scene.events[0]?.actions[0]?.args.mensaje).toBe('hola')
  })

  it('ignores a missing event', () => {
    const scene = addCatalogObject(createScene('Principal'), circle)
    expect(setActionArg(scene, 'on_start', null, null, 0, 'mensaje', 'x')).toEqual(scene)
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

  it('drops the object events and actions when deleting it', () => {
    let scene = addCatalogObject(createScene('Principal'), circle)
    const object = scene.objects[0]!
    const action = { target: object.name, method: 'decir', args: { mensaje: 'hola' } }
    scene = addEventAction(scene, 'on_click', object.name, null, action)
    scene = addEventAction(scene, 'on_start', null, null, action)

    scene = removeObject(scene, object.id)

    expect(scene.objects).toHaveLength(0)
    expect(scene.events.find((event) => event.type === 'on_click')).toBeUndefined()
    expect(findEvent(scene, 'on_start', null)?.actions ?? []).toHaveLength(0)
  })
})

describe('event actions', () => {
  const action = { target: 'heroe1', method: 'decir', args: { mensaje: 'hola' } }

  it('keys events by type and source', () => {
    let scene = addEventAction(createScene('Principal'), 'on_click', 'heroe1', null, action)

    expect(findEvent(scene, 'on_click', 'heroe1')?.actions).toHaveLength(1)
    expect(findEvent(scene, 'on_click', 'heroe2')).toBeUndefined()
    expect(findEvent(scene, 'on_start', null)?.actions ?? []).toHaveLength(0)

    scene = removeEventAction(scene, 'on_click', 'heroe1', null, 0)
    expect(findEvent(scene, 'on_click', 'heroe1')?.actions).toHaveLength(0)
  })

  it('keys keyboard events by the pressed key', () => {
    let scene = addEventAction(
      createScene('Principal'),
      'on_key',
      'heroe1',
      null,
      action,
      'ArrowUp',
    )
    scene = addEventAction(scene, 'on_key', 'heroe1', null, action, 'ArrowDown')

    expect(scene.events.filter((event) => event.type === 'on_key')).toHaveLength(2)
    expect(findEvent(scene, 'on_key', 'heroe1', null, 'ArrowUp')?.actions).toHaveLength(1)
    expect(findEvent(scene, 'on_key', 'heroe1', null, 'ArrowDown')?.actions).toHaveLength(1)
  })

  it('keys signal events by the signal name', () => {
    let scene = addEventAction(
      createScene('Principal'),
      'on_signal',
      'heroe1',
      null,
      action,
      null,
      'boom',
    )
    scene = addEventAction(scene, 'on_signal', 'heroe1', null, action, null, 'boom')

    expect(scene.events.filter((event) => event.type === 'on_signal')).toHaveLength(1)
    expect(findEvent(scene, 'on_signal', 'heroe1', null, null, 'boom')?.actions).toHaveLength(2)
  })
})

describe('renameProject', () => {
  it('renames the project meta', () => {
    const project = createEmptyProject({ name: 'Demo' })
    expect(renameProject(project, 'Nuevo').meta.name).toBe('Nuevo')
  })
})
