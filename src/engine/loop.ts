export interface LoopOptions {
  update: (deltaSeconds: number) => void
  render: () => void
  now?: () => number
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (handle: number) => void
}

export interface Loop {
  start: () => void
  stop: () => void
  isRunning: () => boolean
  /** Runs a single frame with an explicit delta; used by tests. */
  step: (deltaSeconds: number) => void
}

const MAX_DELTA = 0.05

const defaultNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export function createLoop({
  update,
  render,
  now = defaultNow,
  requestFrame = typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (callback) => setTimeout(() => callback(now()), 16) as unknown as number,
  cancelFrame = typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : (handle) => clearTimeout(handle as unknown as ReturnType<typeof setTimeout>),
}: LoopOptions): Loop {
  let handle: number | null = null
  let previous = 0

  const frame: FrameRequestCallback = () => {
    const current = now()
    const delta = Math.min((current - previous) / 1000, MAX_DELTA)
    previous = current
    update(delta)
    render()
    handle = requestFrame(frame)
  }

  return {
    start() {
      if (handle !== null) return
      previous = now()
      handle = requestFrame(frame)
    },
    stop() {
      if (handle === null) return
      cancelFrame(handle)
      handle = null
    },
    isRunning: () => handle !== null,
    step(deltaSeconds) {
      update(deltaSeconds)
      render()
    },
  }
}
