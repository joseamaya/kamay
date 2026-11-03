import { describe, expect, it } from 'vitest'

import { createClassDraft, createObject, createScene, instantiateClass } from '../model'
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

function withSharedBattery(): Scene {
  const bateria = createClassDraft('Bateria')
  bateria.attributes.push({ name: 'carga', type: 'number', initial: 100 })
  const radio = createClassDraft('Radio')
  radio.attributes.push({ name: 'bateria', type: 'reference', initial: '' })
  let scene: Scene = { ...createScene('Principal'), classes: [bateria, radio] }
  scene = { ...scene, objects: [createObject(scene, 'Radio', { bateria: 'bateria1' })] }
  scene = { ...scene, objects: [...scene.objects, createObject(scene, 'Bateria')] }
  return scene
}

describe('buildPrediction', () => {
  it('builds a class-vs-object prediction when a sibling holds another value', () => {
    const scene = withPerroInstances()

    expect(buildPrediction(scene, scene.objects[0]!, 'energia', 20)).toMatchObject({
      kind: 'independent',
      objectName: 'perro1',
      className: 'Perro',
      attribute: 'energia',
      newValue: 20,
      siblingName: 'perro2',
      siblingValue: 50,
    })
  })

  it('builds a shared prediction when another object references this one', () => {
    const scene = withSharedBattery()
    const battery = scene.objects.find((object) => object.name === 'bateria1')!

    expect(buildPrediction(scene, battery, 'carga', 50)).toMatchObject({
      kind: 'shared',
      objectName: 'bateria1',
      className: 'Bateria',
      attribute: 'carga',
      newValue: 50,
      siblingName: 'radio1',
      siblingAttribute: 'bateria',
      siblingValue: 100,
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
