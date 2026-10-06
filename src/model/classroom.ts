import type { AttributeValue } from './attributes'
import {
  createObject,
  DOMAIN_BASES,
  DOMAIN_BASE_NAMES,
  isDomainBaseName,
  nextObjectName,
} from './factory'
import { createId } from './ids'
import { identifierPattern } from './schema'
import type { Attribute, ClassDefinition, Component, Method, ObjectInstance, Scene } from './schema'

export const DEFAULT_CLASS_COLOR = '#e2603a'
export const DEFAULT_CLASS_SHAPE = 'circle'

const VISUAL_ATTRIBUTES = new Set(['color', 'shape'])
const RESERVED_ATTRIBUTE_NAMES = new Set(['x', 'y', 'rotation', 'scale', 'color', 'shape'])

/** A resolved member together with the class that declares it. */
export interface ResolvedMember<T> {
  value: T
  owner: string
}

export type ResolvedAttribute = ResolvedMember<Attribute>
export type ResolvedMethod = ResolvedMember<Method>
export type ResolvedComponent = ResolvedMember<Component>

export interface ClassDraftErrors {
  nameInvalid: boolean
  nameTaken: boolean
  inheritsInvalid: boolean
  attributes: boolean[]
  components: { nameInvalid: boolean; classInvalid: boolean }[]
  methods: { nameInvalid: boolean; nameTaken: boolean; invalidParameters: boolean }[]
}

export function isIdentifier(name: string): boolean {
  return identifierPattern.test(name)
}

export function createClassDraft(name = 'MiClase'): ClassDefinition {
  return {
    id: createId('class'),
    name,
    inherits: null,
    image: null,
    attributes: [
      { name: 'color', type: 'string', initial: DEFAULT_CLASS_COLOR },
      { name: 'shape', type: 'string', initial: DEFAULT_CLASS_SHAPE },
    ],
    components: [],
    methods: [],
    visuals: [],
  }
}

/** Attributes declared by the class beyond the visual `color`/`shape`. */
export function classCustomAttributes(definition: ClassDefinition): Attribute[] {
  return definition.attributes.filter((attribute) => !VISUAL_ATTRIBUTES.has(attribute.name))
}

export function classUsageCount(scene: Scene, className: string): number {
  return scene.objects.filter((object) => object.class === className).length
}

/** Number of classes that inherit from the given class. */
export function classInheritanceUsageCount(scene: Scene, className: string): number {
  return scene.classes.filter((definition) => definition.inherits === className).length
}

/** Every class that transitively inherits from the given class (by id). */
export function descendantNames(scene: Scene, classId: string): Set<string> {
  const root = scene.classes.find((candidate) => candidate.id === classId)
  if (!root) return new Set()

  const children = (name: string) =>
    scene.classes
      .filter((candidate) => candidate.inherits === name)
      .map((candidate) => candidate.name)

  const result = new Set<string>()
  const queue = [root.name]
  while (queue.length > 0) {
    for (const child of children(queue.shift()!)) {
      if (!result.has(child)) {
        result.add(child)
        queue.push(child)
      }
    }
  }
  return result
}

export interface ClassTreeNode {
  definition: ClassDefinition
  depth: number
}

/**
 * Classes ordered as a forest: each subclass follows its base, indented one
 * level. Classes whose base is not in the scene (e.g. an absent domain base) are
 * treated as roots, and any class left unvisited (a cycle) is promoted to a root.
 */
export function classTree(scene: Scene): ClassTreeNode[] {
  const byName = new Map(scene.classes.map((definition) => [definition.name, definition]))
  const children = new Map<string, ClassDefinition[]>()
  const roots: ClassDefinition[] = []

  for (const definition of scene.classes) {
    const parent =
      definition.inherits && byName.has(definition.inherits) ? definition.inherits : null
    if (!parent) {
      roots.push(definition)
      continue
    }
    const list = children.get(parent) ?? []
    list.push(definition)
    children.set(parent, list)
  }

  const nodes: ClassTreeNode[] = []
  const visited = new Set<string>()
  const walk = (definition: ClassDefinition, depth: number) => {
    if (visited.has(definition.name)) return
    visited.add(definition.name)
    nodes.push({ definition, depth })
    for (const child of children.get(definition.name) ?? []) walk(child, depth + 1)
  }

  for (const root of roots) walk(root, 0)
  for (const definition of scene.classes) {
    if (!visited.has(definition.name)) walk(definition, 0)
  }
  return nodes
}

/** Base classes the draft may inherit from: Actor plus non-descendant classes. */
export function availableBaseClasses(scene: Scene, draft: ClassDefinition): string[] {
  const existing = scene.classes.find((candidate) => candidate.id === draft.id)
  const excluded = new Set<string>([
    draft.name,
    existing?.name ?? '',
    ...descendantNames(scene, draft.id),
  ])
  const names = [...DOMAIN_BASE_NAMES, ...scene.classes.map((candidate) => candidate.name)]
  return [...new Set(names)].filter((name) => !excluded.has(name))
}

function isValidBase(scene: Scene, definition: ClassDefinition): boolean {
  const base = definition.inherits
  if (base === null) return true

  const selfNames = new Set([definition.name])
  const existing = scene.classes.find((candidate) => candidate.id === definition.id)
  if (existing) selfNames.add(existing.name)
  if (selfNames.has(base) || descendantNames(scene, definition.id).has(base)) return false

  return isDomainBaseName(base) || scene.classes.some((candidate) => candidate.name === base)
}

/** Own methods plus inherited ones, with the class that declares each one. */
export function resolveMethodsWithOrigin(scene: Scene, className: string): ResolvedMethod[] {
  const result: ResolvedMethod[] = []
  const seen = new Set<string>()
  const visited = new Set<string>()
  let current: string | null = className

  while (current && !visited.has(current)) {
    visited.add(current)
    const definition = scene.classes.find((candidate) => candidate.name === current)
    if (!definition) break
    for (const method of definition.methods) {
      if (!seen.has(method.name)) {
        seen.add(method.name)
        result.push({ value: method, owner: definition.name })
      }
    }
    current = definition.inherits
  }

  return result
}

/** Own methods plus inherited ones (nearest definition wins). */
export function resolveMethods(scene: Scene, className: string): Method[] {
  return resolveMethodsWithOrigin(scene, className).map((entry) => entry.value)
}

/** Own components plus inherited ones, with the class that declares each one. */
export function resolveComponentsWithOrigin(scene: Scene, className: string): ResolvedComponent[] {
  const result: ResolvedComponent[] = []
  const seen = new Set<string>()
  const visited = new Set<string>()
  let current: string | null = className

  while (current && !visited.has(current)) {
    visited.add(current)
    const definition = scene.classes.find((candidate) => candidate.name === current)
    if (!definition) break
    for (const component of definition.components) {
      if (!seen.has(component.name)) {
        seen.add(component.name)
        result.push({ value: component, owner: definition.name })
      }
    }
    current = definition.inherits
  }

  return result
}

/** Own components plus inherited ones (nearest definition wins). */
export function resolveComponents(scene: Scene, className: string): Component[] {
  return resolveComponentsWithOrigin(scene, className).map((entry) => entry.value)
}

/** Class names from the class up to the base (including `Actor` when inherited). */
export function classAncestry(scene: Scene, className: string): string[] {
  const chain: string[] = []
  const visited = new Set<string>()
  let current: string | null = className

  while (current && !visited.has(current)) {
    visited.add(current)
    chain.push(current)
    const definition = scene.classes.find((candidate) => candidate.name === current)
    current = definition?.inherits ?? null
  }

  return chain
}

/** Class names from the class up to the root, including domain bases. */
export function fullClassAncestry(scene: Scene, className: string): string[] {
  const chain: string[] = []
  const visited = new Set<string>()
  let current: string | null = className

  while (current && !visited.has(current)) {
    visited.add(current)
    chain.push(current)
    const definition: ClassDefinition | undefined =
      scene.classes.find((candidate) => candidate.name === current) ?? DOMAIN_BASES[current]
    current = definition?.inherits ?? null
  }

  return chain
}

/** Whether `className` is `baseName` or transitively inherits from it. */
export function classExtends(scene: Scene, className: string, baseName: string): boolean {
  return fullClassAncestry(scene, className).includes(baseName)
}

/** Objects whose class is `className` or inherits from it. */
export function objectsOfClass(scene: Scene, className: string): ObjectInstance[] {
  if (!className) return []
  return scene.objects.filter((object) => classExtends(scene, object.class, className))
}

/**
 * Classes that can be iterated: every instantiated class plus its ancestors, so
 * picking a base class covers the objects of its subclasses.
 */
export function iterableClasses(scene: Scene): string[] {
  const names = new Set<string>()
  for (const object of scene.objects) {
    for (const name of fullClassAncestry(scene, object.class)) names.add(name)
  }
  return [...names]
}

/** Number of classes that contain the given class as a component. */
export function classComponentUsageCount(scene: Scene, className: string): number {
  return scene.classes.filter((definition) =>
    definition.components.some((component) => component.class === className),
  ).length
}

/** Whether `fromName` transitively contains `targetName` as a component. */
function componentReaches(
  scene: Scene,
  fromName: string,
  targetName: string,
  visited: Set<string> = new Set(),
): boolean {
  if (fromName === targetName) return true
  if (visited.has(fromName)) return false
  visited.add(fromName)
  const definition = scene.classes.find((candidate) => candidate.name === fromName)
  if (!definition) return false
  return definition.components.some((component) =>
    componentReaches(scene, component.class, targetName, visited),
  )
}

/** Classes the draft may contain without creating a composition cycle. */
export function availableComponentClasses(scene: Scene, draft: ClassDefinition): string[] {
  return scene.classes
    .map((candidate) => candidate.name)
    .filter((name) => name !== draft.name && !componentReaches(scene, name, draft.name))
}

export function newComponent(className: string): Component {
  return { name: 'parte', class: className }
}

/** Own attributes plus inherited ones, with the class that declares each one. */
export function resolveAttributesWithOrigin(scene: Scene, className: string): ResolvedAttribute[] {
  const result: ResolvedAttribute[] = []
  const seen = new Set<string>()
  const visited = new Set<string>()
  let current: string | null = className

  while (current && !visited.has(current)) {
    visited.add(current)
    const definition = scene.classes.find((candidate) => candidate.name === current)
    if (!definition) break
    for (const attribute of definition.attributes) {
      if (!seen.has(attribute.name)) {
        seen.add(attribute.name)
        result.push({ value: attribute, owner: definition.name })
      }
    }
    current = definition.inherits
  }

  return result
}

/** Own attributes plus inherited ones (nearest definition wins). */
export function resolveAttributes(scene: Scene, className: string): Attribute[] {
  return resolveAttributesWithOrigin(scene, className).map((entry) => entry.value)
}

/** Inherited and own custom attributes (excluding `color`/`shape`), with origin. */
export function resolveCustomAttributesWithOrigin(
  scene: Scene,
  className: string,
): ResolvedAttribute[] {
  return resolveAttributesWithOrigin(scene, className).filter(
    (entry) => !VISUAL_ATTRIBUTES.has(entry.value.name),
  )
}

/** Inherited and own attributes excluding the visual `color`/`shape`. */
export function resolveCustomAttributes(scene: Scene, className: string): Attribute[] {
  return resolveCustomAttributesWithOrigin(scene, className).map((entry) => entry.value)
}

/** Default values of every resolved attribute, used to reset instances. */
export function resolveAttributeDefaults(
  scene: Scene,
  className: string,
): Record<string, AttributeValue> {
  return Object.fromEntries(
    resolveAttributes(scene, className).map((attribute) => [attribute.name, attribute.initial]),
  )
}

/** Adds a new class or replaces an existing one (by id), keeping object references in sync. */
export function upsertClass(scene: Scene, definition: ClassDefinition): Scene {
  const existing = scene.classes.find((candidate) => candidate.id === definition.id)
  if (!existing) return { ...scene, classes: [...scene.classes, definition] }

  const renamed = existing.name !== definition.name
  const objects = renamed
    ? scene.objects.map((object) =>
        object.class === existing.name ? { ...object, class: definition.name } : object,
      )
    : scene.objects

  return {
    ...scene,
    classes: scene.classes.map((candidate) => {
      if (candidate.id === definition.id) return definition
      let next = candidate
      if (renamed && next.inherits === existing.name) {
        next = { ...next, inherits: definition.name }
      }
      if (renamed && next.components.some((component) => component.class === existing.name)) {
        next = {
          ...next,
          components: next.components.map((component) =>
            component.class === existing.name
              ? { ...component, class: definition.name }
              : component,
          ),
        }
      }
      return next
    }),
    objects,
  }
}

/**
 * Removes a class only when nothing depends on it (no instances and no
 * subclasses); otherwise returns the scene unchanged.
 */
export function removeClass(scene: Scene, classId: string): Scene {
  const target = scene.classes.find((candidate) => candidate.id === classId)
  if (!target || classUsageCount(scene, target.name) > 0) return scene
  if (classInheritanceUsageCount(scene, target.name) > 0) return scene
  if (classComponentUsageCount(scene, target.name) > 0) return scene
  return { ...scene, classes: scene.classes.filter((candidate) => candidate.id !== classId) }
}

export function instantiateClass(scene: Scene, classId: string): Scene {
  const definition = scene.classes.find((candidate) => candidate.id === classId)
  if (!definition) return scene

  const object = createObject(
    scene,
    definition.name,
    resolveAttributeDefaults(scene, definition.name),
  )
  return { ...scene, objects: [...scene.objects, object] }
}

/** Clones an object (same class and attributes) under a new id and unique name. */
export function duplicateObject(scene: Scene, objectId: string): Scene {
  const source = scene.objects.find((object) => object.id === objectId)
  if (!source) return scene

  const clone: ObjectInstance = {
    ...source,
    id: createId('object'),
    name: nextObjectName(scene, source.class),
    attributes: { ...source.attributes },
  }
  return { ...scene, objects: [...scene.objects, clone] }
}

function hasDuplicateNames(names: string[]): boolean {
  return new Set(names).size !== names.length
}

export function validateClassDraft(scene: Scene, definition: ClassDefinition): ClassDraftErrors {
  const attributeNames = definition.attributes.map((attribute) => attribute.name)
  const methodNames = definition.methods.map((method) => method.name)
  const componentNames = definition.components.map((component) => component.name)
  const duplicateAttributes = hasDuplicateNames(attributeNames)
  const duplicateMethods = hasDuplicateNames(methodNames)
  const duplicateComponents = hasDuplicateNames(componentNames)

  return {
    nameInvalid: !isIdentifier(definition.name),
    nameTaken: scene.classes.some(
      (candidate) => candidate.id !== definition.id && candidate.name === definition.name,
    ),
    inheritsInvalid: !isValidBase(scene, definition),
    attributes: definition.attributes.map(
      (attribute) =>
        !isIdentifier(attribute.name) ||
        duplicateAttributes ||
        (!VISUAL_ATTRIBUTES.has(attribute.name) && RESERVED_ATTRIBUTE_NAMES.has(attribute.name)),
    ),
    components: definition.components.map((component) => ({
      nameInvalid:
        !isIdentifier(component.name) ||
        duplicateComponents ||
        attributeNames.includes(component.name),
      classInvalid:
        component.class === definition.name ||
        !scene.classes.some((candidate) => candidate.name === component.class) ||
        componentReaches(scene, component.class, definition.name),
    })),
    methods: definition.methods.map((method) => {
      const parameterNames = method.parameters.map((parameter) => parameter.name)
      return {
        nameInvalid: !isIdentifier(method.name),
        nameTaken: duplicateMethods,
        invalidParameters: !hasDuplicateNames(parameterNames)
          ? parameterNames.some((name) => !isIdentifier(name))
          : true,
      }
    }),
  }
}

export function hasClassDraftErrors(errors: ClassDraftErrors): boolean {
  return (
    errors.nameInvalid ||
    errors.nameTaken ||
    errors.inheritsInvalid ||
    errors.attributes.some(Boolean) ||
    errors.components.some((component) => component.nameInvalid || component.classInvalid) ||
    errors.methods.some(
      (method) => method.nameInvalid || method.nameTaken || method.invalidParameters,
    )
  )
}

export function newAttribute(): Attribute {
  return { name: 'nuevo', type: 'number', initial: 0 }
}
