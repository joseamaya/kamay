import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  addEventAction,
  createClassDraft,
  createEmptyProject,
  createScene,
  instantiateClass,
  updateObjectAttributes,
  upsertClass,
} from '../model'
import type { Project, Scene } from '../model'
import { evaluateRubric } from './rubric'
import type { RubricCriterionId } from './rubric'

function projectWithScene(scene: Scene): Project {
  return { ...createEmptyProject({ name: 'Demo' }), scenes: [scene] }
}

function status(project: Project, id: RubricCriterionId) {
  return evaluateRubric(project).find((entry) => entry.id === id)!.status
}

describe('evaluateRubric', () => {
  it('reports everything as introduced for an empty project', () => {
    const entries = evaluateRubric(createEmptyProject({ name: 'Demo' }))
    expect(entries).toHaveLength(8)
    expect(entries.every((entry) => entry.status === 'introduced')).toBe(true)
  })

  it('grades objects by count', () => {
    const one = projectWithScene(addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!))
    expect(status(one, 'objects')).toBe('practiced')

    const two = projectWithScene(
      addCatalogObject(
        addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!),
        ACTOR_CATALOG[0]!,
      ),
    )
    expect(status(two, 'objects')).toBe('demonstrated')
  })

  it('demonstrates classes only with an attribute and a method', () => {
    const partial = createClassDraft('Heroe')
    partial.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    expect(
      status(projectWithScene(upsertClass(createScene('Principal'), partial)), 'classes'),
    ).toBe('practiced')

    const full = createClassDraft('Heroe')
    full.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    full.methods.push({ name: 'saludar', parameters: [], body: { kind: 'blocks', ops: [] } })
    expect(status(projectWithScene(upsertClass(createScene('Principal'), full)), 'classes')).toBe(
      'demonstrated',
    )
  })

  it('demonstrates state with two instances holding different values', () => {
    const perro = createClassDraft('Mascota')
    perro.attributes.push({ name: 'energia', type: 'number', initial: 50 })
    let scene: Scene = upsertClass(createScene('Principal'), perro)
    scene = instantiateClass(scene, perro.id)
    scene = instantiateClass(scene, perro.id)
    expect(status(projectWithScene(scene), 'state')).toBe('practiced')

    scene = updateObjectAttributes(scene, scene.objects[0]!.id, { energia: 20 })
    expect(status(projectWithScene(scene), 'state')).toBe('demonstrated')
  })

  it('demonstrates inheritance only when a subclass uses an inherited method', () => {
    const animal = createClassDraft('SerVivo')
    animal.methods.push({ name: 'comer', parameters: [], body: { kind: 'blocks', ops: [] } })
    const perro = createClassDraft('Mascota')
    perro.inherits = 'SerVivo'
    let scene: Scene = upsertClass(createScene('Principal'), animal)
    scene = upsertClass(scene, perro)
    expect(status(projectWithScene(scene), 'inheritance')).toBe('practiced')

    scene = instantiateClass(scene, perro.id)
    expect(status(projectWithScene(scene), 'inheritance')).toBe('demonstrated')
  })

  it('demonstrates polymorphism with two overriding subclasses in use', () => {
    const animal = createClassDraft('SerVivo')
    animal.methods.push({ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } })
    const perro = createClassDraft('Mascota')
    perro.inherits = 'SerVivo'
    perro.methods.push({ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } })
    const gato = createClassDraft('Felino')
    gato.inherits = 'SerVivo'
    gato.methods.push({ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } })

    let scene: Scene = upsertClass(createScene('Principal'), animal)
    scene = upsertClass(scene, perro)
    scene = upsertClass(scene, gato)
    scene = instantiateClass(scene, perro.id)
    scene = instantiateClass(scene, gato.id)
    scene = addEventAction(scene, 'on_start', null, null, {
      target: scene.objects[0]!.name,
      method: 'hablar',
      args: {},
    })
    scene = addEventAction(scene, 'on_start', null, null, {
      target: scene.objects[1]!.name,
      method: 'hablar',
      args: {},
    })

    expect(status(projectWithScene(scene), 'polymorphism')).toBe('demonstrated')
  })

  it('detects events', () => {
    let scene = addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!)
    const name = scene.objects[0]!.name
    scene = addEventAction(scene, 'on_collision', name, 'otro', {
      target: name,
      method: 'prender',
      args: {},
    })

    expect(status(projectWithScene(scene), 'events')).toBe('practiced')
  })
})
