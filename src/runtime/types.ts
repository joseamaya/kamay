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

/** An object came to life: its class, identity and initial attributes. */
export interface RuntimeCreated {
  type: 'created'
  /** Stable object id (the name when the runtime has no id of its own). */
  id: string
  name: string
  className: string
  attributes: Record<string, number | string | boolean>
}

/** A method call started on the receiver, with its arguments. */
export interface RuntimeCall {
  type: 'call'
  id: string
  name: string
  className: string
  method: string
  args: Record<string, unknown>
}

/** The call of `method` on the receiver finished. */
export interface RuntimeReturn {
  type: 'return'
  id: string
  method: string
}

/** The program reached its end. */
export interface RuntimeFinished {
  type: 'finished'
}

/**
 * Domain observations: what happened to the objects. They are separate from the
 * engine commands, which only describe how to represent those facts on screen.
 */
export type RuntimeEvent =
  RuntimeState | RuntimeCreated | RuntimeCall | RuntimeReturn | RuntimeFinished

/** Everything the worker can stream back: engine commands plus domain events. */
export type RuntimeMessage = RuntimeCommand | RuntimeEvent

const COMMAND_TYPES = new Set<RuntimeCommand['type']>([
  'say',
  'move',
  'rotate',
  'scale',
  'wait',
  'appearance',
])

/** Whether a message is a scene instruction rather than a domain event. */
export function isRuntimeCommand(message: RuntimeMessage): message is RuntimeCommand {
  return COMMAND_TYPES.has(message.type as RuntimeCommand['type'])
}

/** Whether a message is an observation of the domain rather than a command. */
export function isRuntimeEvent(message: RuntimeMessage): message is RuntimeEvent {
  return !isRuntimeCommand(message)
}

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
