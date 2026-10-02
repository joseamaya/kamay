export type RuntimeCommand =
  | { type: 'say'; target: string; message: string }
  | { type: 'move'; target: string; x: number; y: number }
  | { type: 'rotate'; target: string; degrees: number }
  | { type: 'scale'; target: string; factor: number }

export interface RuntimeError {
  kind: string
  message: string
  /** Generated file where the error happened, normalized to its path. */
  file: string | null
  line: number | null
}

export type RuntimeStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error'

export type TriggerKind = 'click' | 'collision'

export interface RuntimeBridge {
  /** Loads Pyodide without blocking the UI. */
  preload: () => Promise<void>
  /** Runs generated Python files and streams engine commands back. */
  run: (files: Record<string, string>, entry: string) => Promise<void>
  /** Fires a modeled event (click/collision) so the registered handler runs. */
  trigger: (kind: TriggerKind, source: string) => void
  /** Stops the current run by terminating and dropping the worker. */
  stop: () => void
  onCommand: (listener: (command: RuntimeCommand) => void) => () => void
  onError: (listener: (error: RuntimeError) => void) => () => void
  onStatus: (listener: (status: RuntimeStatus) => void) => () => void
}
