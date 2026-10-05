import {
  ACTOR_CATALOG,
  BASE_CLASS,
  classCustomAttributes,
  resolveAttributeDefaults,
  resolveCustomAttributes,
} from '../model'
import type { Action, ClassDefinition, ObjectInstance, Project, Scene, SceneEvent } from '../model'

export type MissionId =
  | 'first_object'
  | 'give_order'
  | 'say_hello'
  | 'move_it'
  | 'own_class'
  | 'own_attribute'
  | 'own_method'
  | 'two_instances'
  | 'inherit'
  | 'inherited_behavior'
  | 'wait_sequence'
  | 'collision'
  | 'signal'
  | 'compose'
  | 'composed_part'

export type BadgeId =
  'objects' | 'orders' | 'classes' | 'inheritance' | 'events' | 'sequences' | 'composition'

export interface Mission {
  id: MissionId
  isComplete: (project: Project) => boolean
}

export interface Badge {
  id: BadgeId
  missions: MissionId[]
}

const CATALOG_CLASS_NAMES = new Set([...ACTOR_CATALOG.map((item) => item.className), BASE_CLASS])

function classes(project: Project): ClassDefinition[] {
  return project.scenes.flatMap((scene) => scene.classes)
}

function objects(project: Project): ObjectInstance[] {
  return project.scenes.flatMap((scene) => scene.objects)
}

function events(project: Project): SceneEvent[] {
  return project.scenes.flatMap((scene) => scene.events)
}

function actions(project: Project): Action[] {
  return events(project).flatMap((event) => event.actions)
}

export function customClasses(project: Project): ClassDefinition[] {
  return classes(project).filter((definition) => !CATALOG_CLASS_NAMES.has(definition.name))
}

function saysSomething(action: Action): boolean {
  return action.method === 'decir' && String(action.args.mensaje ?? '').trim() !== ''
}

function customClassDefinitions(scene: Scene): ClassDefinition[] {
  return scene.classes.filter((definition) => !CATALOG_CLASS_NAMES.has(definition.name))
}

/** Two instances of the same custom class holding different state. */
function hasDistinctInstances(project: Project): boolean {
  for (const scene of project.scenes) {
    for (const definition of customClassDefinitions(scene)) {
      const instances = scene.objects.filter((object) => object.class === definition.name)
      if (instances.length < 2) continue
      const defaults = resolveAttributeDefaults(scene, definition.name)
      for (const attribute of resolveCustomAttributes(scene, definition.name)) {
        const values = instances.map(
          (object) => object.attributes[attribute.name] ?? defaults[attribute.name] ?? 0,
        )
        if (values.some((value) => value !== values[0])) return true
      }
    }
  }
  return false
}

/** A subclass instance that keeps a method defined only by its custom base. */
function inheritsBehavior(project: Project): boolean {
  for (const scene of project.scenes) {
    for (const definition of scene.classes) {
      const base = definition.inherits
      if (!base || base === BASE_CLASS) continue
      const baseDefinition = scene.classes.find((candidate) => candidate.name === base)
      if (!baseDefinition || CATALOG_CLASS_NAMES.has(baseDefinition.name)) continue
      const own = new Set(definition.methods.map((method) => method.name))
      if (!baseDefinition.methods.some((method) => !own.has(method.name))) continue
      if (scene.objects.some((object) => object.class === definition.name)) return true
    }
  }
  return false
}

/** A class instance whose composed part is a class with behavior or state of its own. */
function composesMeaningfulPart(project: Project): boolean {
  for (const scene of project.scenes) {
    for (const definition of scene.classes) {
      if (definition.components.length === 0) continue
      if (!scene.objects.some((object) => object.class === definition.name)) continue
      const meaningful = definition.components.some((component) => {
        const part = scene.classes.find((candidate) => candidate.name === component.class)
        return part != null && (part.methods.length > 0 || classCustomAttributes(part).length > 0)
      })
      if (meaningful) return true
    }
  }
  return false
}

export const MISSIONS: Mission[] = [
  {
    id: 'first_object',
    isComplete: (project) => objects(project).length > 0,
  },
  {
    id: 'give_order',
    isComplete: (project) => actions(project).length > 0,
  },
  {
    id: 'say_hello',
    isComplete: (project) => actions(project).some(saysSomething),
  },
  {
    id: 'move_it',
    isComplete: (project) => actions(project).some((action) => action.method === 'mover'),
  },
  {
    id: 'own_class',
    isComplete: (project) => customClasses(project).length > 0,
  },
  {
    id: 'own_attribute',
    isComplete: (project) =>
      customClasses(project).some((definition) => classCustomAttributes(definition).length > 0),
  },
  {
    id: 'own_method',
    isComplete: (project) =>
      customClasses(project).some((definition) => definition.methods.length > 0),
  },
  {
    id: 'two_instances',
    isComplete: (project) => hasDistinctInstances(project),
  },
  {
    id: 'wait_sequence',
    isComplete: (project) => actions(project).some((action) => action.method === 'esperar'),
  },
  {
    id: 'collision',
    isComplete: (project) => events(project).some((event) => event.type === 'on_collision'),
  },
  {
    id: 'signal',
    isComplete: (project) =>
      events(project).some((event) => event.type === 'on_signal') ||
      actions(project).some((action) => action.method === 'emitir'),
  },
  {
    id: 'inherit',
    isComplete: (project) =>
      classes(project).some(
        (definition) => definition.inherits != null && definition.inherits !== BASE_CLASS,
      ),
  },
  {
    id: 'inherited_behavior',
    isComplete: (project) => inheritsBehavior(project),
  },
  {
    id: 'compose',
    isComplete: (project) =>
      classes(project).some((definition) => definition.components.length > 0),
  },
  {
    id: 'composed_part',
    isComplete: (project) => composesMeaningfulPart(project),
  },
]

export const BADGES: Badge[] = [
  { id: 'objects', missions: ['first_object'] },
  { id: 'orders', missions: ['give_order', 'say_hello', 'move_it'] },
  { id: 'classes', missions: ['own_class', 'own_attribute', 'own_method', 'two_instances'] },
  { id: 'inheritance', missions: ['inherit', 'inherited_behavior'] },
  { id: 'events', missions: ['collision', 'signal'] },
  { id: 'sequences', missions: ['wait_sequence'] },
  { id: 'composition', missions: ['compose', 'composed_part'] },
]

export function evaluateMissions(project: Project): MissionId[] {
  return MISSIONS.filter((mission) => mission.isComplete(project)).map((mission) => mission.id)
}

export function isBadgeComplete(badge: Badge, completed: readonly MissionId[]): boolean {
  return badge.missions.every((id) => completed.includes(id))
}

export function completedBadges(completed: readonly MissionId[]): BadgeId[] {
  return BADGES.filter((badge) => isBadgeComplete(badge, completed)).map((badge) => badge.id)
}
