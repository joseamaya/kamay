import { defaultValueFor, findBuiltinMethod, resolveMethods } from '../model'
import type { ClassDefinition, MethodParameter, Operation, Scene } from '../model'
import { pyLiteral } from './python'

function findMethodParameters(
  scene: Scene,
  definition: ClassDefinition,
  name: string,
): MethodParameter[] {
  const own = definition.methods.find((method) => method.name === name)
  if (own) return own.parameters
  if (definition.inherits) {
    const inherited = resolveMethods(scene, definition.inherits).find(
      (method) => method.name === name,
    )
    if (inherited) return inherited.parameters
  }
  return findBuiltinMethod(name)?.parameters ?? []
}

function blockToLines(scene: Scene, definition: ClassDefinition, op: Operation): string[] {
  if (op.op === 'call') {
    const method = String(op.args.method ?? '')
    const values = (op.args.values ?? {}) as Record<string, unknown>
    const parameters = findMethodParameters(scene, definition, method)
    const args = parameters
      .map((parameter) => pyLiteral(values[parameter.name] ?? defaultValueFor(parameter.type)))
      .join(', ')
    return [`self.${method}(${args})`]
  }

  if (op.op === 'set') {
    const name = String(op.args.name ?? '')
    return [`self.${name} = ${pyLiteral(op.args.value)}`]
  }

  if (op.op === 'repeat') {
    const times = Number(op.args.times) || 0
    const children = blocksToLines(scene, definition, op.children)
    const body =
      children.length > 0 ? children.map((line) => (line ? `    ${line}` : line)) : ['    pass']
    return [`for _ in range(${times}):`, ...body]
  }

  return []
}

export function blocksToLines(
  scene: Scene,
  definition: ClassDefinition,
  ops: Operation[],
): string[] {
  return ops.flatMap((op) => blockToLines(scene, definition, op))
}

export function blocksToCode(scene: Scene, definition: ClassDefinition, ops: Operation[]): string {
  const lines = blocksToLines(scene, definition, ops)
  return lines.length > 0 ? lines.join('\n') : 'pass'
}
