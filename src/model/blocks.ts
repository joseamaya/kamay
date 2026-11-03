import {
  classCustomAttributes,
  resolveAttributes,
  resolveComponents,
  resolveCustomAttributes,
  resolveMethods,
} from './classroom'
import { createId } from './ids'
import type { MethodSignature } from './methods'
import type {
  Attribute,
  AttributeType,
  ClassDefinition,
  Component,
  Operation,
  Scene,
} from './schema'

export function createCallBlock(method = '', values: Record<string, unknown> = {}): Operation {
  return { id: createId('block'), op: 'call', args: { method, values }, children: [] }
}

/** Calls a method on one of the class's components (`self.parte.metodo()`). */
export function createCallOnBlock(
  target = '',
  method = '',
  values: Record<string, unknown> = {},
): Operation {
  return { id: createId('block'), op: 'call_on', args: { target, method, values }, children: [] }
}

export function createSetBlock(name: string, value: unknown = 0): Operation {
  return { id: createId('block'), op: 'set', args: { name, value }, children: [] }
}

/** Assigns a method parameter to an attribute (`self.x = parametro`). */
export function createSetFromParamBlock(name = '', parameter = ''): Operation {
  return { id: createId('block'), op: 'set_from_param', args: { name, parameter }, children: [] }
}

export type ChangeOperator = '+' | '-'

/** Adds or subtracts a literal from a numeric attribute. */
export function createChangeBlock(
  name: string,
  operator: ChangeOperator = '+',
  amount = 1,
): Operation {
  return { id: createId('block'), op: 'change', args: { name, operator, amount }, children: [] }
}

export function createRepeatBlock(times = 3): Operation {
  return { id: createId('block'), op: 'repeat', args: { times }, children: [] }
}

/** Raw Python that the visual editor cannot represent ("advanced code"). */
export function createCodeBlock(code: string): Operation {
  return { id: createId('block'), op: 'code', args: { code }, children: [] }
}

export function defaultValueFor(type: AttributeType): number | string | boolean {
  if (type === 'number') return 0
  if (type === 'boolean') return false
  return ''
}
/** Methods a block can call: the class's own and inherited methods. */
export function availableBlockMethods(
  scene: Scene,
  definition: ClassDefinition,
): MethodSignature[] {
  const own = definition.methods.map((method) => ({
    name: method.name,
    parameters: method.parameters,
  }))
  const inherited = definition.inherits
    ? resolveMethods(scene, definition.inherits).map((method) => ({
        name: method.name,
        parameters: method.parameters,
      }))
    : []

  const result = new Map<string, MethodSignature>()
  for (const method of [...own, ...inherited]) {
    if (!result.has(method.name)) result.set(method.name, method)
  }
  return [...result.values()]
}

/** A destination a call block can send a message to: the object itself or a part. */
export interface BlockCallTarget {
  /** Component name, or `null` for the object itself (`self`). */
  name: string | null
  className: string
  methods: MethodSignature[]
}

/** Own and inherited components of a draft that may not be saved yet. */
function draftComponents(scene: Scene, definition: ClassDefinition): Component[] {
  const byName = new Map<string, Component>()
  for (const component of definition.inherits
    ? resolveComponents(scene, definition.inherits)
    : []) {
    byName.set(component.name, component)
  }
  for (const component of definition.components) byName.set(component.name, component)
  return [...byName.values()]
}

/** Own and inherited attributes of a draft that may not be saved yet. */
function draftAttributes(scene: Scene, definition: ClassDefinition): Attribute[] {
  const byName = new Map<string, Attribute>()
  for (const attribute of definition.inherits
    ? resolveAttributes(scene, definition.inherits)
    : []) {
    byName.set(attribute.name, attribute)
  }
  for (const attribute of definition.attributes) byName.set(attribute.name, attribute)
  return [...byName.values()]
}

/** Methods reachable through a call destination (`null` means the object itself). */
export function blockMethodsFor(
  scene: Scene,
  definition: ClassDefinition,
  target: string | null,
): MethodSignature[] {
  if (target === null) return availableBlockMethods(scene, definition)
  const component = draftComponents(scene, definition).find((item) => item.name === target)
  const className =
    component?.class ??
    draftAttributes(scene, definition).find(
      (attribute) => attribute.name === target && attribute.type === 'reference',
    )?.targetClass
  if (!className) return []
  if (className === definition.name) return availableBlockMethods(scene, definition)
  return resolveMethods(scene, className).map((method) => ({
    name: method.name,
    parameters: method.parameters,
  }))
}

/** The object plus the components and typed references that have methods. */
export function availableBlockTargets(
  scene: Scene,
  definition: ClassDefinition,
): BlockCallTarget[] {
  const self: BlockCallTarget = {
    name: null,
    className: definition.name,
    methods: availableBlockMethods(scene, definition),
  }
  const components = draftComponents(scene, definition)
    .map((component) => ({
      name: component.name,
      className: component.class,
      methods: blockMethodsFor(scene, definition, component.name),
    }))
    .filter((component) => component.methods.length > 0)
  const references = draftAttributes(scene, definition)
    .filter((attribute) => attribute.type === 'reference' && attribute.targetClass)
    .map((attribute) => ({
      name: attribute.name,
      className: attribute.targetClass as string,
      methods: blockMethodsFor(scene, definition, attribute.name),
    }))
    .filter((reference) => reference.methods.length > 0)
  return [self, ...components, ...references]
}

/** Attributes a block can assign: the class's own and inherited custom attributes. */
export function availableBlockAttributes(scene: Scene, definition: ClassDefinition): Attribute[] {
  const inherited = definition.inherits ? resolveCustomAttributes(scene, definition.inherits) : []
  const own = classCustomAttributes(definition)

  const result = new Map<string, Attribute>()
  for (const attribute of [...own, ...inherited]) {
    if (!result.has(attribute.name)) result.set(attribute.name, attribute)
  }
  return [...result.values()].filter((attribute) => attribute.type !== 'reference')
}
