import type { RuntimeCommand, RuntimeError, RuntimeStatus } from './types'

export type WorkerRequest =
  { type: 'preload' } | { type: 'run'; files: Record<string, string>; entry: string }

export type WorkerResponse =
  | { type: 'status'; status: RuntimeStatus }
  | { type: 'command'; command: RuntimeCommand }
  | { type: 'error'; error: RuntimeError }
