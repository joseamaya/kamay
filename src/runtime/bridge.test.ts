import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createRuntimeBridge } from './bridge'
import type { WorkerResponse } from './protocol'
import type { RuntimeMessage } from './types'

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

describe('createRuntimeBridge', () => {
  beforeEach(() => {
    FakeWorker.instances = []
    vi.stubGlobal('Worker', FakeWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts a run request and forwards commands', async () => {
    const bridge = createRuntimeBridge()
    const seen: RuntimeMessage[] = []
    bridge.onCommand((message) => seen.push(message))

    await bridge.run({ 'principal.py': '' }, 'principal.py')
    const worker = FakeWorker.instances[0]!

    expect(worker.posted).toContainEqual({
      type: 'run',
      files: { 'principal.py': '' },
      entry: 'principal.py',
    })

    worker.emit({ type: 'command', command: { type: 'say', target: 'a', message: 'hi' } })
    expect(seen).toEqual([{ type: 'say', target: 'a', message: 'hi' }])
  })

  it('forwards status and errors', async () => {
    const bridge = createRuntimeBridge()
    const statuses: string[] = []
    const errors: string[] = []
    bridge.onStatus((status) => statuses.push(status))
    bridge.onError((error) => errors.push(error.kind))

    await bridge.run({}, 'principal.py')
    const worker = FakeWorker.instances[0]!
    worker.emit({ type: 'status', status: 'ready' })
    worker.emit({
      type: 'error',
      error: { kind: 'NameError', message: 'x', file: null, line: null },
    })

    expect(statuses).toEqual(['ready'])
    expect(errors).toEqual(['NameError'])
  })

  it('terminates the worker on stop', async () => {
    const bridge = createRuntimeBridge()
    await bridge.run({}, 'principal.py')

    bridge.stop()

    expect(FakeWorker.instances[0]!.terminated).toBe(true)
  })
})
