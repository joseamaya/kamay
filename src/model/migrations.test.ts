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

  it('upgrades a v1 project to v2 by adding an event source', () => {
    const input = {
      version: 1,
      meta: { name: 'Demo' },
      scenes: [{ id: 'scene-1', name: 'Principal', events: [{ type: 'on_click', actions: [] }] }],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { events: { source: unknown }[] }[]
    }

    expect(result.version).toBe(2)
    expect(result.scenes[0]?.events[0]?.source).toBeNull()
  })
})
