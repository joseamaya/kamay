import type { RuntimeError, RuntimeMessage, RuntimeStatus } from './types'

export type WorkerRequest = { type: 'run'; files: Record<string, string>; entry: string }

export type WorkerResponse =
  | { type: 'status'; status: RuntimeStatus }
  | { type: 'command'; command: RuntimeMessage }
  | { type: 'error'; error: RuntimeError }
