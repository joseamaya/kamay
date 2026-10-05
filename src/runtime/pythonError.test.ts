import { describe, expect, it } from 'vitest'

import { normalizeFile, parseErrorDetails, parseFrames, toRuntimeError } from './pythonError'

describe('normalizeFile', () => {
  it('strips the Pyodide mount prefix', () => {
    expect(normalizeFile('/kamay/Circle.py')).toBe('Circle.py')
    expect(normalizeFile('principal.py')).toBe('principal.py')
  })
})

describe('parseFrames', () => {
  it('lists every traceback frame in order', () => {
    const frames = parseFrames(`Traceback (most recent call last):
  File "principal.py", line 12, in <module>
    circle1.saltar()
  File "/kamay/Circle.py", line 8, in saltar
    return self.vida`)

    expect(frames).toEqual([
      { file: 'principal.py', line: 12, func: '<module>' },
      { file: 'Circle.py', line: 8, func: 'saltar' },
    ])
  })
})

describe('toRuntimeError', () => {
  it('reports the innermost traceback frame', () => {
    const error = new Error(`Traceback (most recent call last):
  File "principal.py", line 12, in <module>
    circle1.saltar()
  File "/kamay/Circle.py", line 8, in saltar
    return self.vida
NameError: name 'vida' is not defined`)

    const result = toRuntimeError(error)

    expect(result.file).toBe('Circle.py')
    expect(result.line).toBe(8)
    expect(result.kind).toBe('NameError')
    expect(result.details).toEqual({ name: 'vida' })
  })

  it('prefers the innermost frame that belongs to a generated file', () => {
    const error = new Error(`Traceback (most recent call last):
  File "principal.py", line 12, in <module>
    circle1.decir("hola")
  File "/kamay/kamay_runtime.py", line 20, in decir
    raise TypeError("boom")`)

    const result = toRuntimeError(error, new Set(['principal.py', 'Circle.py']))

    expect(result.file).toBe('principal.py')
    expect(result.line).toBe(12)
    expect(result.kind).toBe('TypeError')
  })

  it('falls back gracefully without frames or a known kind', () => {
    const result = toRuntimeError(new Error('boom'))

    expect(result.file).toBeNull()
    expect(result.line).toBeNull()
    expect(result.kind).toBe('Error')
  })
})

describe('parseErrorDetails', () => {
  it('extracts the missing name from a NameError', () => {
    expect(parseErrorDetails("NameError: name 'vida' is not defined")).toEqual({ name: 'vida' })
  })

  it('extracts the owner and attribute from an AttributeError', () => {
    expect(parseErrorDetails("AttributeError: 'Heroe' object has no attribute 'saltar'")).toEqual({
      owner: 'Heroe',
      attribute: 'saltar',
    })
  })

  it('extracts the module from an import error', () => {
    expect(parseErrorDetails("ModuleNotFoundError: No module named 'foo'")).toEqual({
      module: 'foo',
    })
  })

  it('returns an empty object when there is nothing to extract', () => {
    expect(parseErrorDetails('TypeError: boom')).toEqual({})
  })
})
