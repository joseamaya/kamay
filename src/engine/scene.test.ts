import { describe, expect, it } from 'vitest'

import { ACTOR_CATALOG, addCatalogObject, createScene } from '../model'
import { DEFAULT_COLOR, DEFAULT_SHAPE, toActor, toSceneState } from './scene'

describe('toActor', () => {
  it('applies defaults for missing attributes', () => {
    const actor = toActor({ id: 'a', name: 'a', class: 'Circle', attributes: {} }, 0)

    expect(actor.shape).toBe(DEFAULT_SHAPE)
    expect(actor.color).toBe(DEFAULT_COLOR)
    expect(actor.transform).toEqual({ position: { x: 0, y: 0 }, rotation: 0, scale: 1 })
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
})
