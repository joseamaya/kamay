export type TweenProperty = 'x' | 'y' | 'rotation' | 'scale'

export interface Tween {
  objectId: string
  property: TweenProperty
  from: number
  to: number
  duration: number
  elapsed: number
}

export interface TweenTarget {
  objectId: string
  property: TweenProperty
  value: number
}

export function easeInOut(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1)
  return clamped < 0.5 ? 2 * clamped * clamped : 1 - (-2 * clamped + 2) ** 2 / 2
}

export function createTween(
  objectId: string,
  property: TweenProperty,
  from: number,
  to: number,
  duration: number,
): Tween {
  return { objectId, property, from, to, duration, elapsed: 0 }
}

export function tweenProgress(tween: Tween): number {
  if (tween.duration <= 0) return 1
  return Math.min(tween.elapsed / tween.duration, 1)
}

export function tweenValue(tween: Tween): number {
  return tween.from + (tween.to - tween.from) * easeInOut(tweenProgress(tween))
}

/**
 * Advances every tween by `delta` seconds. Returns the tweens that are still
 * running; finished tweens report their final value through `apply`.
 */
export function advanceTweens(
  tweens: Tween[],
  delta: number,
  apply: (target: TweenTarget) => void,
): Tween[] {
  const running: Tween[] = []
  for (const tween of tweens) {
    tween.elapsed += delta
    apply({ objectId: tween.objectId, property: tween.property, value: tweenValue(tween) })
    if (tween.elapsed < tween.duration) running.push(tween)
  }
  return running
}
