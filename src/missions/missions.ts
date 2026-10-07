import {
  classCustomAttributes,
  isSystemClassName,
  resolveAttributeDefaults,
  resolveCustomAttributes,
  resolveMethods,
} from '../model'
import type { Action, ClassDefinition, ObjectInstance, Operation, Project, Scene } from '../model'

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
  | 'polymorphism'
  | 'same_message'
  | 'own_code'
  | 'compose'
  | 'composed_part'

export type BadgeId = 'objects' | 'orders' | 'classes' | 'inheritance' | 'code' | 'composition'

export interface Mission {
  id: MissionId
  isComplete: (project: Project) => boolean
}

export interface Badge {
  id: BadgeId
  missions: MissionId[]
}

function classes(project: Project): ClassDefinition[] {
  return project.scenes.flatMap((scene) => scene.classes)
}

function objects(project: Project): ObjectInstance[] {
  return project.scenes.flatMap((scene) => scene.objects)
}

function actions(project: Project): Action[] {
  return project.scenes.flatMap((scene) => scene.orders)
}

export function customClasses(project: Project): ClassDefinition[] {
  return classes(project).filter((definition) => !isSystemClassName(definition.name))
}

function opSetsAttribute(op: Operation, names: Set<string>): boolean {
  if (op.op === 'set' || op.op === 'change') return names.has(String(op.args.name ?? ''))
  if (op.op === 'repeat') return op.children.some((child) => opSetsAttribute(child, names))
  if (op.op === 'code') {
    const code = String(op.args.code ?? '')
    return [...names].some((name) => new RegExp(`self\\.${name}\\s*=`).test(code))
  }
  return false
}

/** Whether a method of the target's class assigns any of the given attributes. */
function actionSetsAttribute(project: Project, names: Set<string>): boolean {
  for (const scene of project.scenes) {
    for (const action of scene.orders) {
      const object = scene.objects.find(
        (candidate) => candidate.id === action.target || candidate.name === action.target,
      )
      if (!object) continue
      const method = resolveMethods(scene, object.class).find(
        (candidate) => candidate.name === action.method,
      )
      if (!method) continue
      const body = method.body
      const sets =
        body.kind === 'code'
          ? [...names].some((name) => new RegExp(`self\\.${name}\\s*=`).test(body.code))
          : body.ops.some((op) => opSetsAttribute(op, names))
      if (sets) return true
    }
  }
  return false
}

function customClassDefinitions(scene: Scene): ClassDefinition[] {
  return scene.classes.filter((definition) => !isSystemClassName(definition.name))
}

/** A custom class that has both an attribute and a method (designed, not just declared). */
export function hasDesignedClass(project: Project): boolean {
  return customClasses(project).some(
    (definition) => classCustomAttributes(definition).length > 0 && definition.methods.length > 0,
  )
}

/** Number of instances whose class is a custom (student-designed) class. */
export function customClassInstanceCount(project: Project): number {
  const names = new Set(customClasses(project).map((definition) => definition.name))
  return objects(project).filter((object) => names.has(object.class)).length
}

/** Two instances of the same custom class holding different state. */
export function hasDistinctInstances(project: Project): boolean {
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
export function inheritsBehavior(project: Project): boolean {
  for (const scene of project.scenes) {
    for (const definition of scene.classes) {
      const base = definition.inherits
      if (!base) continue
      const baseDefinition = scene.classes.find((candidate) => candidate.name === base)
      if (!baseDefinition || isSystemClassName(baseDefinition.name)) continue
      const own = new Set(definition.methods.map((method) => method.name))
      if (!baseDefinition.methods.some((method) => !own.has(method.name))) continue
      if (scene.objects.some((object) => object.class === definition.name)) return true
    }
  }
  return false
}

/** A class instance whose composed part is a class with behavior or state of its own. */
export function composesMeaningfulPart(project: Project): boolean {
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

function inheritsFrom(scene: Scene, className: string, baseName: string): boolean {
  const visited = new Set<string>()
  let current = scene.classes.find((candidate) => candidate.name === className)?.inherits ?? null

  while (current && !visited.has(current)) {
    if (current === baseName) return true
    visited.add(current)
    current = scene.classes.find((candidate) => candidate.name === current)?.inherits ?? null
  }

  return false
}

/**
 * Same message, different behavior: two subclasses override the same base method
 * and that method is called on instances of both.
 */
export function demonstratesPolymorphism(project: Project): boolean {
  for (const scene of project.scenes) {
    const classOf = (target: string) =>
      scene.objects.find((object) => object.id === target || object.name === target)?.class ?? null
    const sceneActions = scene.orders

    for (const base of customClassDefinitions(scene)) {
      for (const method of base.methods) {
        const overriders = scene.classes.filter(
          (candidate) =>
            inheritsFrom(scene, candidate.name, base.name) &&
            candidate.methods.some((own) => own.name === method.name),
        )
        if (overriders.length < 2) continue

        const names = new Set(overriders.map((candidate) => candidate.name))
        const targets = new Set(
          sceneActions
            .filter((action) => action.method === method.name)
            .map((action) => classOf(action.target))
            .filter((name): name is string => name != null && names.has(name)),
        )
        if (targets.size >= 2) return true
      }
    }
  }
  return false
}

/**
 * One loop, many responses: a `for_each` action sends the same method to two or
 * more classes covered by the loop (the loop class or its subclasses).
 */
export function sameMessageToMany(project: Project): boolean {
  for (const scene of project.scenes) {
    const forEach = scene.orders.filter((action) => action.kind === 'for_each' && action.class)
    for (const action of forEach) {
      const loopClass = action.class as string
      const covered = scene.classes.filter(
        (candidate) =>
          (candidate.name === loopClass || inheritsFrom(scene, candidate.name, loopClass)) &&
          candidate.methods.some((method) => method.name === action.method),
      )
      if (covered.length >= 2) return true
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
    isComplete: (project) => actionSetsAttribute(project, new Set(['sonido'])),
  },
  {
    id: 'move_it',
    isComplete: (project) => actionSetsAttribute(project, new Set(['distancia', 'altura'])),
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
    id: 'own_code',
    isComplete: (project) =>
      customClasses(project).some((definition) =>
        definition.methods.some((method) => method.body.kind === 'code'),
      ),
  },
  {
    id: 'inherit',
    isComplete: (project) => {
      const customNames = new Set(customClasses(project).map((definition) => definition.name))
      return customClasses(project).some(
        (definition) => definition.inherits != null && customNames.has(definition.inherits),
      )
    },
  },
  {
    id: 'inherited_behavior',
    isComplete: (project) => inheritsBehavior(project),
  },
  {
    id: 'polymorphism',
    isComplete: (project) => demonstratesPolymorphism(project),
  },
  {
    id: 'same_message',
    isComplete: (project) => sameMessageToMany(project),
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
  {
    id: 'inheritance',
    missions: ['inherit', 'inherited_behavior', 'polymorphism', 'same_message'],
  },
  { id: 'code', missions: ['own_code'] },
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
