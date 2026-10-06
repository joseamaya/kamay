import { describe, expect, it } from 'vitest'

import { blocksToCode } from '../generator'
import { codeToBlocks, createClassDraft, createScene, upsertClass } from './index'

function setup() {
  const draft = createClassDraft('Heroe')
  draft.attributes.push({ name: 'vida', type: 'number', initial: 100 })
  draft.methods.push({
    name: 'saltar',
    parameters: [{ name: 'veces', type: 'number' }],
    body: { kind: 'blocks', ops: [] },
  })
  draft.methods.push({
    name: 'saludar',
    parameters: [{ name: 'mensaje', type: 'string' }],
    body: { kind: 'blocks', ops: [] },
  })
  const scene = upsertClass(createScene('Principal'), draft)
  return { scene, draft }
}

describe('codeToBlocks', () => {
  it('parses calls, assignments and repeats into blocks', () => {
    const { scene, draft } = setup()
    const ops = codeToBlocks(
      scene,
      draft,
      `self.saludar("hola")
self.vida = 50
for _ in range(3):
    self.saltar(2)`,
    )

    expect(ops.map((op) => op.op)).toEqual(['call', 'set', 'repeat'])
    expect(ops[0]?.args).toMatchObject({ method: 'saludar', values: { mensaje: 'hola' } })
    expect(ops[1]?.args).toMatchObject({ name: 'vida', value: 50 })
    expect(ops[2]?.args).toMatchObject({ times: 3 })
    expect(ops[2]?.children.map((op) => op.op)).toEqual(['call'])
    expect(ops[2]?.children[0]?.args).toMatchObject({ method: 'saltar', values: { veces: 2 } })
  })

  it('keeps unrepresentable statements as advanced code', () => {
    const { scene, draft } = setup()
    const ops = codeToBlocks(
      scene,
      draft,
      `if self.vida > 0:
    self.saludar("vivo")
self.saltar(1)`,
    )

    expect(ops.map((op) => op.op)).toEqual(['code', 'call'])
    expect(String(ops[0]?.args.code)).toContain('if self.vida > 0:')
    expect(String(ops[0]?.args.code)).toContain('self.saludar("vivo")')
  })

  it('marks unknown calls, complex values and unknown attributes as advanced', () => {
    const { scene, draft } = setup()

    expect(codeToBlocks(scene, draft, 'self.inexistente()')[0]?.op).toBe('code')
    expect(codeToBlocks(scene, draft, 'self.mover(1 + 2, 0)')[0]?.op).toBe('code')
    expect(codeToBlocks(scene, draft, 'self.desconocido = 1')[0]?.op).toBe('code')
  })

  it('parses attribute increments and decrements', () => {
    const { scene, draft } = setup()
    const ops = codeToBlocks(
      scene,
      draft,
      `self.vida = self.vida + 10
self.vida = self.vida - 5`,
    )

    expect(ops.map((op) => op.op)).toEqual(['change', 'change'])
    expect(ops[0]?.args).toMatchObject({ name: 'vida', operator: '+', amount: 10 })
    expect(ops[1]?.args).toMatchObject({ name: 'vida', operator: '-', amount: 5 })
  })

  it('round-trips an attribute change', () => {
    const { scene, draft } = setup()
    const code = 'self.vida = self.vida + 10'

    expect(blocksToCode(scene, draft, codeToBlocks(scene, draft, code))).toBe(code)
  })

  it('round-trips representable code', () => {
    const { scene, draft } = setup()
    const code = `self.decir("hola")
self.vida = 50
for _ in range(2):
    self.mover(1, 2)`

    expect(blocksToCode(scene, draft, codeToBlocks(scene, draft, code))).toBe(code)
  })

  it('round-trips advanced code', () => {
    const { scene, draft } = setup()
    const code = `if self.vida > 0:
    self.decir("vivo")`

    expect(blocksToCode(scene, draft, codeToBlocks(scene, draft, code))).toBe(code)
  })
})
