import { createId } from './ids'
import type { Action, ClassDefinition, EventType, ObjectInstance, Project, Scene } from './schema'

export type ActorShape = 'circle' | 'square' | 'triangle'

export interface CatalogItem {
  id: string
  className: string
  shape: ActorShape
  color: string
}

export const ACTOR_CATALOG: CatalogItem[] = [
  { id: 'circle', className: 'Circle', shape: 'circle', color: '#e2603a' },
  { id: 'square', className: 'Square', shape: 'square', color: '#e0a23c' },
  { id: 'triangle', className: 'Triangle', shape: 'triangle', color: '#3f9a86' },
]

export const BASE_CLASS = 'Actor'

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
  return value === 'circle' || value === 'square' || value === 'triangle'
}

export function catalogClass(item: CatalogItem): ClassDefinition {
  return {
    id: createId('class'),
    name: item.className,
    inherits: BASE_CLASS,
    image: null,
    attributes: [
      { name: 'color', type: 'string', initial: item.color },
      { name: 'shape', type: 'string', initial: item.shape },
    ],
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
  return createObject(scene, item.className, { color: item.color, shape: item.shape })
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

export function renameProject(project: Project, name: string): Project {
  return { ...project, meta: { ...project.meta, name } }
}

interface EventIdentity {
  eventType: EventType
  source: string | null
  other: string | null
}

function sameTrigger(event: Scene['events'][number], identity: EventIdentity) {
  return (
    event.type === identity.eventType &&
    (event.source ?? null) === (identity.source ?? null) &&
    (event.other ?? null) === (identity.other ?? null)
  )
}

export function findEvent(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null = null,
): Scene['events'][number] | undefined {
  return scene.events.find((event) => sameTrigger(event, { eventType, source, other }))
}

export function addEventAction(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  action: Action,
): Scene {
  const identity = { eventType, source, other }
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
      actions: [action],
    })
  }
  return { ...scene, events }
}

export function removeEventAction(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  actionIndex: number,
): Scene {
  const identity = { eventType, source, other }
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
