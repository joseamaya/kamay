export interface Point {
  x: number
  y: number
}

/** Normalizes an angle to (-180, 180], rounded to whole degrees. */
export function normalizeDegrees(value: number): number {
  let result = value % 360
  if (result > 180) result -= 360
  if (result <= -180) result += 360
  return Math.round(result) || 0
}

/**
 * Rotation (degrees) that points the object's "up" towards the pointer, given the
 * object center and the pointer in screen coordinates (Y pointing down).
 */
export function rotationFromPointer(center: Point, pointer: Point): number {
  const dx = pointer.x - center.x
  const dy = pointer.y - center.y
  return normalizeDegrees((Math.atan2(-dx, -dy) * 180) / Math.PI)
}

const MIN_SCALE = 0.2
const MAX_SCALE = 3

/** Scale from a drag, relative to the distance when the drag started. */
export function scaleFromDrag(startScale: number, startDistance: number, distance: number): number {
  if (startDistance <= 0) return startScale
  const raw = startScale * (distance / startDistance)
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw))
  return Math.round(clamped * 10) / 10
}
