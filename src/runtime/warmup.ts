export interface WarmupOptions {
  preload: () => void
  disabled?: boolean
  delayMs?: number
  requestIdle?: (callback: () => void) => number
  cancelIdle?: (handle: number) => void
}

const DEFAULT_DELAY_MS = 1500

function defaultRequestIdle(callback: () => void, delayMs: number): number {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(callback, { timeout: delayMs })
  }
  return setTimeout(callback, delayMs) as unknown as number
}

function defaultCancelIdle(handle: number): void {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(handle)
    return
  }
  clearTimeout(handle as unknown as ReturnType<typeof setTimeout>)
}

/** Schedules a background Pyodide warmup and returns a cancel function. */
export function scheduleWarmup(options: WarmupOptions): () => void {
  if (options.disabled) return () => {}
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  const requestIdle = options.requestIdle ?? ((callback) => defaultRequestIdle(callback, delayMs))
  const cancelIdle = options.cancelIdle ?? defaultCancelIdle
  const handle = requestIdle(options.preload)
  return () => cancelIdle(handle)
}
