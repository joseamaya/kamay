import { describe, expect, it } from 'vitest'

import { stateEffect } from './effects'

describe('stateEffect', () => {
  it('moves on x/y changes using the merged position', () => {
    expect(stateEffect('a', 'x', { x: 50, y: 20 })).toEqual({
      type: 'move',
      target: 'a',
      x: 50,
      y: 20,
    })
  })

  it('rotates and scales', () => {
    expect(stateEffect('a', 'rotation', { rotation: 90 })).toEqual({
      type: 'rotate',
      target: 'a',
      degrees: 90,
    })
    expect(stateEffect('a', 'scale', { scale: 2 })).toEqual({
      type: 'scale',
      target: 'a',
      factor: 2,
    })
  })

  it('says only when the message is non-empty', () => {
    expect(stateEffect('a', 'mensaje', { mensaje: 'hola' })).toEqual({
      type: 'say',
      target: 'a',
      message: 'hola',
    })
    expect(stateEffect('a', 'mensaje', { mensaje: '' })).toBeNull()
  })

  it('ignores unrelated attributes', () => {
    expect(stateEffect('a', 'vida', { vida: 10 })).toBeNull()
  })
})
