import { createId } from './ids'
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

/** Engine primitives that became state assignments. */
const PRIMITIVE_SETS: Record<
  string,
  (values: Record<string, unknown>) => Record<string, unknown>[]
> = {
  decir: (values) => [{ name: 'mensaje', value: values.mensaje ?? '' }],
  mover: (values) => [
    { name: 'x', value: values.x ?? 0 },
    { name: 'y', value: values.y ?? 0 },
  ],
  girar: (values) => [{ name: 'rotation', value: values.grados ?? 0 }],
  cambiar_escala: (values) => [{ name: 'scale', value: values.factor ?? 1 }],
}

function convertOps(ops: unknown): Record<string, unknown>[] {
  if (!Array.isArray(ops)) return []
  const result: Record<string, unknown>[] = []
  for (const raw of ops) {
    if (typeof raw !== 'object' || raw === null) continue
    const op = raw as Record<string, unknown>
    if (op.op === 'repeat') {
      result.push({ ...op, children: convertOps(op.children) })
      continue
    }
    if (op.op !== 'call') {
      result.push(op)
      continue
    }
    const args = (op.args ?? {}) as Record<string, unknown>
    const method = String(args.method ?? '')
    const values = (args.values ?? {}) as Record<string, unknown>
    const sets = PRIMITIVE_SETS[method]?.(values) ?? []
    for (const set of sets) {
      result.push({ id: createId('block'), op: 'set', args: set, children: [] })
    }
  }
  return result
}

function convertClass(definition: Record<string, unknown>): Record<string, unknown> {
  const methods = Array.isArray(definition.methods)
    ? (definition.methods as Record<string, unknown>[])
    : []
  return {
    ...definition,
    inherits: definition.inherits === 'Actor' ? null : definition.inherits,
    methods: methods.map((method) => {
      const body = method.body as Record<string, unknown> | undefined
      if (!body || body.kind !== 'blocks') return method
      return { ...method, body: { ...body, ops: convertOps(body.ops) } }
    }),
  }
}

function convertEvents(scene: Record<string, unknown>): Record<string, unknown>[] {
  const events = Array.isArray(scene.events) ? (scene.events as Record<string, unknown>[]) : []
  return events
    .filter((event) => event.type !== 'on_signal')
    .map((event) => {
      const rest = { ...event }
      delete rest.signal
      return rest
    })
}

const APPEARANCE_NAMES = new Set(['color', 'shape', 'glyph'])

function emptyAppearance(): Record<string, unknown> {
  return { color: null, shape: null, glyph: null }
}

/** Splits a class's attribute list into `appearance` and the remaining attributes. */
function splitClassAppearance(attributes: unknown): {
  appearance: Record<string, unknown>
  attributes: Record<string, unknown>[]
} {
  const list = Array.isArray(attributes) ? (attributes as Record<string, unknown>[]) : []
  const appearance = emptyAppearance()
  const rest: Record<string, unknown>[] = []
  for (const attribute of list) {
    const name = typeof attribute.name === 'string' ? attribute.name : ''
    if (APPEARANCE_NAMES.has(name)) appearance[name] = attribute.initial ?? null
    else rest.push(attribute)
  }
  return { appearance, attributes: rest }
}

/** Splits an object's attribute record into `appearance` and the remaining ones. */
function splitObjectAppearance(attributes: unknown): {
  appearance: Record<string, unknown>
  attributes: Record<string, unknown>
} {
  const record =
    typeof attributes === 'object' && attributes !== null
      ? (attributes as Record<string, unknown>)
      : {}
  const appearance = emptyAppearance()
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (APPEARANCE_NAMES.has(key)) appearance[key] = value
    else rest[key] = value
  }
  return { appearance, attributes: rest }
}

/** Engine attributes that became interpreted domain attributes (v10 -> v11). */
const SCENE_RENAME: Record<string, string> = {
  x: 'distancia',
  y: 'altura',
  rotation: 'giro',
  scale: 'tamano',
  mensaje: 'sonido',
}

const SCENE_DEFAULTS: Record<string, { type: string; initial: number | string }> = {
  distancia: { type: 'number', initial: 0 },
  altura: { type: 'number', initial: 0 },
  giro: { type: 'number', initial: 0 },
  tamano: { type: 'number', initial: 1 },
  sonido: { type: 'string', initial: '' },
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

/** Renames `x`/`y`/... to the interpreted domain names, collecting those used. */
function renameSceneOps(ops: unknown, used: Set<string>): Record<string, unknown>[] {
  if (!Array.isArray(ops)) return []
  const result: Record<string, unknown>[] = []
  for (const raw of ops) {
    if (typeof raw !== 'object' || raw === null) continue
    const op = raw as Record<string, unknown>
    if (op.op === 'repeat') {
      result.push({ ...op, children: renameSceneOps(op.children, used) })
      continue
    }
    if (
      (op.op === 'set' || op.op === 'change') &&
      typeof op.args === 'object' &&
      op.args !== null
    ) {
      const args = { ...(op.args as Record<string, unknown>) }
      const renamed = typeof args.name === 'string' ? SCENE_RENAME[args.name] : undefined
      if (renamed) {
        args.name = renamed
        used.add(renamed)
      }
      result.push({ ...op, args })
      continue
    }
    result.push(op)
  }
  return result
}

function migrateClassToV11(definition: Record<string, unknown>): Record<string, unknown> {
  const methods = Array.isArray(definition.methods)
    ? (definition.methods as Record<string, unknown>[])
    : []
  const used = new Set<string>()
  const migratedMethods = methods.map((method) => {
    const body = method.body as Record<string, unknown> | undefined
    if (!body || body.kind !== 'blocks') return method
    return { ...method, body: { ...body, ops: renameSceneOps(body.ops, used) } }
  })

  const attributes = Array.isArray(definition.attributes)
    ? [...(definition.attributes as Record<string, unknown>[])]
    : []
  const existing = new Set(attributes.map((attribute) => attribute.name))
  for (const name of used) {
    if (!existing.has(name)) attributes.push({ name, ...SCENE_DEFAULTS[name] })
  }

  return { ...definition, methods: migratedMethods, attributes }
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
  // v6 -> v7: classes gained `visuals` for state-driven appearance variants.
  6: (data) =>
    mapScenes(data, 7, (scene) => {
      const classes = Array.isArray(scene.classes)
        ? (scene.classes as Record<string, unknown>[])
        : []
      return {
        ...scene,
        classes: classes.map((definition) => ({ visuals: [], ...definition })),
      }
    }),
  // v7 -> v8: `Actor` is gone and primitives became state assignments; signals dropped.
  7: (data) =>
    mapScenes(data, 8, (scene) => {
      const classes = Array.isArray(scene.classes)
        ? (scene.classes as Record<string, unknown>[])
        : []
      return {
        ...scene,
        classes: classes.map(convertClass),
        events: convertEvents(scene),
      }
    }),
  // v8 -> v9: actions gained `kind`; `for_each` iterates the objects of a class.
  8: (data) =>
    mapScenes(data, 9, (scene) => {
      const events = Array.isArray(scene.events) ? (scene.events as Record<string, unknown>[]) : []
      return {
        ...scene,
        events: events.map((event) => {
          const actions = Array.isArray(event.actions)
            ? (event.actions as Record<string, unknown>[])
            : []
          return {
            ...event,
            actions: actions.map((action) => ({ kind: 'call', ...action })),
          }
        }),
      }
    }),
  // v9 -> v10: appearance (color/shape/glyph) leaves the domain attributes and
  // becomes a simulation field on the class and on the object.
  9: (data) =>
    mapScenes(data, 10, (scene) => {
      const classes = Array.isArray(scene.classes)
        ? (scene.classes as Record<string, unknown>[])
        : []
      const objects = Array.isArray(scene.objects)
        ? (scene.objects as Record<string, unknown>[])
        : []
      return {
        ...scene,
        classes: classes.map((definition) => {
          const { appearance, attributes } = splitClassAppearance(definition.attributes)
          return { ...definition, appearance, attributes }
        }),
        objects: objects.map((object) => {
          const { appearance, attributes } = splitObjectAppearance(object.attributes)
          return { ...object, appearance, attributes }
        }),
      }
    }),
  // v10 -> v11: the scene state (position/transform/message) leaves the domain
  // and becomes `object.simulation`; methods use interpreted domain attributes.
  10: (data) =>
    mapScenes(data, 11, (scene) => {
      const classes = Array.isArray(scene.classes)
        ? (scene.classes as Record<string, unknown>[])
        : []
      const objects = Array.isArray(scene.objects)
        ? (scene.objects as Record<string, unknown>[])
        : []
      return {
        ...scene,
        classes: classes.map(migrateClassToV11),
        objects: objects.map((object) => {
          const attributes =
            typeof object.attributes === 'object' && object.attributes !== null
              ? (object.attributes as Record<string, unknown>)
              : {}
          const simulation = {
            x: numberOr(attributes.x, 0),
            y: numberOr(attributes.y, 0),
            rotation: numberOr(attributes.rotation, 0),
            scale: numberOr(attributes.scale, 1),
            mensaje: typeof attributes.mensaje === 'string' ? attributes.mensaje : '',
          }
          const rest: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(attributes)) {
            if (!(key in SCENE_RENAME)) rest[key] = value
          }
          return { ...object, simulation, attributes: rest }
        }),
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
