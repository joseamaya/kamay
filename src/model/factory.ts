import { createId } from './ids'
import type {
  Action,
  Attribute,
  ClassDefinition,
  EventType,
  ObjectInstance,
  Project,
  Scene,
} from './schema'

export type ActorShape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'heart'
  | 'star'

export const ACTOR_SHAPES: ActorShape[] = [
  'circle',
  'square',
  'triangle',
  'rectangle',
  'diamond',
  'pentagon',
  'hexagon',
  'heart',
  'star',
]

export type CatalogKind = 'shape' | 'glyph'

export interface CatalogItem {
  id: string
  className: string
  kind: CatalogKind
  shape: ActorShape
  glyph?: string
  color: string
}

export const ACTOR_CATALOG: CatalogItem[] = [
  { id: 'circle', className: 'Circle', kind: 'shape', shape: 'circle', color: '#e2603a' },
  { id: 'square', className: 'Square', kind: 'shape', shape: 'square', color: '#e0a23c' },
  { id: 'triangle', className: 'Triangle', kind: 'shape', shape: 'triangle', color: '#3f9a86' },
  { id: 'rectangle', className: 'Rectangle', kind: 'shape', shape: 'rectangle', color: '#5b8def' },
  { id: 'diamond', className: 'Diamond', kind: 'shape', shape: 'diamond', color: '#9b6dd6' },
  { id: 'pentagon', className: 'Pentagon', kind: 'shape', shape: 'pentagon', color: '#d66d9b' },
  { id: 'hexagon', className: 'Hexagon', kind: 'shape', shape: 'hexagon', color: '#3f9a86' },
  { id: 'heart', className: 'Heart', kind: 'shape', shape: 'heart', color: '#e2603a' },
  { id: 'star', className: 'Star', kind: 'shape', shape: 'star', color: '#e0a23c' },
  { id: 'cat', className: 'Cat', kind: 'glyph', shape: 'circle', glyph: '🐱', color: '#e0a23c' },
  { id: 'dog', className: 'Dog', kind: 'glyph', shape: 'circle', glyph: '🐶', color: '#c98a4b' },
  {
    id: 'robot',
    className: 'Robot',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🤖',
    color: '#8f9aa8',
  },
  {
    id: 'rocket',
    className: 'Rocket',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🚀',
    color: '#5b8def',
  },
  {
    id: 'apple',
    className: 'Apple',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🍎',
    color: '#d64b4b',
  },
  { id: 'ball', className: 'Ball', kind: 'glyph', shape: 'circle', glyph: '⚽', color: '#3f9a86' },
  { id: 'tree', className: 'Tree', kind: 'glyph', shape: 'circle', glyph: '🌳', color: '#3f9a86' },
  {
    id: 'house',
    className: 'House',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🏠',
    color: '#c98a4b',
  },
]

export const BASE_CLASS = 'Actor'

/** Order-independent key for a pair of objects that can collide. */
export function collisionKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

export const OBJECT_DEFAULTS = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
}

export function findCatalogItem(id: string): CatalogItem | undefined {
  return ACTOR_CATALOG.find((item) => item.id === id)
}

export function isActorShape(value: unknown): value is ActorShape {
  return typeof value === 'string' && (ACTOR_SHAPES as string[]).includes(value)
}

export function catalogClass(item: CatalogItem): ClassDefinition {
  const attributes: Attribute[] = [
    { name: 'color', type: 'string', initial: item.color },
    { name: 'shape', type: 'string', initial: item.shape },
  ]
  if (item.glyph) attributes.push({ name: 'glyph', type: 'string', initial: item.glyph })
  return {
    id: createId('class'),
    name: item.className,
    inherits: BASE_CLASS,
    image: null,
    attributes,
    components: [],
    methods: [],
  }
}

export function nextObjectName(scene: Scene, className: string): string {
  const base = className.toLowerCase()
  let index = 1
  const names = new Set(scene.objects.map((object) => object.name))
  while (names.has(`${base}${index}`)) index += 1
  return `${base}${index}`
}

export function createObject(
  scene: Scene,
  className: string,
  attributes: Record<string, number | string | boolean> = {},
): ObjectInstance {
  return {
    id: createId('object'),
    name: nextObjectName(scene, className),
    class: className,
    attributes: { ...OBJECT_DEFAULTS, ...attributes },
  }
}

export function createObjectFromCatalog(scene: Scene, item: CatalogItem): ObjectInstance {
  return createObject(scene, item.className, {
    color: item.color,
    shape: item.shape,
    ...(item.glyph ? { glyph: item.glyph } : {}),
  })
}

/** Adds the catalog object (and its class if missing) to the scene. */
export function addCatalogObject(scene: Scene, item: CatalogItem): Scene {
  const hasClass = scene.classes.some((definition) => definition.name === item.className)
  const classes = hasClass ? scene.classes : [...scene.classes, catalogClass(item)]
  return { ...scene, classes, objects: [...scene.objects, createObjectFromCatalog(scene, item)] }
}

export function removeObject(scene: Scene, objectId: string): Scene {
  const target = scene.objects.find((object) => object.id === objectId)
  if (!target) return scene

  const identifiers = new Set([target.id, target.name])
  return {
    ...scene,
    objects: scene.objects.filter((object) => object.id !== objectId),
    events: scene.events
      .map((event) => ({
        ...event,
        actions: event.actions.filter((action) => !identifiers.has(action.target)),
      }))
      .filter(
        (event) =>
          !(event.source && identifiers.has(event.source)) &&
          !(event.other && identifiers.has(event.other)),
      ),
  }
}

export function updateObjectAttributes(
  scene: Scene,
  objectId: string,
  patch: Record<string, number | string | boolean>,
): Scene {
  return {
    ...scene,
    objects: scene.objects.map((object) =>
      object.id === objectId
        ? { ...object, attributes: { ...object.attributes, ...patch } }
        : object,
    ),
  }
}

export function setSceneBackground(scene: Scene, background: string): Scene {
  return { ...scene, background }
}

export function setScenePhysics(scene: Scene, patch: Partial<Scene['physics']>): Scene {
  return { ...scene, physics: { ...scene.physics, ...patch } }
}

export function renameProject(project: Project, name: string): Project {
  return { ...project, meta: { ...project.meta, name } }
}

interface EventIdentity {
  eventType: EventType
  source: string | null
  other: string | null
  key: string | null
  signal: string | null
}

function sameTrigger(event: Scene['events'][number], identity: EventIdentity) {
  return (
    event.type === identity.eventType &&
    (event.source ?? null) === (identity.source ?? null) &&
    (event.other ?? null) === (identity.other ?? null) &&
    (event.key ?? null) === (identity.key ?? null) &&
    (event.signal ?? null) === (identity.signal ?? null)
  )
}

export function findEvent(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null = null,
  key: string | null = null,
  signal: string | null = null,
): Scene['events'][number] | undefined {
  return scene.events.find((event) => sameTrigger(event, { eventType, source, other, key, signal }))
}

export function addEventAction(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  action: Action,
  key: string | null = null,
  signal: string | null = null,
): Scene {
  const identity = { eventType, source, other, key, signal }
  const events = [...scene.events]
  const index = events.findIndex((event) => sameTrigger(event, identity))
  if (index >= 0) {
    const event = events[index]!
    events[index] = { ...event, actions: [...event.actions, action] }
  } else {
    events.push({
      type: eventType,
      source: source ?? null,
      other: other ?? null,
      key: key ?? null,
      signal: signal ?? null,
      actions: [action],
    })
  }
  return { ...scene, events }
}

/** Updates a single argument of an existing action, keyed by its trigger. */
export function setActionArg(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  actionIndex: number,
  parameter: string,
  value: number | string | boolean,
  key: string | null = null,
  signal: string | null = null,
): Scene {
  const event = findEvent(scene, eventType, source, other, key, signal)
  if (!event) return scene
  const events = scene.events.map((candidate) =>
    candidate === event
      ? {
          ...candidate,
          actions: candidate.actions.map((action, index) =>
            index === actionIndex
              ? { ...action, args: { ...action.args, [parameter]: value } }
              : action,
          ),
        }
      : candidate,
  )
  return { ...scene, events }
}

export function removeEventAction(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  actionIndex: number,
  key: string | null = null,
  signal: string | null = null,
): Scene {
  const identity = { eventType, source, other, key, signal }
  return {
    ...scene,
    events: scene.events.map((event) =>
      sameTrigger(event, identity)
        ? { ...event, actions: event.actions.filter((_, index) => index !== actionIndex) }
        : event,
    ),
  }
}

export function replaceScene(project: Project, scene: Scene): Project {
  return {
    ...project,
    scenes: project.scenes.map((current) => (current.id === scene.id ? scene : current)),
  }
}
