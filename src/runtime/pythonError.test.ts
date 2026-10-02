import { describe, expect, it } from 'vitest'

import { toRuntimeError } from './pythonError'

describe('toRuntimeError', () => {
  it('reports the innermost traceback line', () => {
    const error = new Error(`Traceback (most recent call last):
  File "principal.py", line 12, in <module>
    circle1.saltar()
  File "/kamay/Circle.py", line 8, in saltar
    return self.vida
NameError: name 'vida' is not defined`)

    const result = toRuntimeError(error)

    expect(result.line).toBe(8)
    expect(result.kind).toBe('NameError')
  })

  it('falls back gracefully without a line or known kind', () => {
    const result = toRuntimeError(new Error('boom'))
    expect(result.line).toBeNull()
    expect(result.kind).toBe('Error')
  })
})
