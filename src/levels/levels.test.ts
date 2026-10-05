import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  addEventAction,
  createEmptyProject,
  createScene,
} from '../model'
import type { ClassDefinition } from '../model'
import { capabilitiesFor, levelFromMissions, MAX_LEVEL, requiredLevel } from './levels'

function projectWithScene(scene: ReturnType<typeof createScene>) {
  return { ...createEmptyProject(), scenes: [scene] }
}

function klass(name: string, inherits = 'Actor'): ClassDefinition {
  return {
    id: `c-${name}`,
    name,
    inherits,
    image: null,
    attributes: [],
    components: [],
    methods: [],
  }
}

describe('capabilitiesFor', () => {
  it('unlocks capabilities progressively and clamps the level', () => {
    expect(capabilitiesFor(1)).toEqual({
      editValues: false,
      orders: false,
      ownClasses: false,
      blocks: false,
      events: false,
      freeCode: false,
      inheritance: false,
      composition: false,
    })
    expect(capabilitiesFor(2).editValues).toBe(true)
    expect(capabilitiesFor(2).orders).toBe(true)
    expect(capabilitiesFor(2).ownClasses).toBe(false)
    expect(capabilitiesFor(3).ownClasses).toBe(true)
    expect(capabilitiesFor(3).blocks).toBe(true)
    expect(capabilitiesFor(3).events).toBe(false)
    expect(capabilitiesFor(4).events).toBe(true)
    expect(capabilitiesFor(4).freeCode).toBe(true)
    expect(capabilitiesFor(4).inheritance).toBe(false)
    expect(capabilitiesFor(5).inheritance).toBe(true)
    expect(capabilitiesFor(5).composition).toBe(false)
    expect(capabilitiesFor(6).composition).toBe(true)
    expect(capabilitiesFor(99)).toEqual(capabilitiesFor(MAX_LEVEL))
    expect(capabilitiesFor(0)).toEqual(capabilitiesFor(1))
  })
})

describe('levelFromMissions', () => {
  it('advances only through fully completed levels', () => {
    expect(levelFromMissions([])).toBe(1)
    expect(levelFromMissions(['first_object'])).toBe(2)
    expect(levelFromMissions(['first_object', 'give_order'])).toBe(2)
    expect(levelFromMissions(['first_object', 'give_order', 'say_hello', 'move_it'])).toBe(3)
    expect(
      levelFromMissions([
        'first_object',
        'give_order',
        'say_hello',
        'move_it',
        'own_class',
        'own_attribute',
        'own_method',
      ]),
    ).toBe(4)
    expect(
      levelFromMissions([
        'first_object',
        'give_order',
        'say_hello',
        'move_it',
        'own_class',
        'own_attribute',
        'own_method',
        'collision',
        'wait_sequence',
        'signal',
      ]),
    ).toBe(5)
    expect(
      levelFromMissions([
        'first_object',
        'give_order',
        'say_hello',
        'move_it',
        'own_class',
        'own_attribute',
        'own_method',
        'collision',
        'wait_sequence',
        'signal',
        'inherit',
      ]),
    ).toBe(MAX_LEVEL)
  })
})

describe('requiredLevel', () => {
  it('is 1 for an empty or catalog-only project', () => {
    expect(requiredLevel(createEmptyProject())).toBe(1)
    const scene = addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!)
    expect(requiredLevel(projectWithScene(scene))).toBe(1)
  })

  it('requires level 3 for a custom class', () => {
    const scene = { ...createScene('Principal'), classes: [klass('Heroe')] }
    expect(requiredLevel(projectWithScene(scene))).toBe(3)
  })

  it('requires level 4 for advanced events or methods', () => {
    let scene = addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!)
    const name = scene.objects[0]!.name
    scene = addEventAction(scene, 'on_collision', name, null, {
      target: name,
      method: 'decir',
      args: { mensaje: 'x' },
    })
    expect(requiredLevel(projectWithScene(scene))).toBe(4)

    let sequence = addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!)
    sequence = addEventAction(sequence, 'on_start', null, null, {
      target: sequence.objects[0]!.name,
      method: 'esperar',
      args: { segundos: 1 },
    })
    expect(requiredLevel(projectWithScene(sequence))).toBe(4)
  })

  it('requires level 5 for inheritance', () => {
    const scene = {
      ...createScene('Principal'),
      classes: [klass('Personaje'), klass('Heroe', 'Personaje')],
    }
    expect(requiredLevel(projectWithScene(scene))).toBe(5)
  })

  it('requires level 6 for composition', () => {
    const scene = {
      ...createScene('Principal'),
      classes: [
        klass('Bateria'),
        { ...klass('Robot'), components: [{ name: 'bateria', class: 'Bateria' }] },
      ],
    }
    expect(requiredLevel(projectWithScene(scene))).toBe(6)
  })
})
