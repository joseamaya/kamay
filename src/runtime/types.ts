export type RuntimeCommand =
  | { type: 'say'; target: string; message: string }
  | { type: 'move'; target: string; x: number; y: number }
  | { type: 'rotate'; target: string; degrees: number }
  | { type: 'scale'; target: string; factor: number }
  | { type: 'wait'; seconds: number }
  | {
      type: 'appearance'
      target: string
      glyph: string | null
      image: string | null
      color: string
      shape: string
    }

/** A data attribute the running program assigned to an object. */
export interface RuntimeState {
  type: 'state'
  target: string
  name: string
  value: number | string | boolean
}

/** Everything the worker can stream back: engine commands plus observations. */
export type RuntimeMessage = RuntimeCommand | RuntimeState

export interface RuntimeErrorDetails {
  /** Missing name from a NameError. */
  name?: string
  /** Class or type that lacks an attribute (AttributeError). */
  owner?: string
  /** Missing attribute from an AttributeError. */
  attribute?: string
  /** Missing module from an ImportError. */
  module?: string
}

export interface RuntimeError {
  kind: string
  message: string
  /** Generated file where the error happened, normalized to its path. */
  file: string | null
  line: number | null
  /** Structured details parsed from the message, used to build hints. */
  details?: RuntimeErrorDetails
}

export type RuntimeStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error'

export interface RuntimeBridge {
  /** Runs generated Python files and streams engine commands back. */
  run: (files: Record<string, string>, entry: string) => Promise<void>
  /** Stops the current run by terminating and dropping the worker. */
  stop: () => void
  onCommand: (listener: (message: RuntimeMessage) => void) => () => void
  onError: (listener: (error: RuntimeError) => void) => () => void
  onStatus: (listener: (status: RuntimeStatus) => void) => () => void
}
