import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  addEventAction,
  createEmptyProject,
  createScene,
} from '../model'
import type { ClassDefinition, Project, Scene } from '../model'
import { BADGES, completedBadges, evaluateMissions, MISSIONS } from './missions'

const circle = ACTOR_CATALOG.find((item) => item.id === 'circle')!

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
    scene = withOrder(scene, 'decir', { mensaje: 'hola' })
    scene = withOrder(scene, 'mover', { x: 10, y: 0 })

    const done = evaluateMissions(projectWith(scene))

    expect(done).toEqual(
      expect.arrayContaining(['first_object', 'give_order', 'say_hello', 'move_it']),
    )
  })

  it('does not count an empty message as greeting', () => {
    let scene = addCatalogObject(createScene('Principal'), circle)
    scene = withOrder(scene, 'decir', { mensaje: '   ' })

    expect(evaluateMissions(projectWith(scene))).not.toContain('say_hello')
  })

  it('completes the class, inheritance and sequence missions', () => {
    const heroe: ClassDefinition = {
      id: 'c1',
      name: 'Heroe',
      inherits: 'Actor',
      image: null,
      attributes: [{ name: 'vida', type: 'number', initial: 100 }],
      components: [],
      methods: [{ name: 'saltar', parameters: [], body: { kind: 'code', code: 'pass' } }],
    }
    const enemigo: ClassDefinition = {
      id: 'c2',
      name: 'Enemigo',
      inherits: 'Heroe',
      image: null,
      attributes: [],
      components: [],
      methods: [],
    }
    let scene: Scene = { ...createScene('Principal'), classes: [heroe, enemigo] }
    scene = addCatalogObject(scene, circle)
    scene = withOrder(scene, 'esperar', { segundos: 1 })

    const done = evaluateMissions(projectWith(scene))

    expect(done).toEqual(
      expect.arrayContaining([
        'own_class',
        'own_attribute',
        'own_method',
        'inherit',
        'wait_sequence',
      ]),
    )
  })

  it('completes the collision and signal missions', () => {
    let scene = addCatalogObject(createScene('Principal'), circle)
    const name = scene.objects[0]!.name
    scene = addEventAction(scene, 'on_collision', name, null, {
      target: name,
      method: 'decir',
      args: { mensaje: 'boom' },
    })
    scene = withOrder(scene, 'emitir', { nombre: 'boom' })

    const done = evaluateMissions(projectWith(scene))

    expect(done).toContain('collision')
    expect(done).toContain('signal')
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
