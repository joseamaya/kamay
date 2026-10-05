import { describe, expect, it } from 'vitest'

import { HINT_LEVELS, revealNext } from './hints'

describe('revealNext', () => {
  it('reveals one hint at a time and never passes the last one', () => {
    expect(revealNext(0)).toBe(1)
    expect(revealNext(1)).toBe(2)
    expect(revealNext(HINT_LEVELS)).toBe(HINT_LEVELS)
  })
})
