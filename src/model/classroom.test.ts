import { describe, expect, it } from 'vitest'

import {
  classUsageCount,
  createClassDraft,
  createScene,
  duplicateObject,
  hasClassDraftErrors,
  instantiateClass,
  removeClass,
  updateObjectAttributes,
  upsertClass,
  validateClassDraft,
} from './index'
import type { ClassDefinition } from './index'

function sceneWithClass(definition: ClassDefinition) {
  return upsertClass(createScene('Principal'), definition)
}

describe('createClassDraft', () => {
  it('creates a valid draft inheriting Actor with color and shape', () => {
    const draft = createClassDraft('Heroe')
    expect(draft.inherits).toBe('Actor')
    expect(draft.attributes.map((attribute) => attribute.name)).toEqual(['color', 'shape'])
  })
})

describe('upsertClass', () => {
  it('adds a new class', () => {
    const scene = sceneWithClass(createClassDraft('Heroe'))
    expect(scene.classes).toHaveLength(1)
  })

  it('replaces an existing class by id', () => {
    const draft = createClassDraft('Heroe')
    const scene = upsertClass(sceneWithClass(draft), { ...draft, name: 'Heroina' })
    expect(scene.classes).toHaveLength(1)
    expect(scene.classes[0]?.name).toBe('Heroina')
  })

  it('keeps object references in sync when renaming', () => {
    const draft = createClassDraft('Heroe')
    let scene = sceneWithClass(draft)
    scene = instantiateClass(scene, draft.id)
    scene = upsertClass(scene, { ...draft, name: 'Heroina' })

    expect(scene.objects[0]?.class).toBe('Heroina')
  })
})

describe('removeClass', () => {
  it('removes a class without instances', () => {
    const draft = createClassDraft('Heroe')
    const scene = removeClass(sceneWithClass(draft), draft.id)
    expect(scene.classes).toHaveLength(0)
  })

  it('keeps a class that still has instances', () => {
    const draft = createClassDraft('Heroe')
    let scene = sceneWithClass(draft)
    scene = instantiateClass(scene, draft.id)
    expect(removeClass(scene, draft.id).classes).toHaveLength(1)
  })
})

describe('instantiateClass', () => {
  it('creates a named object with the class visuals', () => {
    const draft = createClassDraft('Heroe')
    const scene = instantiateClass(sceneWithClass(draft), draft.id)

    const object = scene.objects[0]!
    expect(object.class).toBe('Heroe')
    expect(object.name).toBe('heroe1')
    expect(object.attributes).toMatchObject({ x: 0, y: 0, rotation: 0, scale: 1 })
    expect(classUsageCount(scene, 'Heroe')).toBe(1)
  })
})

describe('per-instance state', () => {
  it('seeds custom attributes when instantiating', () => {
    const draft = createClassDraft('Heroe')
    draft.attributes.push({ name: 'vida', type: 'number', initial: 100 })

    const scene = instantiateClass(sceneWithClass(draft), draft.id)
    expect(scene.objects[0]?.attributes.vida).toBe(100)
  })

  it('keeps instances independent', () => {
    const draft = createClassDraft('Heroe')
    draft.attributes.push({ name: 'vida', type: 'number', initial: 100 })

    let scene = instantiateClass(sceneWithClass(draft), draft.id)
    scene = instantiateClass(scene, draft.id)
    scene = updateObjectAttributes(scene, scene.objects[0]!.id, { vida: 50 })

    expect(scene.objects[0]?.attributes.vida).toBe(50)
    expect(scene.objects[1]?.attributes.vida).toBe(100)
  })

  it('duplicates an object under a new name', () => {
    const draft = createClassDraft('Heroe')
    let scene = instantiateClass(sceneWithClass(draft), draft.id)
    const source = scene.objects[0]!

    scene = duplicateObject(scene, source.id)
    const clone = scene.objects[1]!

    expect(scene.objects).toHaveLength(2)
    expect(clone.id).not.toBe(source.id)
    expect(clone.name).toBe('heroe2')
    expect(clone.attributes).toEqual(source.attributes)
  })
})

describe('validateClassDraft', () => {
  it('accepts a valid draft', () => {
    expect(
      hasClassDraftErrors(validateClassDraft(createScene('Principal'), createClassDraft('Heroe'))),
    ).toBe(false)
  })

  it('flags an invalid or duplicate name', () => {
    const scene = sceneWithClass(createClassDraft('Heroe'))
    const invalid = { ...createClassDraft('2Heroe') }
    expect(validateClassDraft(scene, invalid).nameInvalid).toBe(true)

    const duplicate = { ...createClassDraft('Heroe') }
    expect(validateClassDraft(scene, duplicate).nameTaken).toBe(true)
  })

  it('flags reserved attribute names', () => {
    const draft = createClassDraft('Heroe')
    draft.attributes.push({ name: 'x', type: 'number', initial: 0 })
    expect(validateClassDraft(createScene('Principal'), draft).attributes.some(Boolean)).toBe(true)
  })

  it('flags duplicated attributes and invalid parameters', () => {
    const draft = createClassDraft('Heroe')
    draft.attributes = [
      { name: 'color', type: 'string', initial: '#fff' },
      { name: 'color', type: 'string', initial: '#000' },
    ]
    draft.methods = [
      {
        name: 'saludar',
        parameters: [
          { name: 'x', type: 'number' },
          { name: 'x', type: 'number' },
        ],
        body: { kind: 'code', code: '' },
      },
    ]

    const errors = validateClassDraft(createScene('Principal'), draft)
    expect(errors.attributes.some(Boolean)).toBe(true)
    expect(errors.methods[0]?.invalidParameters).toBe(true)
  })
})
