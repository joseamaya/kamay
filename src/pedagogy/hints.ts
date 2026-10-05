/** Number of progressive hint levels available per mission. */
export const HINT_LEVELS = 3

/** Reveals the next hint, never going past the last one. */
export function revealNext(revealed: number): number {
  return Math.min(revealed + 1, HINT_LEVELS)
}
