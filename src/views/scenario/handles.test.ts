import { describe, expect, it } from 'vitest'

import { normalizeDegrees, rotationFromPointer, scaleFromDrag } from './handles'

describe('normalizeDegrees', () => {
  it('keeps angles within (-180, 180]', () => {
    expect(normalizeDegrees(0)).toBe(0)
    expect(normalizeDegrees(90)).toBe(90)
    expect(normalizeDegrees(180)).toBe(180)
    expect(normalizeDegrees(-180)).toBe(180)
    expect(normalizeDegrees(270)).toBe(-90)
    expect(normalizeDegrees(370)).toBe(10)
  })
})

describe('rotationFromPointer', () => {
  const center = { x: 0, y: 0 }

  it('maps the pointer direction to the object rotation', () => {
    expect(rotationFromPointer(center, { x: 0, y: -10 })).toBe(0)
    expect(rotationFromPointer(center, { x: -10, y: 0 })).toBe(90)
    expect(rotationFromPointer(center, { x: 10, y: 0 })).toBe(-90)
    expect(rotationFromPointer(center, { x: 0, y: 10 })).toBe(180)
  })
})

describe('scaleFromDrag', () => {
  it('scales relative to the starting distance', () => {
    expect(scaleFromDrag(1, 10, 20)).toBe(2)
    expect(scaleFromDrag(1, 10, 5)).toBe(0.5)
    expect(scaleFromDrag(2, 10, 15)).toBe(3)
  })

  it('clamps and rounds to one decimal', () => {
    expect(scaleFromDrag(1, 10, 100)).toBe(3)
    expect(scaleFromDrag(1, 10, 0.1)).toBe(0.2)
    expect(scaleFromDrag(1, 10, 13)).toBe(1.3)
  })

  it('keeps the current scale when the starting distance is invalid', () => {
    expect(scaleFromDrag(1.5, 0, 20)).toBe(1.5)
  })
})
