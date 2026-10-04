import { ACTOR_CATALOG, BASE_CLASS } from '../model'
import type { Project } from '../model'
import type { MissionId } from '../missions'

export const MAX_LEVEL = 5

export interface Level {
  id: number
  /** Missions that must be completed to unlock the next level. */
  missions: MissionId[]
}

export const LEVELS: Level[] = [
  { id: 1, missions: ['first_object'] },
  { id: 2, missions: ['give_order', 'say_hello', 'move_it'] },
  { id: 3, missions: ['own_class', 'own_attribute', 'own_method'] },
  { id: 4, missions: ['collision', 'wait_sequence', 'signal'] },
  { id: 5, missions: ['inherit'] },
]

export interface Capabilities {
  /** Edit literal values directly in the generated code. */
  editValues: boolean
  /** Orders panel with basic methods and start/click triggers. */
  orders: boolean
  /** Create and edit your own classes. */
  ownClasses: boolean
  /** Build method bodies with blocks. */
  blocks: boolean
  /** Collision/key/signal events plus `esperar` and `emitir`. */
  events: boolean
  /** Edit method bodies as free code. */
  freeCode: boolean
  /** Choose a base class. */
  inheritance: boolean
}

export const FREE_CAPABILITIES: Capabilities = {
  editValues: true,
  orders: true,
  ownClasses: true,
  blocks: true,
  events: true,
  freeCode: true,
  inheritance: true,
}

export const BASIC_METHODS = ['decir', 'mover', 'girar', 'cambiar_escala']
export const ADVANCED_METHODS = ['esperar', 'emitir']
export const BASIC_TRIGGERS = ['on_start', 'on_click']
export const ADVANCED_TRIGGERS = ['on_collision', 'on_key', 'on_signal']

export function capabilitiesFor(level: number): Capabilities {
  const value = Math.min(Math.max(level, 1), MAX_LEVEL)
  return {
    editValues: value >= 2,
    orders: value >= 2,
    ownClasses: value >= 3,
    blocks: value >= 3,
    events: value >= 4,
    freeCode: value >= 4,
    inheritance: value >= 5,
  }
}

/** Highest level unlocked by the missions completed so far. */
export function levelFromMissions(completed: readonly MissionId[]): number {
  let level = 1
  for (const definition of LEVELS) {
    if (!definition.missions.every((id) => completed.includes(id))) break
    level = Math.min(definition.id + 1, MAX_LEVEL)
  }
  return level
}

const CATALOG_CLASS_NAMES = new Set([...ACTOR_CATALOG.map((item) => item.className), BASE_CLASS])

/** Minimum level needed to keep a loaded project fully editable. */
export function requiredLevel(project: Project): number {
  const classes = project.scenes.flatMap((scene) => scene.classes)
  const events = project.scenes.flatMap((scene) => scene.events)
  const actions = events.flatMap((event) => event.actions)

  if (classes.some((definition) => definition.inherits && definition.inherits !== BASE_CLASS))
    return 5

  const advancedEvents = events.some(
    (event) =>
      event.type === 'on_collision' || event.type === 'on_key' || event.type === 'on_signal',
  )
  const advancedMethods = actions.some(
    (action) => action.method === 'esperar' || action.method === 'emitir',
  )
  if (advancedEvents || advancedMethods) return 4

  if (classes.some((definition) => !CATALOG_CLASS_NAMES.has(definition.name))) return 3

  return 1
}
