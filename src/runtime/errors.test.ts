import { describe, expect, it } from 'vitest'

import { translateRuntimeError } from './errors'

describe('translateRuntimeError', () => {
  it('translates a known error kind and includes the line', () => {
    const text = translateRuntimeError({
      kind: 'NameError',
      message: 'NameError: ...',
      file: 'principal.py',
      line: 3,
    })
    expect(text).toContain('línea 3')
    expect(text).not.toContain('NameError')
  })

  it('falls back to a generic message for unknown kinds', () => {
    const text = translateRuntimeError({ kind: 'WeirdError', message: 'x', file: null, line: null })
    expect(text).toContain('Ocurrió un error')
  })
})
