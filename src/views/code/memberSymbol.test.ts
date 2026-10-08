import { describe, expect, it } from 'vitest'

import type { GeneratedSymbol } from '../../generator'
import { findSymbol, symbolMemberRef } from './memberSymbol'

const symbols: GeneratedSymbol[] = [
  { file: 'Heroe.py', kind: 'class', className: 'Heroe', lineFrom: 4, lineTo: 4 },
  {
    file: 'Heroe.py',
    kind: 'method',
    className: 'Heroe',
    member: 'saltar',
    lineFrom: 5,
    lineTo: 6,
  },
  {
    file: 'Heroe.py',
    kind: 'attribute',
    className: 'Heroe',
    member: 'vida',
    lineFrom: 6,
    lineTo: 6,
  },
  {
    file: 'principal.py',
    kind: 'object',
    className: 'Heroe',
    objectName: 'h1',
    lineFrom: 7,
    lineTo: 8,
  },
  {
    file: 'principal.py',
    kind: 'order',
    objectName: 'h1',
    member: 'saltar',
    orderIndex: 0,
    lineFrom: 9,
    lineTo: 9,
  },
]

describe('findSymbol', () => {
  it('finds members by kind and identity', () => {
    expect(findSymbol(symbols, { kind: 'method', className: 'Heroe', name: 'saltar' })?.file).toBe(
      'Heroe.py',
    )
    expect(findSymbol(symbols, { kind: 'object', objectName: 'h1' })?.lineFrom).toBe(7)
    expect(findSymbol(symbols, { kind: 'order', orderIndex: 0 })?.member).toBe('saltar')
    expect(
      findSymbol(symbols, { kind: 'attribute', className: 'Heroe', name: 'nope' }),
    ).toBeUndefined()
  })
})

describe('symbolMemberRef', () => {
  it('maps member symbols back to their reference', () => {
    expect(symbolMemberRef(symbols[1]!)).toEqual({
      kind: 'method',
      className: 'Heroe',
      name: 'saltar',
    })
    expect(symbolMemberRef(symbols[4]!)).toEqual({ kind: 'order', orderIndex: 0 })
  })

  it('returns null for structural symbols', () => {
    expect(symbolMemberRef(symbols[0]!)).toBeNull()
  })
})
