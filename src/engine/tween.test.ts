import { describe, expect, it } from 'vitest'

import { advanceTweens, createTween, easeInOut, tweenValue } from './tween'

describe('easeInOut', () => {
  it('is a smooth curve from 0 to 1', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
  })
})

describe('advanceTweens', () => {
  it('applies interpolated values and drops finished tweens', () => {
    const tween = createTween('a', 'x', 0, 10, 1)
    const applied: number[] = []

    let running = advanceTweens([tween], 0.5, (target) => applied.push(target.value))
    expect(applied.at(-1)).toBeCloseTo(5)
    expect(running).toHaveLength(1)

    running = advanceTweens(running, 0.5, (target) => applied.push(target.value))
    expect(applied.at(-1)).toBeCloseTo(10)
    expect(running).toHaveLength(0)
  })

  it('finishes immediately when the duration is zero', () => {
    const tween = createTween('a', 'x', 0, 10, 0)
    expect(tweenValue(tween)).toBe(10)
  })
})
