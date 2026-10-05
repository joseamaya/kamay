import { ACTOR_CATALOG, BASE_CLASS, classCustomAttributes } from '../model'
import type { Action, ClassDefinition, ObjectInstance, Project, SceneEvent } from '../model'

export type MissionId =
  | 'first_object'
  | 'give_order'
  | 'say_hello'
  | 'move_it'
  | 'own_class'
  | 'own_attribute'
  | 'own_method'
  | 'inherit'
  | 'wait_sequence'
  | 'collision'
  | 'signal'
  | 'compose'

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
    id: 'inherit',
    isComplete: (project) =>
      classes(project).some(
        (definition) => definition.inherits != null && definition.inherits !== BASE_CLASS,
      ),
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
    id: 'compose',
    isComplete: (project) =>
      classes(project).some((definition) => definition.components.length > 0),
  },
]

export const BADGES: Badge[] = [
  { id: 'objects', missions: ['first_object'] },
  { id: 'orders', missions: ['give_order', 'say_hello', 'move_it'] },
  { id: 'classes', missions: ['own_class', 'own_attribute', 'own_method'] },
  { id: 'inheritance', missions: ['inherit'] },
  { id: 'events', missions: ['collision', 'signal'] },
  { id: 'sequences', missions: ['wait_sequence'] },
  { id: 'composition', missions: ['compose'] },
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
