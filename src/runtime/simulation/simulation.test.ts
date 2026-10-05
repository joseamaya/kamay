import { describe, expect, it } from 'vitest'

import {
  addEventAction,
  collisionKey,
  createCallBlock,
  createChangeBlock,
  createClassDraft,
  createEmptyProject,
  createObject,
  createScene,
  upsertClass,
} from '../../model'
import type { ClassDefinition, Project, Scene } from '../../model'
import type { RuntimeError, RuntimeMessage } from '../types'
import { hasRawCode, Simulation } from './simulation'

function heroe(): ClassDefinition {
  const draft = createClassDraft('Heroe')
  return {
    ...draft,
    attributes: [...draft.attributes, { name: 'vida', type: 'number', initial: 100 }],
    methods: [
      {
        name: 'saludar',
        parameters: [],
        body: { kind: 'blocks', ops: [createCallBlock('decir', { mensaje: 'hola' })] },
      },
      {
        name: 'curar',
        parameters: [],
        body: { kind: 'blocks', ops: [createChangeBlock('vida', '+', 20)] },
      },
      {
        name: 'avisar',
        parameters: [],
        body: { kind: 'blocks', ops: [createCallBlock('emitir', { nombre: 'listo' })] },
      },
    ],
  }
}

function baseScene(): Scene {
  let scene = upsertClass(createScene('Principal'), heroe())
  scene = { ...scene, objects: [createObject(scene, 'Heroe', { x: 0, y: 0 })] }
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
  it('emits initial state and runs on_start actions', () => {
    let scene = baseScene()
    scene = addEventAction(scene, 'on_start', null, null, {
      target: 'heroe1',
      method: 'saludar',
      args: {},
    })

    const { messages, errors } = run(scene)

    expect(stateValue(messages, 'vida')).toBe(100)
    expect(messages).toContainEqual({ type: 'say', target: 'heroe1', message: 'hola' })
    expect(errors).toEqual([])
  })

  it('runs a custom block method and updates state', () => {
    let scene = baseScene()
    scene = addEventAction(scene, 'on_start', null, null, {
      target: 'heroe1',
      method: 'curar',
      args: {},
    })

    expect(stateValue(run(scene).messages, 'vida')).toBe(120)
  })

  it('dispatches signals to on_signal handlers', () => {
    let scene = baseScene()
    scene = addEventAction(scene, 'on_start', null, null, {
      target: 'heroe1',
      method: 'avisar',
      args: {},
    })
    scene = addEventAction(
      scene,
      'on_signal',
      null,
      null,
      { target: 'heroe1', method: 'curar', args: {} },
      null,
      'listo',
    )

    expect(stateValue(run(scene).messages, 'vida')).toBe(120)
  })

  it('runs a click handler for the matching object', () => {
    let scene = baseScene()
    scene = addEventAction(scene, 'on_click', 'heroe1', null, {
      target: 'heroe1',
      method: 'curar',
      args: {},
    })

    const { simulation, messages } = run(scene)
    simulation.trigger('click', 'heroe1')

    expect(stateValue(messages, 'vida')).toBe(120)
  })

  it('runs a collision handler by its collision key', () => {
    let scene = baseScene()
    scene = { ...scene, objects: [...scene.objects, createObject(scene, 'Heroe')] }
    scene = addEventAction(scene, 'on_collision', 'heroe1', 'heroe2', {
      target: 'heroe1',
      method: 'curar',
      args: {},
    })

    const { simulation, messages } = run(scene)
    simulation.trigger('collision', collisionKey('heroe1', 'heroe2'))

    expect(stateValue(messages, 'vida')).toBe(120)
  })
})
