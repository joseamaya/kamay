import { describe, expect, it, vi } from 'vitest'

import { scheduleWarmup } from './warmup'

describe('scheduleWarmup', () => {
  it('does nothing when disabled', () => {
    const preload = vi.fn()
    const cancel = scheduleWarmup({
      preload,
      disabled: true,
      requestIdle: () => 1,
      cancelIdle: () => {},
    })

    cancel()
    expect(preload).not.toHaveBeenCalled()
  })

  it('runs the preload through the idle scheduler', () => {
    const preload = vi.fn()
    const scheduled: { callback?: () => void } = {}

    scheduleWarmup({
      preload,
      requestIdle: (callback) => {
        scheduled.callback = callback
        return 42
      },
      cancelIdle: () => {},
    })

    expect(preload).not.toHaveBeenCalled()
    scheduled.callback?.()
    expect(preload).toHaveBeenCalledTimes(1)
  })

  it('cancels the scheduled preload', () => {
    const cancelIdle = vi.fn()
    const cancel = scheduleWarmup({
      preload: vi.fn(),
      requestIdle: () => 7,
      cancelIdle,
    })

    cancel()
    expect(cancelIdle).toHaveBeenCalledWith(7)
  })
})
