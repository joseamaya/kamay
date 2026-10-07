export interface Point {
  x: number
  y: number
}

export interface MenuPlacement {
  left: number
  top: number
}

export interface PlaceMenuOptions {
  /** Object center in viewport coordinates. */
  anchor: Point
  /** Distance from the anchor center to the nearest menu edge. */
  offset: number
  menu: { width: number; height: number }
  viewport: { width: number; height: number }
  pad?: number
  /** Topmost position the menu may reach (e.g. below the top bar). */
  minTop?: number
}

/**
 * Places a floating menu next to an anchor, preferring its right side and
 * flipping left when it does not fit, always clamped to the viewport (and below
 * `minTop`, so it never covers the top bar).
 */
export function placeMenu({
  anchor,
  offset,
  menu,
  viewport,
  pad = 8,
  minTop = pad,
}: PlaceMenuOptions): MenuPlacement {
  const maxLeft = Math.max(pad, viewport.width - menu.width - pad)
  const preferredRight =
    anchor.x + offset + menu.width <= viewport.width - pad
      ? anchor.x + offset
      : anchor.x - offset - menu.width
  const left = Math.min(Math.max(preferredRight, pad), maxLeft)

  const maxTop = Math.max(minTop, viewport.height - menu.height - pad)
  const top = Math.min(Math.max(anchor.y - menu.height / 2, minTop), maxTop)

  return { left, top }
}
