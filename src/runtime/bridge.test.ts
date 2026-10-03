import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createRuntimeBridge } from './bridge'
import type { WorkerResponse } from './protocol'

class FakeWorker {
  static instances: FakeWorker[] = []
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null
  posted: unknown[] = []
  terminated = false

  constructor() {
    FakeWorker.instances.push(this)
  }

  postMessage(message: unknown): void {
    this.posted.push(message)
  }

  terminate(): void {
    this.terminated = true
  }

  emit(message: WorkerResponse): void {
    this.onmessage?.({ data: message } as MessageEvent<WorkerResponse>)
  }
}

describe('createRuntimeBridge warmup', () => {
  beforeEach(() => {
    FakeWorker.instances = []
    vi.stubGlobal('Worker', FakeWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts a preload request and resolves on warmup ready', async () => {
    const bridge = createRuntimeBridge()
    const promise = bridge.preload()
    const worker = FakeWorker.instances[0]!

    expect(worker.posted).toContainEqual({ type: 'preload' })
    worker.emit({ type: 'warmup', status: 'loading' })
    worker.emit({ type: 'warmup', status: 'ready' })

    await expect(promise).resolves.toBeUndefined()
  })

  it('reports warmup status to listeners', () => {
    const bridge = createRuntimeBridge()
    const seen: string[] = []
    const off = bridge.onWarmup((status) => seen.push(status))

    void bridge.preload()
    FakeWorker.instances[0]!.emit({ type: 'warmup', status: 'loading' })
    FakeWorker.instances[0]!.emit({ type: 'warmup', status: 'ready' })
    off()

    expect(seen).toEqual(['loading', 'ready'])
  })

  it('resolves immediately when already warm without posting again', async () => {
    const bridge = createRuntimeBridge()
    void bridge.preload()
    const worker = FakeWorker.instances[0]!
    worker.emit({ type: 'warmup', status: 'ready' })

    await expect(bridge.preload()).resolves.toBeUndefined()
    expect(
      worker.posted.filter((message) => (message as { type: string }).type === 'preload'),
    ).toHaveLength(1)
  })

  it('rejects a pending warmup when stopped', async () => {
    const bridge = createRuntimeBridge()
    const promise = bridge.preload()
    bridge.stop()
    await expect(promise).rejects.toThrow('runtime_stopped')
  })

  it('keeps the run status untouched during warmup', () => {
    const bridge = createRuntimeBridge()
    const statuses: string[] = []
    bridge.onStatus((status) => statuses.push(status))

    void bridge.preload()
    FakeWorker.instances[0]!.emit({ type: 'warmup', status: 'loading' })
    FakeWorker.instances[0]!.emit({ type: 'warmup', status: 'ready' })

    expect(statuses).toEqual([])
  })
})
