import { describe, expect, it } from 'vitest'

import {
  ACTOR_CATALOG,
  addCatalogObject,
  addEventAction,
  createClassDraft,
  createEmptyProject,
  createScene,
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
  it('reports nothing for an empty project', () => {
    const entries = evaluateRubric(createEmptyProject({ name: 'Demo' }))
    expect(entries).toHaveLength(6)
    expect(entries.every((entry) => entry.status === 'none')).toBe(true)
  })

  it('grades objects by count', () => {
    const one = projectWithScene(addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!))
    expect(status(one, 'objects')).toBe('partial')

    const two = projectWithScene(
      addCatalogObject(
        addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!),
        ACTOR_CATALOG[0]!,
      ),
    )
    expect(status(two, 'objects')).toBe('achieved')
  })

  it('grades classes as achieved with an attribute and a method', () => {
    const definition = createClassDraft('Heroe')
    definition.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    definition.methods.push({ name: 'saludar', parameters: [], body: { kind: 'blocks', ops: [] } })

    const project = projectWithScene(upsertClass(createScene('Principal'), definition))
    expect(status(project, 'classes')).toBe('achieved')
  })

  it('detects inheritance, events and sequences', () => {
    const base = createClassDraft('Personaje')
    const child = createClassDraft('Heroe')
    child.inherits = 'Personaje'

    let scene = upsertClass(createScene('Principal'), base)
    scene = upsertClass(scene, child)
    scene = addCatalogObject(scene, ACTOR_CATALOG[0]!)
    const name = scene.objects[0]!.name
    scene = addEventAction(scene, 'on_collision', name, 'otro', {
      target: name,
      method: 'esperar',
      args: { segundos: 1 },
    })

    const project = projectWithScene(scene)
    expect(status(project, 'inheritance')).toBe('achieved')
    expect(status(project, 'events')).toBe('partial')
    expect(status(project, 'sequences')).toBe('partial')
  })
})
