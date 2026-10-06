import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  addEventAction,
  createClassDraft,
  createEmptyProject,
  createScene,
  instantiateClass,
  updateObjectAttributes,
} from '../model'
import type { ClassDefinition, Project, Scene } from '../model'
import { BADGES, completedBadges, evaluateMissions, MISSIONS } from './missions'

const circle = ACTOR_CATALOG.find((item) => item.id === 'carro')!

function projectWith(scene: Scene): Project {
  return { ...createEmptyProject(), scenes: [scene] }
}

function withOrder(scene: Scene, method: string, args: Record<string, string | number>): Scene {
  const name = scene.objects[0]!.name
  return addEventAction(scene, 'on_start', null, null, { target: name, method, args })
}

describe('MISSIONS', () => {
  it('starts empty', () => {
    expect(evaluateMissions(createEmptyProject())).toEqual([])
  })

  it('completes the object and order missions', () => {
    let scene = addCatalogObject(createScene('Principal'), circle)
    scene = withOrder(scene, 'tocar_bocina', {})
    scene = withOrder(scene, 'moverse', {})

    const done = evaluateMissions(projectWith(scene))

    expect(done).toEqual(
      expect.arrayContaining(['first_object', 'give_order', 'say_hello', 'move_it']),
    )
  })

  it('completes the class and inheritance missions', () => {
    const heroe: ClassDefinition = {
      id: 'c1',
      name: 'Heroe',
      inherits: null,
      image: null,
      attributes: [{ name: 'vida', type: 'number', initial: 100 }],
      components: [],
      methods: [{ name: 'saltar', parameters: [], body: { kind: 'blocks', ops: [] } }],
      visuals: [],
    }
    const enemigo: ClassDefinition = {
      id: 'c2',
      name: 'Enemigo',
      inherits: 'Heroe',
      image: null,
      attributes: [],
      components: [],
      methods: [],
      visuals: [],
    }
    let scene: Scene = { ...createScene('Principal'), classes: [heroe, enemigo] }
    scene = addCatalogObject(scene, circle)

    const done = evaluateMissions(projectWith(scene))

    expect(done).toEqual(
      expect.arrayContaining(['own_class', 'own_attribute', 'own_method', 'inherit']),
    )
  })

  it('completes the collision mission', () => {
    let scene = addCatalogObject(createScene('Principal'), circle)
    const name = scene.objects[0]!.name
    scene = addEventAction(scene, 'on_collision', name, null, {
      target: name,
      method: 'tocar_bocina',
      args: {},
    })

    expect(evaluateMissions(projectWith(scene))).toContain('collision')
  })
})

describe('comprehension missions', () => {
  it('requires two instances of a class with different state', () => {
    const perro: ClassDefinition = {
      ...createClassDraft('Mascota'),
      attributes: [
        ...createClassDraft('Mascota').attributes,
        { name: 'energia', type: 'number', initial: 50 },
      ],
    }
    let scene: Scene = { ...createScene('Principal'), classes: [perro] }

    scene = instantiateClass(scene, perro.id)
    expect(evaluateMissions(projectWith(scene))).not.toContain('two_instances')

    scene = instantiateClass(scene, perro.id)
    expect(evaluateMissions(projectWith(scene))).not.toContain('two_instances')

    scene = updateObjectAttributes(scene, scene.objects[0]!.id, { energia: 20 })
    expect(evaluateMissions(projectWith(scene))).toContain('two_instances')
  })

  it('requires a subclass instance that keeps an inherited method', () => {
    const animal: ClassDefinition = {
      ...createClassDraft('SerVivo'),
      methods: [{ name: 'comer', parameters: [], body: { kind: 'blocks', ops: [] } }],
    }
    const perro: ClassDefinition = { ...createClassDraft('Canino'), inherits: 'SerVivo' }
    let scene: Scene = { ...createScene('Principal'), classes: [animal, perro] }

    expect(evaluateMissions(projectWith(scene))).not.toContain('inherited_behavior')

    scene = instantiateClass(scene, perro.id)
    expect(evaluateMissions(projectWith(scene))).toContain('inherited_behavior')
  })

  it('requires two overriding subclasses called with the same message', () => {
    const animal = createClassDraft('SerVivo')
    animal.methods.push({ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } })
    const perro = createClassDraft('Canino')
    perro.inherits = 'SerVivo'
    perro.methods.push({ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } })
    const gato = createClassDraft('Felino')
    gato.inherits = 'SerVivo'
    gato.methods.push({ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } })

    let scene: Scene = { ...createScene('Principal'), classes: [animal, perro, gato] }
    scene = instantiateClass(scene, perro.id)
    scene = instantiateClass(scene, gato.id)
    expect(evaluateMissions(projectWith(scene))).not.toContain('polymorphism')

    scene = addEventAction(scene, 'on_start', null, null, {
      target: scene.objects[0]!.name,
      method: 'hablar',
      args: {},
    })
    scene = addEventAction(scene, 'on_start', null, null, {
      target: scene.objects[1]!.name,
      method: 'hablar',
      args: {},
    })
    expect(evaluateMissions(projectWith(scene))).toContain('polymorphism')
  })

  it('requires a composed part with behavior of its own', () => {
    const motor: ClassDefinition = {
      ...createClassDraft('Motor'),
      methods: [{ name: 'arrancar', parameters: [], body: { kind: 'blocks', ops: [] } }],
    }
    const auto: ClassDefinition = {
      ...createClassDraft('Auto'),
      components: [{ name: 'motor', class: 'Motor' }],
    }
    let scene: Scene = { ...createScene('Principal'), classes: [motor, auto] }

    expect(evaluateMissions(projectWith(scene))).not.toContain('composed_part')

    scene = instantiateClass(scene, auto.id)
    expect(evaluateMissions(projectWith(scene))).toContain('composed_part')
  })
})

describe('catalog domain entities', () => {
  it('does not count as a student class nor satisfy inheritance', () => {
    const carro = ACTOR_CATALOG.find((item) => item.id === 'carro')!
    const scene = addCatalogObject(createScene('Principal'), carro)

    const done = evaluateMissions(projectWith(scene))

    expect(done).not.toContain('own_class')
    expect(done).not.toContain('inherit')
    expect(done).not.toContain('inherited_behavior')
  })
})

describe('completedBadges', () => {
  it('unlocks a badge only when all its missions are complete', () => {
    expect(completedBadges(['first_object'])).toEqual(['objects'])
    expect(completedBadges(['give_order'])).toEqual([])
    expect(completedBadges(['give_order', 'say_hello', 'move_it'])).toEqual(['orders'])
  })

  it('assigns every mission to a badge', () => {
    const assigned = new Set(BADGES.flatMap((badge) => badge.missions))
    for (const mission of MISSIONS) expect(assigned.has(mission.id)).toBe(true)
  })
})
