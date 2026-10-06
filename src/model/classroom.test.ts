import { describe, expect, it } from 'vitest'

import {
  availableBaseClasses,
  availableComponentClasses,
  classAncestry,
  classUsageCount,
  createClassDraft,
  createScene,
  duplicateObject,
  hasClassDraftErrors,
  instantiateClass,
  removeClass,
  resolveAttributeDefaults,
  resolveAttributesWithOrigin,
  resolveComponents,
  resolveComponentsWithOrigin,
  resolveCustomAttributes,
  resolveMethods,
  resolveMethodsWithOrigin,
  updateObjectAttributes,
  upsertClass,
  validateClassDraft,
} from './index'
import type { ClassDefinition } from './index'

function sceneWithClass(definition: ClassDefinition) {
  return upsertClass(createScene('Principal'), definition)
}

describe('createClassDraft', () => {
  it('creates a valid root draft with color and shape', () => {
    const draft = createClassDraft('Heroe')
    expect(draft.inherits).toBeNull()
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

describe('inheritance', () => {
  const personaje = createClassDraft('Personaje')
  const heroe = { ...createClassDraft('Heroe'), inherits: 'Personaje' }

  function sceneWithFamily() {
    let scene = upsertClass(createScene('Principal'), personaje)
    scene = upsertClass(scene, heroe)
    return scene
  }

  it('offers the domain bases and non-descendant classes as bases', () => {
    expect(availableBaseClasses(sceneWithFamily(), heroe)).toEqual([
      'Vehiculo',
      'Animal',
      'Cosa',
      'Personaje',
    ])
  })

  it('excludes descendants to avoid cycles', () => {
    expect(availableBaseClasses(sceneWithFamily(), personaje)).not.toContain('Heroe')
  })

  it('propagates inherits when the base class is renamed', () => {
    const scene = upsertClass(sceneWithFamily(), { ...personaje, name: 'Criatura' })
    expect(scene.classes.find((candidate) => candidate.name === 'Heroe')?.inherits).toBe('Criatura')
  })

  it('keeps a class that still has subclasses', () => {
    expect(removeClass(sceneWithFamily(), personaje.id).classes).toHaveLength(2)
  })

  it('resolves inherited attributes, own definitions first', () => {
    const scene = upsertClass(sceneWithFamily(), {
      ...personaje,
      attributes: [
        { name: 'color', type: 'string', initial: '#fff' },
        { name: 'shape', type: 'string', initial: 'circle' },
        { name: 'vida', type: 'number', initial: 100 },
      ],
    })
    expect(resolveCustomAttributes(scene, 'Heroe').map((attribute) => attribute.name)).toEqual([
      'vida',
    ])
    expect(resolveAttributeDefaults(scene, 'Heroe').vida).toBe(100)
  })

  it('resolves inherited methods, own definitions first', () => {
    const scene = upsertClass(sceneWithFamily(), {
      ...personaje,
      methods: [
        { name: 'saludar', parameters: [], body: { kind: 'code', code: '' } },
        { name: 'comer', parameters: [], body: { kind: 'code', code: '' } },
      ],
    })
    expect(resolveMethods(scene, 'Heroe').map((method) => method.name)).toEqual([
      'saludar',
      'comer',
    ])
  })

  it('flags an unknown, self or cyclic base', () => {
    const scene = sceneWithFamily()
    expect(validateClassDraft(scene, { ...heroe, inherits: 'Fantasma' }).inheritsInvalid).toBe(true)
    expect(validateClassDraft(scene, { ...personaje, inherits: 'Personaje' }).inheritsInvalid).toBe(
      true,
    )
    expect(validateClassDraft(scene, { ...personaje, inherits: 'Heroe' }).inheritsInvalid).toBe(
      true,
    )
  })

  it('accepts a valid base', () => {
    expect(validateClassDraft(sceneWithFamily(), heroe).inheritsInvalid).toBe(false)
  })
})

describe('composition', () => {
  const bateria = createClassDraft('Bateria')
  const robot = {
    ...createClassDraft('Robot'),
    components: [{ name: 'bateria', class: 'Bateria' }],
  }

  function sceneWithParts() {
    let scene = upsertClass(createScene('Principal'), bateria)
    scene = upsertClass(scene, robot)
    return scene
  }

  it('resolves own components', () => {
    expect(resolveComponents(sceneWithParts(), 'Robot')).toEqual([
      { name: 'bateria', class: 'Bateria' },
    ])
  })

  it('propagates the class name when the component class is renamed', () => {
    const scene = upsertClass(sceneWithParts(), { ...bateria, name: 'Pila' })
    expect(
      scene.classes.find((candidate) => candidate.name === 'Robot')?.components[0]?.class,
    ).toBe('Pila')
  })

  it('keeps a class that is used as a component', () => {
    expect(removeClass(sceneWithParts(), bateria.id).classes).toHaveLength(2)
  })

  it('flags self and cyclic components', () => {
    const scene = sceneWithParts()
    expect(
      validateClassDraft(scene, { ...robot, components: [{ name: 'yo', class: 'Robot' }] })
        .components[0]?.classInvalid,
    ).toBe(true)
    expect(
      validateClassDraft(scene, { ...bateria, components: [{ name: 'r', class: 'Robot' }] })
        .components[0]?.classInvalid,
    ).toBe(true)
  })

  it('excludes self and cycle-forming classes from available components', () => {
    const scene = sceneWithParts()
    expect(availableComponentClasses(scene, robot)).not.toContain('Robot')
    expect(availableComponentClasses(scene, robot)).toContain('Bateria')
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

describe('resolve with origin', () => {
  function hierarchy() {
    const animal = createClassDraft('Animal')
    animal.attributes.push({ name: 'energia', type: 'number', initial: 50 })
    animal.methods.push({ name: 'comer', parameters: [], body: { kind: 'blocks', ops: [] } })
    const collar = createClassDraft('Collar')
    const perro = createClassDraft('Perro')
    perro.inherits = 'Animal'
    perro.attributes.push({ name: 'nombre', type: 'string', initial: '' })
    perro.methods.push({ name: 'ladrar', parameters: [], body: { kind: 'blocks', ops: [] } })
    perro.components.push({ name: 'collar', class: 'Collar' })
    let scene = createScene('Principal')
    for (const definition of [animal, collar, perro]) scene = upsertClass(scene, definition)
    return scene
  }

  it('reports the declaring class of attributes, methods and components', () => {
    const scene = hierarchy()

    const attributes = resolveAttributesWithOrigin(scene, 'Perro')
    expect(attributes.find((entry) => entry.value.name === 'energia')?.owner).toBe('Animal')
    expect(attributes.find((entry) => entry.value.name === 'nombre')?.owner).toBe('Perro')

    const methods = resolveMethodsWithOrigin(scene, 'Perro')
    expect(methods.find((entry) => entry.value.name === 'comer')?.owner).toBe('Animal')
    expect(methods.find((entry) => entry.value.name === 'ladrar')?.owner).toBe('Perro')

    const components = resolveComponentsWithOrigin(scene, 'Perro')
    expect(components.find((entry) => entry.value.name === 'collar')?.owner).toBe('Perro')
  })

  it('builds the ancestry chain up to the root', () => {
    const scene = hierarchy()
    expect(classAncestry(scene, 'Perro')).toEqual(['Perro', 'Animal'])
    expect(classAncestry(scene, 'Animal')).toEqual(['Animal'])
  })
})
