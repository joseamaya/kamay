import { describe, expect, it } from 'vitest'

import { createClassDraft, createScene, upsertClass } from './index'
import { matchVisualVariant, objectAppearance, resolveVisualVariants } from './visuals'
import type { ClassDefinition, ObjectInstance, VisualVariant } from './schema'

const prendido: VisualVariant = {
  id: 'v-prendido',
  name: 'Prendido',
  when: [{ attribute: 'encendido', value: true }],
  glyph: '🔥',
  image: null,
  color: '#f4c542',
  shape: null,
}

function vehiculo(visuals: VisualVariant[]): ClassDefinition {
  return {
    ...createClassDraft('Vehiculo'),
    attributes: [
      { name: 'color', type: 'string', initial: '#8f9aa8' },
      { name: 'shape', type: 'string', initial: 'circle' },
      { name: 'encendido', type: 'boolean', initial: false },
    ],
    visuals,
  }
}

function sceneWith(...classes: ClassDefinition[]) {
  let scene = createScene('Principal')
  for (const definition of classes) scene = upsertClass(scene, definition)
  return scene
}

function object(attributes: Record<string, number | string | boolean> = {}): ObjectInstance {
  return { id: 'o1', name: 'carro1', class: 'Vehiculo', attributes }
}

describe('resolveVisualVariants', () => {
  it('includes inherited variants', () => {
    const carro: ClassDefinition = {
      ...createClassDraft('Carro'),
      inherits: 'Vehiculo',
      visuals: [],
    }
    const scene = sceneWith(vehiculo([prendido]), carro)
    expect(resolveVisualVariants(scene, 'Carro').map((variant) => variant.id)).toEqual([
      'v-prendido',
    ])
  })
})

describe('matchVisualVariant', () => {
  it('matches only when every condition holds', () => {
    expect(matchVisualVariant([prendido], { encendido: false })).toBeNull()
    expect(matchVisualVariant([prendido], { encendido: true })).toBe(prendido)
  })
})

describe('objectAppearance', () => {
  it('returns the base look when no variant matches', () => {
    const scene = sceneWith(vehiculo([prendido]))
    const appearance = objectAppearance(scene, object({ color: '#d64b4b', shape: 'circle' }))

    expect(appearance.color).toBe('#d64b4b')
    expect(appearance.glyph).toBeNull()
    expect(appearance.shape).toBe('circle')
  })

  it('overrides color and glyph when the state matches', () => {
    const scene = sceneWith(vehiculo([prendido]))
    const appearance = objectAppearance(scene, object({ color: '#d64b4b', shape: 'circle' }), {
      encendido: true,
    })

    expect(appearance.color).toBe('#f4c542')
    expect(appearance.glyph).toBe('🔥')
  })

  it('uses the class default when the object has no explicit value', () => {
    const scene = sceneWith(vehiculo([]))
    expect(objectAppearance(scene, object()).color).toBe('#8f9aa8')
  })
})
