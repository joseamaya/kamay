/**
 * Bridge between the user's Python (executed with Pyodide in a Web Worker) and
 * the Canvas engine running on the main thread.
 *
 * Phase 0 only defines the contract; the Pyodide worker is implemented in Phase 1.
 *
 * TODO(Phase 1): load Pyodide in a dedicated worker and implement `RuntimeBridge`.
 */

export type RuntimeCommand =
  | { type: 'spawn'; objectId: string; class: string; image: string | null }
  | { type: 'say'; objectId: string; message: string }
  | { type: 'move'; objectId: string; x: number; y: number }
  | { type: 'rotate'; objectId: string; degrees: number }
  | { type: 'scale'; objectId: string; factor: number }
  | { type: 'wait'; seconds: number }
  | { type: 'finish' }

export interface RuntimeError {
  message: string
  line: number | null
}

export interface RuntimeBridge {
  /** Starts loading Pyodide without blocking the UI. */
  preload: () => Promise<void>
  /** Runs generated Python source and streams engine commands back. */
  run: (source: Record<string, string>) => Promise<void>
  /** Stops the current run and resets to the initial scene state. */
  reset: () => void
  onCommand: (listener: (command: RuntimeCommand) => void) => () => void
  onError: (listener: (error: RuntimeError) => void) => () => void
}
