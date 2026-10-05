import { describe, expect, it } from 'vitest'

import { ACTOR_CATALOG, addCatalogObject, createScene } from '../model'
import { DEFAULT_COLOR, DEFAULT_SHAPE, toActor, toSceneState } from './scene'

describe('toActor', () => {
  it('applies defaults for missing attributes', () => {
    const actor = toActor({ id: 'a', name: 'a', class: 'Circle', attributes: {} }, 0)

    expect(actor.shape).toBe(DEFAULT_SHAPE)
    expect(actor.glyph).toBeUndefined()
    expect(actor.color).toBe(DEFAULT_COLOR)
    expect(actor.transform).toEqual({ position: { x: 0, y: 0 }, rotation: 0, scale: 1 })
  })

  it('reads the glyph attribute when present', () => {
    const actor = toActor(
      { id: 'a', name: 'a', class: 'Cat', attributes: { shape: 'circle', glyph: '🐱' } },
      0,
    )

    expect(actor.glyph).toBe('🐱')
  })

  it('reads visual attributes from the object', () => {
    const actor = toActor(
      {
        id: 'a',
        name: 'a',
        class: 'Circle',
        attributes: { x: 5, y: -3, rotation: 90, scale: 2, color: '#ffffff', shape: 'triangle' },
      },
      3,
    )

    expect(actor.shape).toBe('triangle')
    expect(actor.color).toBe('#ffffff')
    expect(actor.transform.position).toEqual({ x: 5, y: -3 })
    expect(actor.transform.rotation).toBe(90)
    expect(actor.transform.scale).toBe(2)
    expect(actor.zIndex).toBe(3)
  })

  it('carries the class image', () => {
    const actor = toActor(
      { id: 'a', name: 'a', class: 'Heroe', attributes: { shape: 'circle' } },
      0,
      'data:image/png;base64,abc',
    )

    expect(actor.image).toBe('data:image/png;base64,abc')
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
