import { describe, expect, it } from 'vitest'

import { createClassDraft, createScene, upsertClass } from '../model'
import { detectMisconceptions } from './misconceptions'

function animalWithComer() {
  const animal = createClassDraft('Animal')
  animal.methods.push({ name: 'comer', parameters: [], body: { kind: 'blocks', ops: [] } })
  return animal
}

describe('detectMisconceptions', () => {
  it('flags inheritance used only to reuse', () => {
    const animal = animalWithComer()
    const perro = createClassDraft('Perro')
    perro.inherits = 'Animal'
    let scene = upsertClass(createScene('Principal'), animal)
    scene = upsertClass(scene, perro)

    expect(detectMisconceptions(scene, perro)).toContain('inheritance_for_reuse')
  })

  it('does not flag a subclass that adds its own members', () => {
    const animal = animalWithComer()
    const perro = createClassDraft('Perro')
    perro.inherits = 'Animal'
    perro.methods.push({ name: 'ladrar', parameters: [], body: { kind: 'blocks', ops: [] } })
    let scene = upsertClass(createScene('Principal'), animal)
    scene = upsertClass(scene, perro)

    expect(detectMisconceptions(scene, perro)).not.toContain('inheritance_for_reuse')
  })

  it('flags inheriting from a class it also contains', () => {
    const motor = createClassDraft('Motor')
    const auto = createClassDraft('Auto')
    auto.inherits = 'Motor'
    auto.components = [{ name: 'motor', class: 'Motor' }]
    let scene = upsertClass(createScene('Principal'), motor)
    scene = upsertClass(scene, auto)

    expect(detectMisconceptions(scene, auto)).toContain('inheritance_vs_composition')
  })
})
