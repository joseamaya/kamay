import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  addOrder,
  createClassDraft,
  createEmptyProject,
  createScene,
  DOMAIN_BASES,
  removeObject,
  removeOrder,
  renameProject,
  setOrderArg,
  setSceneBackground,
  updateObjectAttributes,
  updateObjectSimulation,
  upsertClass,
  withDomainBases,
} from './index'
import type { ClassDefinition } from './index'

const carro = ACTOR_CATALOG.find((item) => item.id === 'carro')!
const perro = ACTOR_CATALOG.find((item) => item.id === 'perro')!

describe('ACTOR_CATALOG', () => {
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

  it('authors every catalog method as blocks so projects stay simulable', () => {
    for (const item of ACTOR_CATALOG) {
      for (const method of item.methods ?? []) {
        expect(method.body.kind).toBe('blocks')
      }
    }
    for (const definition of Object.values(DOMAIN_BASES)) {
      for (const method of definition.methods) {
        expect(method.body.kind).toBe('blocks')
      }
    }
  })
})

describe('withDomainBases', () => {
  it('adds a domain base inherited but not placed in the scene', () => {
    const heroe: ClassDefinition = { ...createClassDraft('Heroe'), inherits: 'Vehiculo' }
    const scene = upsertClass(createScene('Principal'), heroe)

    expect(withDomainBases(scene).classes.map((definition) => definition.name)).toContain(
      'Vehiculo',
    )
  })
})

describe('addCatalogObject', () => {
  it('adds the base and entity classes once and creates named instances', () => {
    const first = addCatalogObject(createScene('Principal'), carro)
    const second = addCatalogObject(first, carro)

    expect(first.classes.map((definition) => definition.name)).toEqual(['Vehiculo', 'Carro'])
    expect(first.objects[0]?.name).toBe('carro1')
    expect(second.classes).toHaveLength(2)
    expect(second.objects.map((object) => object.name)).toEqual(['carro1', 'carro2'])
  })

  it('seeds the object simulation and appearance', () => {
    const scene = addCatalogObject(createScene('Principal'), carro)
    expect(scene.objects[0]?.simulation).toMatchObject({ x: 0, y: 0, rotation: 0, scale: 1 })
    expect(scene.objects[0]?.appearance).toMatchObject({ shape: 'circle', color: carro.color })
  })

  it('seeds the glyph for a real-world entity', () => {
    const scene = addCatalogObject(createScene('Principal'), perro)
    expect(scene.classes.map((definition) => definition.name)).toEqual(['Animal', 'Perro'])
    expect(scene.classes.find((definition) => definition.name === 'Perro')?.appearance.glyph).toBe(
      '🐶',
    )
    expect(scene.objects[0]?.appearance.glyph).toBe('🐶')
  })

  it('adds the domain base chain for a real-world entity', () => {
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

describe('setOrderArg', () => {
  it('updates a single order argument immutably', () => {
    let scene = addCatalogObject(createScene('Principal'), carro)
    const name = scene.objects[0]!.name
    scene = addOrder(scene, { target: name, method: 'decir', args: { mensaje: 'hola' } })

    const next = setOrderArg(scene, 0, 'mensaje', 'adios')

    expect(next.orders[0]?.args.mensaje).toBe('adios')
    expect(scene.orders[0]?.args.mensaje).toBe('hola')
  })

  it('ignores a missing order', () => {
    const scene = addCatalogObject(createScene('Principal'), carro)
    expect(setOrderArg(scene, 3, 'mensaje', 'x')).toEqual(scene)
  })
})

describe('scene operations', () => {
  it('removes an object by id', () => {
    const scene = addCatalogObject(createScene('Principal'), carro)
    const id = scene.objects[0]!.id
    expect(removeObject(scene, id).objects).toHaveLength(0)
  })

  it('patches object attributes immutably', () => {
    const scene = addCatalogObject(createScene('Principal'), carro)
    const id = scene.objects[0]!.id
    const next = updateObjectAttributes(scene, id, { distancia: 42, encendido: true })

    expect(next.objects[0]?.attributes.distancia).toBe(42)
    expect(next.objects[0]?.attributes.encendido).toBe(true)
    expect(scene.objects[0]?.attributes.distancia).toBeUndefined()
  })

  it('patches the object simulation immutably', () => {
    const scene = addCatalogObject(createScene('Principal'), carro)
    const id = scene.objects[0]!.id
    const next = updateObjectSimulation(scene, id, { x: 42, rotation: 90 })

    expect(next.objects[0]?.simulation.x).toBe(42)
    expect(next.objects[0]?.simulation.rotation).toBe(90)
    expect(scene.objects[0]?.simulation.x).toBe(0)
  })

  it('sets the background', () => {
    expect(setSceneBackground(createScene('Principal'), 'night').background).toBe('night')
  })

  it('drops the object orders when deleting it', () => {
    let scene = addCatalogObject(createScene('Principal'), carro)
    const object = scene.objects[0]!
    scene = addOrder(scene, { target: object.name, method: 'decir', args: { mensaje: 'hola' } })

    scene = removeObject(scene, object.id)

    expect(scene.objects).toHaveLength(0)
    expect(scene.orders).toHaveLength(0)
  })
})

describe('orders', () => {
  const action = { target: 'heroe1', method: 'decir', args: { mensaje: 'hola' } }

  it('appends orders in order and removes by index', () => {
    let scene = addOrder(createScene('Principal'), action)
    scene = addOrder(scene, { ...action, method: 'saltar' })

    expect(scene.orders.map((order) => order.method)).toEqual(['decir', 'saltar'])

    scene = removeOrder(scene, 0)
    expect(scene.orders.map((order) => order.method)).toEqual(['saltar'])
  })
})

describe('renameProject', () => {
  it('renames the project meta', () => {
    const project = createEmptyProject({ name: 'Demo' })
    expect(renameProject(project, 'Nuevo').meta.name).toBe('Nuevo')
  })
})
