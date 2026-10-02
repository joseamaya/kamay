import type { AttributeValue } from './attributes'
import { BASE_CLASS, createObject, nextObjectName } from './factory'
import { createId } from './ids'
import { identifierPattern } from './schema'
import type { Attribute, ClassDefinition, ObjectInstance, Scene } from './schema'

export const DEFAULT_CLASS_COLOR = '#e2603a'
export const DEFAULT_CLASS_SHAPE = 'circle'

const VISUAL_ATTRIBUTES = new Set(['color', 'shape'])
const RESERVED_ATTRIBUTE_NAMES = new Set(['x', 'y', 'rotation', 'scale', 'color', 'shape'])

export interface ClassDraftErrors {
  nameInvalid: boolean
  nameTaken: boolean
  attributes: boolean[]
  methods: { nameInvalid: boolean; nameTaken: boolean; invalidParameters: boolean }[]
}

export function isIdentifier(name: string): boolean {
  return identifierPattern.test(name)
}

export function createClassDraft(name = 'MiClase'): ClassDefinition {
  return {
    id: createId('class'),
    name,
    inherits: BASE_CLASS,
    image: null,
    attributes: [
      { name: 'color', type: 'string', initial: DEFAULT_CLASS_COLOR },
      { name: 'shape', type: 'string', initial: DEFAULT_CLASS_SHAPE },
    ],
    methods: [],
  }
}

/** Attributes declared by the class beyond the visual `color`/`shape`. */
export function classCustomAttributes(definition: ClassDefinition): Attribute[] {
  return definition.attributes.filter((attribute) => !VISUAL_ATTRIBUTES.has(attribute.name))
}

/** Default values of every class attribute, used to seed new instances. */
export function classAttributeDefaults(
  definition: ClassDefinition,
): Record<string, AttributeValue> {
  return Object.fromEntries(
    definition.attributes.map((attribute) => [attribute.name, attribute.initial]),
  )
}

export function classUsageCount(scene: Scene, className: string): number {
  return scene.objects.filter((object) => object.class === className).length
}

/** Adds a new class or replaces an existing one (by id), keeping object references in sync. */
export function upsertClass(scene: Scene, definition: ClassDefinition): Scene {
  const existing = scene.classes.find((candidate) => candidate.id === definition.id)
  if (!existing) return { ...scene, classes: [...scene.classes, definition] }

  const objects =
    existing.name !== definition.name
      ? scene.objects.map((object) =>
          object.class === existing.name ? { ...object, class: definition.name } : object,
        )
      : scene.objects

  return {
    ...scene,
    classes: scene.classes.map((candidate) =>
      candidate.id === definition.id ? definition : candidate,
    ),
    objects,
  }
}

/** Removes a class only when no object instantiates it; otherwise returns the scene unchanged. */
export function removeClass(scene: Scene, classId: string): Scene {
  const target = scene.classes.find((candidate) => candidate.id === classId)
  if (!target || classUsageCount(scene, target.name) > 0) return scene
  return { ...scene, classes: scene.classes.filter((candidate) => candidate.id !== classId) }
}

export function instantiateClass(scene: Scene, classId: string): Scene {
  const definition = scene.classes.find((candidate) => candidate.id === classId)
  if (!definition) return scene

  const object = createObject(scene, definition.name, classAttributeDefaults(definition))
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
  const duplicateAttributes = hasDuplicateNames(attributeNames)
  const duplicateMethods = hasDuplicateNames(methodNames)

  return {
    nameInvalid: !isIdentifier(definition.name),
    nameTaken: scene.classes.some(
      (candidate) => candidate.id !== definition.id && candidate.name === definition.name,
    ),
    attributes: definition.attributes.map(
      (attribute) =>
        !isIdentifier(attribute.name) ||
        duplicateAttributes ||
        (!VISUAL_ATTRIBUTES.has(attribute.name) && RESERVED_ATTRIBUTE_NAMES.has(attribute.name)),
    ),
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
    errors.attributes.some(Boolean) ||
    errors.methods.some(
      (method) => method.nameInvalid || method.nameTaken || method.invalidParameters,
    )
  )
}

export function newAttribute(): Attribute {
  return { name: 'nuevo', type: 'number', initial: 0 }
}
