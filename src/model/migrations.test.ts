import { describe, expect, it } from 'vitest'

import { CURRENT_SCHEMA_VERSION, MigrationError, migrateProject } from './index'

describe('migrateProject', () => {
  it('returns the input untouched when it is not an object', () => {
    expect(migrateProject('nope')).toBe('nope')
    expect(migrateProject(null)).toBeNull()
  })

  it('returns the input untouched when there is no numeric version', () => {
    const input = { meta: { name: 'Demo' } }
    expect(migrateProject(input)).toBe(input)
  })

  it('keeps a project already at the current version unchanged', () => {
    const input = { version: CURRENT_SCHEMA_VERSION, meta: { name: 'Demo' }, scenes: [] }
    expect(migrateProject(input)).toEqual(input)
  })

  it('throws when a required migration is missing', () => {
    expect(() => migrateProject({ version: 0 })).toThrow(MigrationError)
  })

  it('upgrades a v1 project to the current version', () => {
    const input = {
      version: 1,
      meta: { name: 'Demo' },
      scenes: [{ id: 'scene-1', name: 'Principal', events: [{ type: 'on_click', actions: [] }] }],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { events: { source: unknown; other: unknown }[] }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.events[0]?.source).toBeNull()
    expect(result.scenes[0]?.events[0]?.other).toBeNull()
  })

  it('upgrades a v5 project by adding class components', () => {
    const input = {
      version: 5,
      meta: { name: 'Demo' },
      scenes: [{ id: 'scene-1', name: 'Principal', classes: [{ id: 'c', name: 'Heroe' }] }],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { classes: { components: unknown }[] }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.classes[0]?.components).toEqual([])
  })

  it('upgrades a v6 project by adding class visuals', () => {
    const input = {
      version: 6,
      meta: { name: 'Demo' },
      scenes: [{ id: 'scene-1', name: 'Principal', classes: [{ id: 'c', name: 'Heroe' }] }],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { classes: { visuals: unknown }[] }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.classes[0]?.visuals).toEqual([])
  })

  it('upgrades a v7 project: drops Actor, primitives become state and signals go', () => {
    const input = {
      version: 7,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'c',
              name: 'Heroe',
              inherits: 'Actor',
              methods: [
                {
                  name: 'rutina',
                  body: {
                    kind: 'blocks',
                    ops: [
                      {
                        id: 'b1',
                        op: 'call',
                        args: { method: 'decir', values: { mensaje: 'hola' } },
                      },
                      { id: 'b2', op: 'call', args: { method: 'mover', values: { x: 1, y: 2 } } },
                      {
                        id: 'b3',
                        op: 'call',
                        args: { method: 'esperar', values: { segundos: 1 } },
                      },
                    ],
                  },
                },
              ],
            },
          ],
          events: [
            { type: 'on_signal', signal: 'boom', actions: [] },
            { type: 'on_click', source: 'a', signal: null, actions: [] },
          ],
        },
      ],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: {
        classes: {
          inherits: unknown
          methods: { body: { ops: { op: string; args: Record<string, unknown> }[] } }[]
        }[]
        events: { type: string; signal?: unknown }[]
      }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.classes[0]?.inherits).toBeNull()

    const ops = result.scenes[0]?.classes[0]?.methods[0]?.body.ops ?? []
    expect(ops.map((op) => op.op)).toEqual(['set', 'set', 'set'])
    expect(ops[0]?.args).toEqual({ name: 'mensaje', value: 'hola' })
    expect(ops[1]?.args).toEqual({ name: 'x', value: 1 })
    expect(ops[2]?.args).toEqual({ name: 'y', value: 2 })

    expect(result.scenes[0]?.events).toHaveLength(1)
    expect(result.scenes[0]?.events[0]?.signal).toBeUndefined()
  })

  it('upgrades a v8 project by tagging actions as call', () => {
    const input = {
      version: 8,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          events: [{ type: 'on_start', actions: [{ target: 'a', method: 'saludar', args: {} }] }],
        },
      ],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { events: { actions: { kind: unknown }[] }[] }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.events[0]?.actions[0]?.kind).toBe('call')
  })

  it('upgrades a v9 project: appearance leaves the attributes', () => {
    const input = {
      version: 9,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'c',
              name: 'Heroe',
              attributes: [
                { name: 'color', type: 'string', initial: '#fff' },
                { name: 'shape', type: 'string', initial: 'circle' },
                { name: 'vida', type: 'number', initial: 100 },
              ],
            },
          ],
          objects: [
            {
              id: 'o',
              name: 'h1',
              class: 'Heroe',
              attributes: { x: 0, color: '#000', glyph: '🐶' },
            },
          ],
        },
      ],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: {
        classes: { appearance: Record<string, unknown>; attributes: { name: string }[] }[]
        objects: { appearance: Record<string, unknown>; attributes: Record<string, unknown> }[]
      }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    const definition = result.scenes[0]!.classes[0]!
    expect(definition.appearance).toEqual({ color: '#fff', shape: 'circle', glyph: null })
    expect(definition.attributes.map((attribute) => attribute.name)).toEqual(['vida'])

    const object = result.scenes[0]!.objects[0]!
    expect(object.appearance).toEqual({ color: '#000', shape: null, glyph: '🐶' })
    expect(object.attributes).toEqual({ x: 0 })
  })

  it('upgrades a v4 project by adding physics settings', () => {
    const input = {
      version: 4,
      meta: { name: 'Demo' },
      scenes: [{ id: 'scene-1', name: 'Principal' }],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { physics: { enabled: boolean; gravityY: number } }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.physics).toEqual({ enabled: false, gravityY: -9.8 })
  })

  it('upgrades a v3 project by adding key', () => {
    const input = {
      version: 3,
      meta: { name: 'Demo' },
      scenes: [{ id: 'scene-1', name: 'Principal', events: [{ type: 'on_click', source: 'a' }] }],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { events: { key: unknown }[] }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.events[0]?.key).toBeNull()
  })

  it('upgrades a v2 project by adding the collision other', () => {
    const input = {
      version: 2,
      meta: { name: 'Demo' },
      scenes: [
        { id: 'scene-1', name: 'Principal', events: [{ type: 'on_collision', source: 'a' }] },
      ],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { events: { other: unknown }[] }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.events[0]?.other).toBeNull()
  })
})
