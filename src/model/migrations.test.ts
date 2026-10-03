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

  it('upgrades a v3 project by adding key and signal', () => {
    const input = {
      version: 3,
      meta: { name: 'Demo' },
      scenes: [{ id: 'scene-1', name: 'Principal', events: [{ type: 'on_click', source: 'a' }] }],
    }

    const result = migrateProject(input) as {
      version: number
      scenes: { events: { key: unknown; signal: unknown }[] }[]
    }

    expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.scenes[0]?.events[0]?.key).toBeNull()
    expect(result.scenes[0]?.events[0]?.signal).toBeNull()
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
