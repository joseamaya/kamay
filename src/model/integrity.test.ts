import { describe, expect, it } from 'vitest'

import { validateProjectIntegrity } from './integrity'
import { projectSchema } from './schema'

function project(scene: Record<string, unknown>) {
  return projectSchema.parse({
    version: 9,
    meta: { name: 'X' },
    scenes: [{ id: 's', name: 'Principal', ...scene }],
  })
}

const method = { name: 'saludar', parameters: [], body: { kind: 'blocks', ops: [] } }

describe('validateProjectIntegrity', () => {
  it('accepts a consistent project, including domain bases', () => {
    const value = project({
      classes: [
        { id: 'c', name: 'Heroe', inherits: 'Vehiculo' },
        { id: 'd', name: 'Guerrero', inherits: 'Heroe' },
      ],
      objects: [{ id: 'o', name: 'h1', class: 'Guerrero' }],
      events: [
        {
          type: 'on_start',
          actions: [{ target: 'h1', method: 'saludar', args: {} }],
        },
      ],
    })

    expect(validateProjectIntegrity(value)).toEqual([])
  })

  it('reports an object whose class does not exist', () => {
    const value = project({ objects: [{ id: 'o', name: 'h1', class: 'Fantasma' }] })
    expect(validateProjectIntegrity(value).map((issue) => issue.code)).toContain(
      'object_class_missing',
    )
  })

  it('reports a missing base class and an inheritance cycle', () => {
    const missing = project({ classes: [{ id: 'c', name: 'Heroe', inherits: 'Nadie' }] })
    expect(validateProjectIntegrity(missing).map((issue) => issue.code)).toContain(
      'inherits_missing',
    )

    const cycle = project({
      classes: [
        { id: 'a', name: 'A', inherits: 'B' },
        { id: 'b', name: 'B', inherits: 'A' },
      ],
    })
    expect(validateProjectIntegrity(cycle).map((issue) => issue.code)).toContain(
      'inheritance_cycle',
    )
  })

  it('reports a composition cycle', () => {
    const value = project({
      classes: [
        { id: 'a', name: 'A', components: [{ name: 'b', class: 'B' }] },
        { id: 'b', name: 'B', components: [{ name: 'a', class: 'A' }] },
      ],
    })
    expect(validateProjectIntegrity(value).map((issue) => issue.code)).toContain(
      'composition_cycle',
    )
  })

  it('reports dangling event sources and action targets', () => {
    const value = project({
      classes: [{ id: 'c', name: 'Heroe', methods: [method] }],
      events: [
        { type: 'on_click', source: 'fantasma', actions: [] },
        { type: 'on_start', actions: [{ target: 'nadie', method: 'saludar', args: {} }] },
      ],
    })
    const codes = validateProjectIntegrity(value).map((issue) => issue.code)
    expect(codes).toContain('event_source_missing')
    expect(codes).toContain('action_target_missing')
  })

  it('reports a for-each action over a missing class', () => {
    const value = project({
      classes: [{ id: 'c', name: 'Heroe', methods: [method] }],
      objects: [{ id: 'o', name: 'h1', class: 'Heroe' }],
      events: [
        {
          type: 'on_start',
          actions: [
            {
              kind: 'for_each',
              target: '',
              class: 'Fantasma',
              variable: 'x',
              method: 'saludar',
              args: {},
            },
          ],
        },
      ],
    })
    expect(validateProjectIntegrity(value).map((issue) => issue.code)).toContain(
      'action_class_missing',
    )
  })
})
