import type { AttributeType } from './schema'

export interface MethodParameter {
  name: string
  type: AttributeType
}

/** The name and parameters of a method, used by blocks and the action composer. */
export interface MethodSignature {
  name: string
  parameters: MethodParameter[]
}
