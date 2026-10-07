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
} from '../../model'
import type { ClassDefinition, Project, Scene } from '../../model'
import type { RuntimeError, RuntimeMessage } from '../types'
import { hasRawCode, Simulation } from './simulation'

function heroe(): ClassDefinition {
  const draft = createClassDraft('Heroe')
  return {
    ...draft,
    attributes: [
      ...draft.attributes,
      { name: 'vida', type: 'number', initial: 100 },
      { name: 'sonido', type: 'string', initial: '' },
    ],
    methods: [
      {
        name: 'saludar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', 'hola')] },
      },
      {
        name: 'curar',
        parameters: [],
        body: { kind: 'blocks', ops: [createChangeBlock('vida', '+', 20)] },
      },
    ],
  }
}

function baseScene(): Scene {
  let scene = upsertClass(createScene('Principal'), heroe())
  scene = { ...scene, objects: [createObject(scene, 'Heroe')] }
  return scene
}

function run(scene: Scene) {
  const project: Project = { ...createEmptyProject(), scenes: [scene] }
  const messages: RuntimeMessage[] = []
  const errors: RuntimeError[] = []
  const simulation = new Simulation({
    project,
    sceneId: scene.id,
    emit: (message) => messages.push(message),
    onError: (error) => errors.push(error),
    onStatus: () => undefined,
  })
  simulation.start()
  return { simulation, messages, errors }
}

function stateValue(messages: RuntimeMessage[], name: string): unknown {
  const states = messages.filter(
    (message): message is Extract<RuntimeMessage, { type: 'state' }> =>
      message.type === 'state' && message.name === name,
  )
  return states.at(-1)?.value
}

function targetState(messages: RuntimeMessage[], target: string, name: string): unknown {
  const states = messages.filter(
    (message): message is Extract<RuntimeMessage, { type: 'state' }> =>
      message.type === 'state' && message.target === target && message.name === name,
  )
  return states.at(-1)?.value
}

describe('hasRawCode', () => {
  it('detects raw-code methods', () => {
    const raw: ClassDefinition = {
      ...createClassDraft('X'),
      methods: [{ name: 'm', parameters: [], body: { kind: 'code', code: 'pass' } }],
    }
    const scene = upsertClass(createScene('Principal'), raw)
    const project: Project = { ...createEmptyProject(), scenes: [scene] }

    expect(hasRawCode(project, scene.id)).toBe(true)
    expect(hasRawCode({ ...project, scenes: [createScene('Principal')] }, scene.id)).toBe(false)
  })
})

describe('Simulation', () => {
  it('emits initial state and runs orders', () => {
    let scene = baseScene()
    scene = addOrder(scene, { target: 'heroe1', method: 'saludar', args: {} })

    const { messages, errors } = run(scene)

    expect(stateValue(messages, 'vida')).toBe(100)
    expect(stateValue(messages, 'sonido')).toBe('hola')
    expect(errors).toEqual([])
  })

  it('runs a custom block method and updates state', () => {
    let scene = baseScene()
    scene = addOrder(scene, { target: 'heroe1', method: 'curar', args: {} })

    expect(stateValue(run(scene).messages, 'vida')).toBe(120)
  })

  it('resolves a domain base inherited but not placed in the scene', () => {
    const heroe: ClassDefinition = { ...createClassDraft('Heroe'), inherits: 'Vehiculo' }
    let scene = upsertClass(createScene('Principal'), heroe)
    scene = { ...scene, objects: [createObject(scene, 'Heroe')] }
    scene = addOrder(scene, { target: 'heroe1', method: 'prender', args: {} })

    const { messages, errors } = run(scene)

    expect(stateValue(messages, 'encendido')).toBe(true)
    expect(errors).toEqual([])
  })

  it('runs a for-each order over a class and its subclasses', () => {
    const animal: ClassDefinition = {
      ...createClassDraft('Animal'),
      methods: [{ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } }],
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
    scene = {
      ...scene,
      objects: [createObject(scene, 'Perro'), createObject(scene, 'Gato')],
    }
    scene = addOrder(scene, {
      kind: 'for_each',
      target: '',
      class: 'Animal',
      variable: 'animal',
      method: 'hablar',
      args: {},
    })

    const { messages, errors } = run(scene)

    expect(errors).toEqual([])
    expect(targetState(messages, 'perro1', 'sonido')).toBe('guau')
    expect(targetState(messages, 'gato1', 'sonido')).toBe('miau')
  })
})
