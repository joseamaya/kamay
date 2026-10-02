import { classCustomAttributes, resolveCustomAttributes, resolveMethods } from './classroom'
import { createId } from './ids'
import { BUILTIN_METHODS } from './methods'
import type { BuiltinMethod } from './methods'
import type { Attribute, AttributeType, ClassDefinition, Operation, Scene } from './schema'

/** Block kinds supported by the visual method-body editor. */
export type BlockOp = 'call' | 'set' | 'repeat'

export function createCallBlock(
  method = BUILTIN_METHODS[0]?.name ?? '',
  values: Record<string, unknown> = {},
): Operation {
  return { id: createId('block'), op: 'call', args: { method, values }, children: [] }
}

export function createSetBlock(name: string, value: unknown = 0): Operation {
  return { id: createId('block'), op: 'set', args: { name, value }, children: [] }
}

export function createRepeatBlock(times = 3): Operation {
  return { id: createId('block'), op: 'repeat', args: { times }, children: [] }
}

export function defaultValueFor(type: AttributeType): number | string | boolean {
  if (type === 'number') return 0
  if (type === 'boolean') return false
  return ''
}

/** Methods a block can call: builtins plus the class's own and inherited methods. */
export function availableBlockMethods(scene: Scene, definition: ClassDefinition): BuiltinMethod[] {
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

  const custom = new Map<string, BuiltinMethod>()
  for (const method of [...own, ...inherited]) {
    if (!custom.has(method.name)) custom.set(method.name, method)
  }

  const customNames = new Set(custom.keys())
  return [
    ...BUILTIN_METHODS.filter((builtin) => !customNames.has(builtin.name)),
    ...custom.values(),
  ]
}

/** Attributes a block can assign: the class's own and inherited custom attributes. */
export function availableBlockAttributes(scene: Scene, definition: ClassDefinition): Attribute[] {
  const inherited = definition.inherits ? resolveCustomAttributes(scene, definition.inherits) : []
  const own = classCustomAttributes(definition)

  const result = new Map<string, Attribute>()
  for (const attribute of [...own, ...inherited]) {
    if (!result.has(attribute.name)) result.set(attribute.name, attribute)
  }
  return [...result.values()]
}
