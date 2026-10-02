import { describe, expect, it } from 'vitest'

import { BUILTIN_METHODS, findBuiltinMethod } from './index'

describe('builtin methods', () => {
  it('exposes the engine methods', () => {
    expect(BUILTIN_METHODS.map((method) => method.name)).toEqual([
      'decir',
      'mover',
      'girar',
      'cambiar_escala',
      'esperar',
      'emitir',
    ])
  })

  it('finds a method by name', () => {
    expect(findBuiltinMethod('mover')?.parameters.map((parameter) => parameter.name)).toEqual([
      'x',
      'y',
    ])
    expect(findBuiltinMethod('unknown')).toBeUndefined()
  })
})
