import type { WorkerRequest, WorkerResponse } from './protocol'
import type { RuntimeBridge, RuntimeError, RuntimeMessage, RuntimeStatus } from './types'

export function createRuntimeBridge(): RuntimeBridge {
  let worker: Worker | null = null

  const commandListeners = new Set<(message: RuntimeMessage) => void>()
  const errorListeners = new Set<(error: RuntimeError) => void>()
  const statusListeners = new Set<(status: RuntimeStatus) => void>()

  const setStatus = (next: RuntimeStatus) => {
    statusListeners.forEach((listener) => listener(next))
  }

  const ensureWorker = (): Worker => {
    if (worker) return worker
    worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'command')
        commandListeners.forEach((listener) => listener(message.command))
      else if (message.type === 'error')
        errorListeners.forEach((listener) => listener(message.error))
      else if (message.type === 'status') {
        setStatus(message.status)
      }
    }
    return worker
  }

  return {
    run: async (files, entry) => {
      ensureWorker().postMessage({ type: 'run', files, entry } satisfies WorkerRequest)
    },
    trigger: (kind, source) => {
      worker?.postMessage({ type: 'trigger', kind, source } satisfies WorkerRequest)
    },
    stop: () => {
      worker?.terminate()
      worker = null
      setStatus('idle')
    },
    onCommand: (listener) => {
      commandListeners.add(listener)
      return () => commandListeners.delete(listener)
    },
    onError: (listener) => {
      errorListeners.add(listener)
      return () => errorListeners.delete(listener)
    },
    onStatus: (listener) => {
      statusListeners.add(listener)
      return () => statusListeners.delete(listener)
    },
  }
}
