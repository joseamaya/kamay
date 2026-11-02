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
import type { RuntimeError, RuntimeMessage, RuntimeStatus } from '../types'
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
  const statuses: RuntimeStatus[] = []
  const simulation = new Simulation({
    project,
    sceneId: scene.id,
    emit: (message) => messages.push(message),
    onError: (error) => errors.push(error),
    onStatus: (status) => statuses.push(status),
  })
  simulation.start()
  return { simulation, messages, errors, statuses }
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

describe('Simulation lifecycle events', () => {
  it('reports created, call and return around an order', () => {
    let scene = baseScene()
    scene = addOrder(scene, { target: 'heroe1', method: 'saludar', args: {} })

    const { messages } = run(scene)
    const created = messages.find((message) => message.type === 'created')
    const call = messages.find((message) => message.type === 'call')
    const returned = messages.find((message) => message.type === 'return')

    expect(created).toMatchObject({
      type: 'created',
      name: 'heroe1',
      className: 'Heroe',
      attributes: { vida: 100, sonido: '' },
    })
    expect(call).toMatchObject({
      type: 'call',
      name: 'heroe1',
      className: 'Heroe',
      method: 'saludar',
      args: {},
    })
    expect(returned).toMatchObject({ type: 'return', method: 'saludar' })

    const index = (type: string) => messages.findIndex((message) => message.type === type)
    expect(index('created')).toBeLessThan(index('call'))
    expect(index('call')).toBeLessThan(index('return'))
    expect(messages.at(-1)).toEqual({ type: 'finished' })
  })

  it('forwards the order arguments in the call event', () => {
    let scene = baseScene()
    scene = addOrder(scene, { target: 'heroe1', method: 'curar', args: { cantidad: 5 } })

    const call = run(scene).messages.find((message) => message.type === 'call')

    expect(call).toMatchObject({ type: 'call', method: 'curar', args: { cantidad: 5 } })
  })

  it('nests a method call event inside its caller', () => {
    const combo: ClassDefinition = {
      ...createClassDraft('Heroe'),
      attributes: [{ name: 'vida', type: 'number', initial: 100 }],
      methods: [
        {
          name: 'curar',
          parameters: [],
          body: { kind: 'blocks', ops: [createChangeBlock('vida', '+', 20)] },
        },
        {
          name: 'combo',
          parameters: [],
          body: {
            kind: 'blocks',
            ops: [{ id: 'b1', op: 'call', args: { method: 'curar' }, children: [] }],
          },
        },
      ],
    }
    let scene = upsertClass(createScene('Principal'), combo)
    scene = { ...scene, objects: [createObject(scene, 'Heroe')] }
    scene = addOrder(scene, { target: 'heroe1', method: 'combo', args: {} })

    const { messages } = run(scene)
    const calls = messages
      .filter((message) => message.type === 'call')
      .map((message) => (message.type === 'call' ? message.method : ''))

    expect(calls).toEqual(['combo', 'curar'])
  })
})

describe('Simulation error handling', () => {
  it('stops at the first error, reports it and does not finish', () => {
    let scene = baseScene()
    scene = addOrder(scene, { target: 'heroe1', method: 'no_existe', args: {} })
    scene = addOrder(scene, { target: 'heroe1', method: 'curar', args: {} })

    const { messages, errors, statuses } = run(scene)

    expect(errors).toHaveLength(1)
    expect(statuses).toEqual(['running', 'error'])
    // The order after the failing one never runs.
    expect(stateValue(messages, 'vida')).toBe(100)
    expect(messages.at(-1)?.type).not.toBe('finished')
  })

  it('reports a raw-code method as not simulable', () => {
    const raw: ClassDefinition = {
      ...createClassDraft('Heroe'),
      methods: [{ name: 'curar', parameters: [], body: { kind: 'code', code: 'self.vida += 1' } }],
    }
    let scene = upsertClass(createScene('Principal'), raw)
    scene = { ...scene, objects: [createObject(scene, 'Heroe')] }
    scene = addOrder(scene, { target: 'heroe1', method: 'curar', args: {} })

    const { errors, statuses } = run(scene)

    expect(errors[0]?.message).toContain('código avanzado')
    expect(statuses.at(-1)).toBe('error')
  })

  it('reports an advanced-code block as not simulable', () => {
    const blockCode = { id: 'b1', op: 'code', args: { code: 'self.vida = 1' }, children: [] }
    const raw: ClassDefinition = {
      ...createClassDraft('Heroe'),
      attributes: [{ name: 'vida', type: 'number', initial: 100 }],
      methods: [{ name: 'curar', parameters: [], body: { kind: 'blocks', ops: [blockCode] } }],
    }
    let scene = upsertClass(createScene('Principal'), raw)
    scene = { ...scene, objects: [createObject(scene, 'Heroe')] }
    scene = addOrder(scene, { target: 'heroe1', method: 'curar', args: {} })

    const { errors } = run(scene)

    expect(errors[0]?.message).toContain('código avanzado')
  })
})

describe('Simulation composition', () => {
  type Created = Extract<RuntimeMessage, { type: 'created' }>
  const createdOf = (messages: RuntimeMessage[]): Created[] =>
    messages.filter((message): message is Created => message.type === 'created')

  function composedScene(): Scene {
    const bateria: ClassDefinition = {
      ...createClassDraft('Bateria'),
      attributes: [{ name: 'carga', type: 'number', initial: 100 }],
    }
    const carro: ClassDefinition = {
      ...createClassDraft('Carro'),
      components: [{ name: 'bateria', class: 'Bateria' }],
    }
    let scene = upsertClass(createScene('Principal'), bateria)
    scene = upsertClass(scene, carro)
    scene = { ...scene, objects: [createObject(scene, 'Carro')] }
    scene = { ...scene, objects: [...scene.objects, createObject(scene, 'Carro')] }
    return scene
  }

  it('instantiates the parts of every object with a unique name', () => {
    const { messages, errors } = run(composedScene())

    expect(errors).toEqual([])
    expect(createdOf(messages).map((created) => created.name)).toEqual([
      'carro1.bateria',
      'carro1',
      'carro2.bateria',
      'carro2',
    ])
    expect(createdOf(messages)[0]).toMatchObject({
      className: 'Bateria',
      attributes: { carga: 100 },
    })
    expect(targetState(messages, 'carro1.bateria', 'carga')).toBe(100)
    expect(targetState(messages, 'carro2.bateria', 'carga')).toBe(100)
  })

  it('qualifies nested parts with the whole path', () => {
    const bujia: ClassDefinition = {
      ...createClassDraft('Bujia'),
      attributes: [{ name: 'vida', type: 'number', initial: 1 }],
    }
    const motor: ClassDefinition = {
      ...createClassDraft('Motor'),
      components: [{ name: 'bujia', class: 'Bujia' }],
    }
    const carro: ClassDefinition = {
      ...createClassDraft('Carro'),
      components: [{ name: 'motor', class: 'Motor' }],
    }
    let scene = upsertClass(createScene('Principal'), bujia)
    scene = upsertClass(scene, motor)
    scene = upsertClass(scene, carro)
    scene = { ...scene, objects: [createObject(scene, 'Carro')] }

    const { messages, errors } = run(scene)

    expect(errors).toEqual([])
    expect(targetState(messages, 'carro1.motor.bujia', 'vida')).toBe(1)
  })

  it('reports a composition cycle instead of recursing forever', () => {
    const a: ClassDefinition = {
      ...createClassDraft('A'),
      components: [{ name: 'b', class: 'B' }],
    }
    const b: ClassDefinition = {
      ...createClassDraft('B'),
      components: [{ name: 'a', class: 'A' }],
    }
    let scene = upsertClass(createScene('Principal'), a)
    scene = upsertClass(scene, b)
    scene = { ...scene, objects: [createObject(scene, 'A')] }

    const { errors, statuses } = run(scene)

    expect(errors[0]?.message).toContain('Composición cíclica')
    expect(statuses.at(-1)).toBe('error')
  })

  it('reports a missing component class', () => {
    const carro: ClassDefinition = {
      ...createClassDraft('Carro'),
      components: [{ name: 'motor', class: 'Motor' }],
    }
    let scene = upsertClass(createScene('Principal'), carro)
    scene = { ...scene, objects: [createObject(scene, 'Carro')] }

    const { errors } = run(scene)

    expect(errors[0]?.message).toContain('No existe la clase Motor')
  })

  it('sends a message to a part and mutates only that part', () => {
    const bateria: ClassDefinition = {
      ...createClassDraft('Bateria'),
      attributes: [{ name: 'carga', type: 'number', initial: 100 }],
      methods: [
        {
          name: 'gastar',
          parameters: [],
          body: { kind: 'blocks', ops: [createChangeBlock('carga', '-', 10)] },
        },
      ],
    }
    const carro: ClassDefinition = {
      ...createClassDraft('Carro'),
      components: [{ name: 'bateria', class: 'Bateria' }],
      methods: [
        {
          name: 'usar',
          parameters: [],
          body: {
            kind: 'blocks',
            ops: [
              {
                id: 'b1',
                op: 'call_on',
                args: { target: 'bateria', method: 'gastar' },
                children: [],
              },
            ],
          },
        },
      ],
    }
    let scene = upsertClass(createScene('Principal'), bateria)
    scene = upsertClass(scene, carro)
    scene = { ...scene, objects: [createObject(scene, 'Carro')] }
    scene = { ...scene, objects: [...scene.objects, createObject(scene, 'Carro')] }
    scene = addOrder(scene, { target: 'carro1', method: 'usar', args: {} })

    const { messages, errors } = run(scene)

    expect(errors).toEqual([])
    expect(targetState(messages, 'carro1.bateria', 'carga')).toBe(90)
    expect(targetState(messages, 'carro2.bateria', 'carga')).toBe(100)
    expect(
      messages.some(
        (message) =>
          message.type === 'call' &&
          message.name === 'carro1.bateria' &&
          message.method === 'gastar',
      ),
    ).toBe(true)
  })

  it('reports a call on a missing part', () => {
    const carro: ClassDefinition = {
      ...createClassDraft('Carro'),
      methods: [
        {
          name: 'usar',
          parameters: [],
          body: {
            kind: 'blocks',
            ops: [
              { id: 'b1', op: 'call_on', args: { target: 'motor', method: 'girar' }, children: [] },
            ],
          },
        },
      ],
    }
    let scene = upsertClass(createScene('Principal'), carro)
    scene = { ...scene, objects: [createObject(scene, 'Carro')] }
    scene = addOrder(scene, { target: 'carro1', method: 'usar', args: {} })

    const { errors } = run(scene)

    expect(errors[0]?.message).toContain('No existe la parte motor')
  })
})

describe('Simulation parameters', () => {
  function asignador(): Scene {
    const heroe: ClassDefinition = {
      ...createClassDraft('Heroe'),
      attributes: [{ name: 'vida', type: 'number', initial: 0 }],
      methods: [
        {
          name: 'asignar',
          parameters: [{ name: 'cantidad', type: 'number' }],
          body: {
            kind: 'blocks',
            ops: [
              {
                id: 'b1',
                op: 'set_from_param',
                args: { name: 'vida', parameter: 'cantidad' },
                children: [],
              },
            ],
          },
        },
      ],
    }
    let scene = upsertClass(createScene('Principal'), heroe)
    scene = { ...scene, objects: [createObject(scene, 'Heroe')] }
    return scene
  }

  it('assigns the call argument to the attribute', () => {
    let scene = asignador()
    scene = addOrder(scene, { target: 'heroe1', method: 'asignar', args: { cantidad: 42 } })

    const { messages, errors } = run(scene)

    expect(errors).toEqual([])
    expect(stateValue(messages, 'vida')).toBe(42)
  })

  it('reports a missing argument instead of inventing a value', () => {
    let scene = asignador()
    scene = addOrder(scene, { target: 'heroe1', method: 'asignar', args: {} })

    const { errors, statuses } = run(scene)

    expect(errors[0]?.message).toContain('No se pasó el parámetro cantidad')
    expect(statuses.at(-1)).toBe('error')
  })
})
