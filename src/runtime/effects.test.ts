import { describe, expect, it } from 'vitest'

import type { Simulation } from '../model'
import { stateEffect } from './effects'

const SIM: Simulation = { x: 100, y: 0, rotation: 0, scale: 1, mensaje: '' }

describe('stateEffect', () => {
  it('moves on distancia/altura changes, offset from the scene placement', () => {
    expect(stateEffect('a', 'distancia', { distancia: 50, altura: 20 }, SIM)).toEqual({
      type: 'move',
      target: 'a',
      x: 150,
      y: 20,
    })
  })

  it('rotates and scales, offset and multiplied from the scene placement', () => {
    expect(stateEffect('a', 'giro', { giro: 90 }, SIM)).toEqual({
      type: 'rotate',
      target: 'a',
      degrees: 90,
    })
    expect(stateEffect('a', 'tamano', { tamano: 2 }, SIM)).toEqual({
      type: 'scale',
      target: 'a',
      factor: 2,
    })
  })

  it('says only when the sound is non-empty', () => {
    expect(stateEffect('a', 'sonido', { sonido: 'hola' }, SIM)).toEqual({
      type: 'say',
      target: 'a',
      message: 'hola',
    })
    expect(stateEffect('a', 'sonido', { sonido: '' }, SIM)).toBeNull()
  })

  it('ignores unrelated attributes', () => {
    expect(stateEffect('a', 'vida', { vida: 10 }, SIM)).toBeNull()
  })
})
