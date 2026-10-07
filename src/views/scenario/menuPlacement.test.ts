import { describe, expect, it } from 'vitest'

import { placeMenu } from './menuPlacement'

const viewport = { width: 1000, height: 800 }
const menu = { width: 320, height: 300 }

describe('placeMenu', () => {
  it('places the menu to the right of the anchor when it fits', () => {
    const { left, top } = placeMenu({ anchor: { x: 300, y: 400 }, offset: 40, menu, viewport })

    expect(left).toBe(340)
    expect(top).toBe(250)
  })

  it('flips to the left when it does not fit on the right', () => {
    const { left } = placeMenu({ anchor: { x: 850, y: 400 }, offset: 40, menu, viewport })

    expect(left).toBe(850 - 40 - 320)
  })

  it('clamps to the left padding when neither side fits', () => {
    const { left } = placeMenu({
      anchor: { x: 500, y: 400 },
      offset: 40,
      menu: { width: 900, height: 300 },
      viewport,
    })

    expect(left).toBe(8)
  })

  it('clamps the vertical position to the viewport', () => {
    const top = placeMenu({ anchor: { x: 300, y: 10 }, offset: 40, menu, viewport }).top
    const bottom = placeMenu({ anchor: { x: 300, y: 790 }, offset: 40, menu, viewport }).top

    expect(top).toBe(8)
    expect(bottom).toBe(viewport.height - menu.height - 8)
  })

  it('never places the menu above minTop', () => {
    const { top } = placeMenu({
      anchor: { x: 300, y: 100 },
      offset: 40,
      menu,
      viewport,
      minTop: 140,
    })

    expect(top).toBe(140)
  })

  it('never returns a negative position when the menu is larger than the viewport', () => {
    const { left, top } = placeMenu({
      anchor: { x: 500, y: 400 },
      offset: 40,
      menu: { width: 1200, height: 900 },
      viewport,
    })

    expect(left).toBeGreaterThanOrEqual(8)
    expect(top).toBeGreaterThanOrEqual(8)
  })
})
