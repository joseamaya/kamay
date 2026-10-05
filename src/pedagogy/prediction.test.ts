import { describe, expect, it } from 'vitest'

import { createClassDraft, createScene, instantiateClass } from '../model'
import type { Scene } from '../model'
import { buildPrediction } from './prediction'

function withPerroInstances(): Scene {
  const perro = createClassDraft('Perro')
  perro.attributes.push({ name: 'energia', type: 'number', initial: 50 })
  let scene: Scene = { ...createScene('Principal'), classes: [perro] }
  scene = instantiateClass(scene, perro.id)
  scene = instantiateClass(scene, perro.id)
  return scene
}

describe('buildPrediction', () => {
  it('builds a class-vs-object prediction when a sibling holds another value', () => {
    const scene = withPerroInstances()

    expect(buildPrediction(scene, scene.objects[0]!, 'energia', 20)).toMatchObject({
      objectName: 'perro1',
      className: 'Perro',
      attribute: 'energia',
      newValue: 20,
      siblingName: 'perro2',
      siblingValue: 50,
    })
  })

  it('ignores non-custom attributes', () => {
    const scene = withPerroInstances()
    expect(buildPrediction(scene, scene.objects[0]!, 'x', 10)).toBeNull()
  })

  it('ignores objects without a sibling of the same class', () => {
    const perro = createClassDraft('Perro')
    perro.attributes.push({ name: 'energia', type: 'number', initial: 50 })
    let scene: Scene = { ...createScene('Principal'), classes: [perro] }
    scene = instantiateClass(scene, perro.id)

    expect(buildPrediction(scene, scene.objects[0]!, 'energia', 20)).toBeNull()
  })

  it('ignores when the sibling already holds the new value', () => {
    const scene = withPerroInstances()
    expect(buildPrediction(scene, scene.objects[0]!, 'energia', 50)).toBeNull()
  })
})
