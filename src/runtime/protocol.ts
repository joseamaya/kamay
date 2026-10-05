import type {
  RuntimeError,
  RuntimeMessage,
  RuntimeStatus,
  TriggerKind,
  WarmupStatus,
} from './types'

export type WorkerRequest =
  | { type: 'preload' }
  | { type: 'run'; files: Record<string, string>; entry: string }
  | { type: 'trigger'; kind: TriggerKind; source: string }

export type WorkerResponse =
  | { type: 'status'; status: RuntimeStatus }
  | { type: 'warmup'; status: WarmupStatus }
  | { type: 'command'; command: RuntimeMessage }
  | { type: 'error'; error: RuntimeError }
