import type { WorkerRequest, WorkerResponse } from './protocol'
import type { RuntimeBridge, RuntimeCommand, RuntimeError, RuntimeStatus } from './types'

export function createRuntimeBridge(): RuntimeBridge {
  let worker: Worker | null = null
  let status: RuntimeStatus = 'idle'
  let readyResolvers: Array<() => void> = []

  const commandListeners = new Set<(command: RuntimeCommand) => void>()
  const errorListeners = new Set<(error: RuntimeError) => void>()
  const statusListeners = new Set<(status: RuntimeStatus) => void>()

  const setStatus = (next: RuntimeStatus) => {
    status = next
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
        if (message.status === 'ready') {
          readyResolvers.forEach((resolve) => resolve())
          readyResolvers = []
        }
      }
    }
    return worker
  }

  return {
    preload: () => {
      const current = ensureWorker()
      if (status === 'ready') return Promise.resolve()
      return new Promise<void>((resolve) => {
        readyResolvers.push(resolve)
        current.postMessage({ type: 'preload' } satisfies WorkerRequest)
      })
    },
    run: async (files, entry) => {
      ensureWorker().postMessage({ type: 'run', files, entry } satisfies WorkerRequest)
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
