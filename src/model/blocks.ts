import { ENGINE_ATTRIBUTES } from './attributes'
import { classCustomAttributes, resolveCustomAttributes, resolveMethods } from './classroom'
import { createId } from './ids'
import type { MethodSignature } from './methods'
import type { Attribute, AttributeType, ClassDefinition, Operation, Scene } from './schema'

export function createCallBlock(method = '', values: Record<string, unknown> = {}): Operation {
  return { id: createId('block'), op: 'call', args: { method, values }, children: [] }
}

export function createSetBlock(name: string, value: unknown = 0): Operation {
  return { id: createId('block'), op: 'set', args: { name, value }, children: [] }
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

/** Attributes a block can assign: the class's own and inherited custom attributes. */
export function availableBlockAttributes(scene: Scene, definition: ClassDefinition): Attribute[] {
  const inherited = definition.inherits ? resolveCustomAttributes(scene, definition.inherits) : []
  const own = classCustomAttributes(definition)

  const result = new Map<string, Attribute>()
  for (const attribute of [...own, ...inherited, ...ENGINE_ATTRIBUTES]) {
    if (!result.has(attribute.name)) result.set(attribute.name, attribute)
  }
  return [...result.values()]
}
