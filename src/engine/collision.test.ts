import { describe, expect, it } from 'vitest'

import { aabbOverlap, circleOverlap } from './collision'

describe('aabbOverlap', () => {
  it('detects overlapping boxes', () => {
    expect(
      aabbOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
    ).toBe(true)
  })

  it('returns false for separated boxes', () => {
    expect(
      aabbOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 0, width: 10, height: 10 }),
    ).toBe(false)
  })
})

describe('circleOverlap', () => {
  it('detects overlapping circles', () => {
    expect(circleOverlap({ x: 0, y: 0, radius: 5 }, { x: 6, y: 0, radius: 5 })).toBe(true)
  })

  it('returns false for separated circles', () => {
    expect(circleOverlap({ x: 0, y: 0, radius: 5 }, { x: 20, y: 0, radius: 5 })).toBe(false)
  })
})
