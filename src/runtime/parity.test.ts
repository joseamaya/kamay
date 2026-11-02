import { describe, expect, it } from 'vitest'

import {
  addOrder,
  createChangeBlock,
  createClassDraft,
  createEmptyProject,
  createObject,
  createScene,
  createSetBlock,
  upsertClass,
} from '../model'
import type { ClassDefinition, Scene } from '../model'
import { Simulation } from './simulation'
import type { RuntimeMessage } from './types'

type States = Record<string, Record<string, unknown>>

/**
 * Shared subset both engines must agree on. The expected values encode Python
 * semantics (`self.x = self.x + 1`, MRO override, independent `self`), so the
 * simulation must produce the same final state. The opt-in `PYODIDE_E2E` spec
 * (`e2e/parity.spec.ts`) runs the same cases against real Python.
 */
function runScene(scene: Scene): { states: States; errors: string[] } {
  const project = { ...createEmptyProject(), scenes: [scene] }
  const states: States = {}
  const errors: string[] = []
  const simulation = new Simulation({
    project,
    sceneId: scene.id,
    emit: (message: RuntimeMessage) => {
      if (message.type === 'state') {
        states[message.target] = {
          ...(states[message.target] ?? {}),
          [message.name]: message.value,
        }
      }
    },
    onError: (error) => errors.push(error.message),
    onStatus: () => undefined,
  })
  simulation.start()
  return { states, errors }
}

function counterClass(): ClassDefinition {
  return {
    ...createClassDraft('Contador'),
    attributes: [{ name: 'valor', type: 'number', initial: 0 }],
    methods: [
      {
        name: 'sumar',
        parameters: [],
        body: { kind: 'blocks', ops: [createChangeBlock('valor', '+', 1)] },
      },
    ],
  }
}

function animalHierarchy(): Scene {
  const animal: ClassDefinition = {
    ...createClassDraft('Animal'),
    attributes: [{ name: 'sonido', type: 'string', initial: '' }],
    methods: [
      {
        name: 'hablar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', '...')] },
      },
    ],
  }
  const perro: ClassDefinition = {
    ...createClassDraft('Perro'),
    inherits: 'Animal',
    methods: [
      {
        name: 'hablar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', 'guau')] },
      },
    ],
  }
  const gato: ClassDefinition = {
    ...createClassDraft('Gato'),
    inherits: 'Animal',
    methods: [
      {
        name: 'hablar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', 'miau')] },
      },
    ],
  }
  let scene = upsertClass(createScene('Principal'), animal)
  scene = upsertClass(scene, perro)
  scene = upsertClass(scene, gato)
  scene = { ...scene, objects: [createObject(scene, 'Perro'), createObject(scene, 'Gato')] }
  return addOrder(scene, {
    kind: 'for_each',
    target: '',
    class: 'Animal',
    variable: 'animal',
    method: 'hablar',
    args: {},
  })
}

describe('engine parity (shared subset)', () => {
  it('keeps independent state for two instances of the same class', () => {
    let scene = upsertClass(createScene('Principal'), counterClass())
    scene = { ...scene, objects: [createObject(scene, 'Contador')] }
    scene = { ...scene, objects: [...scene.objects, createObject(scene, 'Contador')] }
    scene = addOrder(scene, { target: 'contador1', method: 'sumar', args: {} })
    scene = addOrder(scene, { target: 'contador2', method: 'sumar', args: {} })
    scene = addOrder(scene, { target: 'contador1', method: 'sumar', args: {} })

    const { states, errors } = runScene(scene)

    expect(errors).toEqual([])
    expect(states).toMatchObject({
      contador1: { valor: 2 },
      contador2: { valor: 1 },
    })
  })

  it('dispatches the overridden method of each subclass (polymorphism)', () => {
    const { states, errors } = runScene(animalHierarchy())

    expect(errors).toEqual([])
    expect(states).toMatchObject({
      perro1: { sonido: 'guau' },
      gato1: { sonido: 'miau' },
    })
  })

  it('reports an unknown method as an error instead of finishing', () => {
    let scene = upsertClass(createScene('Principal'), counterClass())
    scene = { ...scene, objects: [createObject(scene, 'Contador')] }
    scene = addOrder(scene, { target: 'contador1', method: 'no_existe', args: {} })

    const { errors } = runScene(scene)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('no_existe')
  })
})
