import { CURRENT_SCHEMA_VERSION } from './schema'

export type SchemaMigration = (data: Record<string, unknown>) => Record<string, unknown>

/**
 * Ordered registry of migrations keyed by the version they upgrade *from*.
 * Example: `migrations[1]` upgrades a v1 project to v2.
 */
function mapEvents(
  data: Record<string, unknown>,
  version: number,
  mapper: (event: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> {
  const scenes = Array.isArray(data.scenes) ? (data.scenes as Record<string, unknown>[]) : []
  return {
    ...data,
    version,
    scenes: scenes.map((scene) => {
      const events = Array.isArray(scene.events) ? (scene.events as Record<string, unknown>[]) : []
      return { ...scene, events: events.map(mapper) }
    }),
  }
}

function mapScenes(
  data: Record<string, unknown>,
  version: number,
  mapper: (scene: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> {
  const scenes = Array.isArray(data.scenes) ? (data.scenes as Record<string, unknown>[]) : []
  return { ...data, version, scenes: scenes.map(mapper) }
}

export const migrations: Record<number, SchemaMigration> = {
  // v1 -> v2: events gained a `source` field for click/collision triggers.
  1: (data) => mapEvents(data, 2, (event) => ({ source: null, ...event })),
  // v2 -> v3: events gained an `other` field for the collision pair.
  2: (data) => mapEvents(data, 3, (event) => ({ other: null, ...event })),
  // v3 -> v4: events gained `key` (keyboard) and `signal` fields.
  3: (data) => mapEvents(data, 4, (event) => ({ key: null, signal: null, ...event })),
  // v4 -> v5: scenes gained optional physics settings.
  4: (data) =>
    mapScenes(data, 5, (scene) => ({ physics: { enabled: false, gravityY: -9.8 }, ...scene })),
  // v5 -> v6: classes gained `components` for composition.
  5: (data) =>
    mapScenes(data, 6, (scene) => {
      const classes = Array.isArray(scene.classes)
        ? (scene.classes as Record<string, unknown>[])
        : []
      return {
        ...scene,
        classes: classes.map((definition) => ({ components: [], ...definition })),
      }
    }),
}

export class MigrationError extends Error {
  readonly fromVersion: number

  constructor(fromVersion: number) {
    super(`missing_migration_from_version_${fromVersion}`)
    this.name = 'MigrationError'
    this.fromVersion = fromVersion
  }
}

/**
 * Upgrades a persisted project to the current schema version.
 * Non-object inputs and inputs without a numeric version are returned untouched
 * so the schema validation can produce a clear error.
 */
export function migrateProject(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input

  let data = input as Record<string, unknown>
  const version = data.version
  if (typeof version !== 'number') return data

  for (let current = version; current < CURRENT_SCHEMA_VERSION; current += 1) {
    const migration = migrations[current]
    if (!migration) throw new MigrationError(current)
    data = migration(data)
  }

  return data
}
