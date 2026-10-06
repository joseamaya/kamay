import { describe, expect, it } from 'vitest'

import {
  availableBlockAttributes,
  availableBlockMethods,
  createCallBlock,
  createClassDraft,
  createRepeatBlock,
  createScene,
  createSetBlock,
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
      'x',
      'y',
      'rotation',
      'scale',
      'mensaje',
    ])
  })
})
