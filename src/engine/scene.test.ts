import { describe, expect, it } from 'vitest'

import { ACTOR_CATALOG, addCatalogObject, createScene } from '../model'
import { DEFAULT_COLOR, DEFAULT_SHAPE, applyAppearance, toActor, toSceneState } from './scene'

const SIMULATION = { x: 5, y: -3, rotation: 90, scale: 2, mensaje: '' }

describe('toActor', () => {
  it('reads the transform from the simulation state and defaults the look', () => {
    const actor = toActor(
      {
        id: 'a',
        name: 'a',
        class: 'Circle',
        simulation: SIMULATION,
        attributes: {},
      },
      3,
    )

    expect(actor.shape).toBe(DEFAULT_SHAPE)
    expect(actor.glyph).toBeUndefined()
    expect(actor.color).toBe(DEFAULT_COLOR)
    expect(actor.transform).toEqual({ position: { x: 5, y: -3 }, rotation: 90, scale: 2 })
    expect(actor.zIndex).toBe(3)
  })

  it('offsets the scene with the interpreted domain attributes', () => {
    const actor = toActor(
      {
        id: 'a',
        name: 'a',
        class: 'Circle',
        simulation: { x: 100, y: 0, rotation: 0, scale: 1, mensaje: '' },
        attributes: { distancia: 50, altura: 20, giro: 90, tamano: 2 },
      },
      0,
    )

    expect(actor.transform).toEqual({ position: { x: 150, y: 20 }, rotation: 90, scale: 2 })
  })

  it('overrides the look with a resolved appearance', () => {
    const actor = applyAppearance(
      toActor(
        {
          id: 'a',
          name: 'a',
          class: 'Cat',
          simulation: { x: 0, y: 0, rotation: 0, scale: 1, mensaje: '' },
          attributes: {},
        },
        0,
      ),
      { color: '#ffffff', shape: 'triangle', glyph: '🐱', image: null },
    )

    expect(actor.glyph).toBe('🐱')
    expect(actor.shape).toBe('triangle')
    expect(actor.color).toBe('#ffffff')
  })
})

describe('toSceneState', () => {
  it('maps objects with increasing zIndex', () => {
    let scene = createScene('Principal')
    scene = addCatalogObject(scene, ACTOR_CATALOG[0]!)
    scene = addCatalogObject(scene, ACTOR_CATALOG[1]!)

    const state = toSceneState(scene)

    expect(state.background).toBe('grass')
    expect(state.actors.map((actor) => actor.zIndex)).toEqual([0, 1])
  })

  it('applies a matching visual variant to the actor', () => {
    let scene = addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!)
    scene = {
      ...scene,
      objects: scene.objects.map((object) => ({
        ...object,
        attributes: { ...object.attributes, encendido: true },
      })),
    }

    expect(toSceneState(scene).actors[0]?.color).toBe('#f4c542')
  })

  it('propagates the class image to its objects', () => {
    let scene = createScene('Principal')
    scene = addCatalogObject(scene, ACTOR_CATALOG[0]!)
    scene = {
      ...scene,
      classes: scene.classes.map((definition) => ({
        ...definition,
        image: 'data:image/png;base64,abc',
      })),
    }

    expect(toSceneState(scene).actors[0]?.image).toBe('data:image/png;base64,abc')
  })
})
