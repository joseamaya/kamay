import type { AttributeType } from './schema'

export interface MethodParameter {
  name: string
  type: AttributeType
}

export interface BuiltinMethod {
  name: string
  parameters: MethodParameter[]
}

/** Methods provided by the runtime engine, available on every actor. */
export const BUILTIN_METHODS: BuiltinMethod[] = [
  { name: 'decir', parameters: [{ name: 'mensaje', type: 'string' }] },
  {
    name: 'mover',
    parameters: [
      { name: 'x', type: 'number' },
      { name: 'y', type: 'number' },
    ],
  },
  { name: 'girar', parameters: [{ name: 'grados', type: 'number' }] },
  { name: 'cambiar_escala', parameters: [{ name: 'factor', type: 'number' }] },
]

export function findBuiltinMethod(name: string): BuiltinMethod | undefined {
  return BUILTIN_METHODS.find((method) => method.name === name)
}
