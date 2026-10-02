import { EditorState } from '@codemirror/state'
import { describe, expect, it } from 'vitest'

import { toDiagnostics } from './diagnostics'

function doc(text: string) {
  return EditorState.create({ doc: text }).doc
}

describe('toDiagnostics', () => {
  it('maps a line to its full document range', () => {
    const result = toDiagnostics(doc('a = 1\nb = 2\nc = 3'), [{ line: 2, message: 'boom' }])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ from: 6, to: 11, severity: 'error', message: 'boom' })
  })

  it('clamps lines outside the document', () => {
    const text = doc('a = 1\nb = 2')

    expect(toDiagnostics(text, [{ line: 99, message: 'x' }])[0]!.from).toBe(6)
    expect(toDiagnostics(text, [{ line: 0, message: 'x' }])[0]!.from).toBe(0)
  })

  it('ignores non-finite lines', () => {
    expect(toDiagnostics(doc('a = 1'), [{ line: Number.NaN, message: 'x' }])).toEqual([])
  })
})
