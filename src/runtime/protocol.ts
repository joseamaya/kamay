import type { RuntimeError, RuntimeMessage, RuntimeStatus, TriggerKind } from './types'

export type WorkerRequest =
  | { type: 'run'; files: Record<string, string>; entry: string }
  | { type: 'trigger'; kind: TriggerKind; source: string }

export type WorkerResponse =
  | { type: 'status'; status: RuntimeStatus }
  | { type: 'command'; command: RuntimeMessage }
  | { type: 'error'; error: RuntimeError }
