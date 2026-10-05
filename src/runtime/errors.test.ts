import { describe, expect, it } from 'vitest'

import { translateRuntimeError, translateRuntimeHint } from './errors'

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

describe('translateRuntimeHint', () => {
  it('names the missing attribute for an AttributeError', () => {
    const hint = translateRuntimeHint({
      kind: 'AttributeError',
      message: '',
      file: 'Heroe.py',
      line: 5,
      details: { owner: 'Heroe', attribute: 'saltar' },
    })
    expect(hint).toContain('Heroe')
    expect(hint).toContain('saltar')
  })

  it('names the missing name for a NameError', () => {
    const hint = translateRuntimeHint({
      kind: 'NameError',
      message: '',
      file: null,
      line: null,
      details: { name: 'vida' },
    })
    expect(hint).toContain('vida')
  })

  it('falls back to generic wording without details', () => {
    expect(
      translateRuntimeHint({ kind: 'AttributeError', message: '', file: null, line: null }),
    ).toContain('método o atributo')
  })

  it('returns null for unknown kinds', () => {
    expect(
      translateRuntimeHint({ kind: 'WeirdError', message: 'x', file: null, line: null }),
    ).toBeNull()
  })
})
