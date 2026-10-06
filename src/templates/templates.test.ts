import { describe, expect, it } from 'vitest'

import { parseProject } from '../model'
import { TEMPLATES } from './templates'

function build(id: string) {
  return TEMPLATES.find((template) => template.id === id)!.build()
}

describe('TEMPLATES', () => {
  it('builds schema-valid projects', () => {
    for (const template of TEMPLATES) {
      const result = parseProject(template.build())
      expect(result.success, template.id).toBe(true)
    }
  })

  it('hello greets on start', () => {
    const actions = build('hello').scenes[0]!.events.flatMap((event) => event.actions)
    expect(actions.some((action) => action.method === 'tocar_bocina')).toBe(true)
  })

  it('chase reacts to a collision', () => {
    const events = build('chase').scenes[0]!.events
    expect(events.some((event) => event.type === 'on_collision')).toBe(true)
  })

  it('own_class defines a class with an attribute and a method', () => {
    const definition = build('own_class').scenes[0]!.classes[0]!
    expect(definition.attributes.some((attribute) => attribute.name === 'vida')).toBe(true)
    expect(definition.methods.some((method) => method.name === 'saludar')).toBe(true)
  })

  it('inheritance has a derived class', () => {
    const classes = build('inheritance').scenes[0]!.classes
    expect(classes.some((definition) => definition.inherits === 'Personaje')).toBe(true)
  })

  it('physics enables gravity', () => {
    expect(build('physics').scenes[0]!.physics.enabled).toBe(true)
  })
})
