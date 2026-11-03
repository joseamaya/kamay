import { describe, expect, it } from 'vitest'

import {
  availableBlockAttributes,
  availableBlockMethods,
  availableBlockTargets,
  blockMethodsFor,
  createCallBlock,
  createCallOnBlock,
  createClassDraft,
  createRepeatBlock,
  createScene,
  createSetBlock,
  createSetFromParamBlock,
  upsertClass,
} from './index'

describe('block builders', () => {
  it('creates a call block', () => {
    const block = createCallBlock('decir', { mensaje: 'hola' })
    expect(block.op).toBe('call')
    expect(block.args).toEqual({ method: 'decir', values: { mensaje: 'hola' } })
    expect(block.children).toEqual([])
  })

  it('creates a set block', () => {
    expect(createSetBlock('vida', 10)).toMatchObject({
      op: 'set',
      args: { name: 'vida', value: 10 },
    })
  })

  it('creates a call-on block', () => {
    expect(createCallOnBlock('bateria', 'cargar', { cantidad: 10 })).toMatchObject({
      op: 'call_on',
      args: { target: 'bateria', method: 'cargar', values: { cantidad: 10 } },
      children: [],
    })
  })

  it('creates a set-from-parameter block', () => {
    expect(createSetFromParamBlock('vida', 'cantidad')).toMatchObject({
      op: 'set_from_param',
      args: { name: 'vida', parameter: 'cantidad' },
      children: [],
    })
  })

  it('creates a repeat block', () => {
    expect(createRepeatBlock(4)).toMatchObject({ op: 'repeat', args: { times: 4 }, children: [] })
  })
})

describe('availableBlockMethods', () => {
  it('lists own and inherited methods, without duplicates', () => {
    const base = createClassDraft('Personaje')
    base.methods = [{ name: 'saludar', parameters: [], body: { kind: 'blocks', ops: [] } }]
    let scene = upsertClass(createScene('Principal'), base)

    const heroe = { ...createClassDraft('Heroe'), inherits: 'Personaje' }
    heroe.methods = [
      {
        name: 'decir',
        parameters: [{ name: 'mensaje', type: 'string' }],
        body: { kind: 'blocks', ops: [] },
      },
    ]
    scene = upsertClass(scene, heroe)

    const names = availableBlockMethods(scene, heroe).map((method) => method.name)
    expect(names).toEqual(['decir', 'saludar'])
  })
})

describe('availableBlockAttributes', () => {
  it('lists own and inherited custom attributes', () => {
    const base = createClassDraft('Personaje')
    base.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    let scene = upsertClass(createScene('Principal'), base)

    const heroe = { ...createClassDraft('Heroe'), inherits: 'Personaje' }
    heroe.attributes.push({ name: 'energia', type: 'number', initial: 50 })
    scene = upsertClass(scene, heroe)

    expect(availableBlockAttributes(scene, heroe).map((attribute) => attribute.name)).toEqual([
      'energia',
      'vida',
    ])
  })
})

describe('availableBlockTargets', () => {
  function composed() {
    const bateria = createClassDraft('Bateria')
    bateria.attributes.push({ name: 'carga', type: 'number', initial: 100 })
    bateria.methods.push({
      name: 'cargar',
      parameters: [{ name: 'cantidad', type: 'number' }],
      body: { kind: 'blocks', ops: [] },
    })
    let scene = upsertClass(createScene('Principal'), bateria)

    const robot = {
      ...createClassDraft('Robot'),
      components: [{ name: 'bateria', class: 'Bateria' }],
    }
    robot.methods.push({
      name: 'saludar',
      parameters: [],
      body: { kind: 'blocks', ops: [] },
    })
    scene = upsertClass(scene, robot)
    return { scene, robot }
  }

  it('lists the object itself and the components that have methods', () => {
    const { scene, robot } = composed()
    const targets = availableBlockTargets(scene, robot)

    expect(targets.map((target) => target.name)).toEqual([null, 'bateria'])
    expect(targets[1]).toMatchObject({ className: 'Bateria' })
    expect(targets[1]?.methods.map((method) => method.name)).toEqual(['cargar'])
  })

  it('resolves the methods of each destination', () => {
    const { scene, robot } = composed()

    expect(blockMethodsFor(scene, robot, null).map((method) => method.name)).toEqual(['saludar'])
    expect(blockMethodsFor(scene, robot, 'bateria').map((method) => method.name)).toEqual([
      'cargar',
    ])
    expect(blockMethodsFor(scene, robot, 'nada')).toEqual([])
  })

  it('lists typed references as call destinations', () => {
    const { scene } = composed()
    const radio = {
      ...createClassDraft('Radio'),
      attributes: [
        { name: 'bateria', type: 'reference' as const, initial: '', targetClass: 'Bateria' },
      ],
    }
    const withRadio = upsertClass(scene, radio)
    const targets = availableBlockTargets(withRadio, radio)

    expect(targets.map((target) => target.name)).toEqual([null, 'bateria'])
    expect(targets[1]).toMatchObject({ className: 'Bateria' })
    expect(targets[1]?.methods.map((method) => method.name)).toEqual(['cargar'])
    expect(blockMethodsFor(withRadio, radio, 'bateria').map((method) => method.name)).toEqual([
      'cargar',
    ])
  })
})
