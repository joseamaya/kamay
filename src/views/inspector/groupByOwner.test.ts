import { describe, expect, it } from 'vitest'

import { groupByOwner } from './groupByOwner'

describe('groupByOwner', () => {
  it('groups entries by owner preserving order and marks the own group', () => {
    const groups = groupByOwner(
      [
        { value: 'a', owner: 'Perro' },
        { value: 'b', owner: 'Animal' },
        { value: 'c', owner: 'Perro' },
        { value: 'd', owner: 'Ser' },
      ],
      'Perro',
    )

    expect(groups).toEqual([
      { owner: 'Perro', own: true, items: ['a', 'c'] },
      { owner: 'Animal', own: false, items: ['b'] },
      { owner: 'Ser', own: false, items: ['d'] },
    ])
  })

  it('returns an empty array when there are no entries', () => {
    expect(groupByOwner([], 'Perro')).toEqual([])
  })
})
