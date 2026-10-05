import type { RuntimeError, RuntimeErrorDetails } from './types'

export interface TracebackFrame {
  file: string
  line: number
  func: string | null
}

const FRAME_PATTERN = /File "([^"]+)", line (\d+)(?:, in (.+))?/g
const KIND_PATTERN = /([A-Za-z_]*Error)/
const NAME_PATTERN = /name '([^']+)' is not defined/
const ATTRIBUTE_PATTERN = /'([^']+)' object has no attribute '([^']+)'/
const MODULE_PATTERN = /No module named '([^']+)'/

/** Extracts the identifier a message points at, so hints can name the concept. */
export function parseErrorDetails(message: string): RuntimeErrorDetails {
  const name = message.match(NAME_PATTERN)?.[1]
  if (name) return { name }

  const attribute = message.match(ATTRIBUTE_PATTERN)
  if (attribute) return { owner: attribute[1], attribute: attribute[2] }

  const module = message.match(MODULE_PATTERN)?.[1]
  if (module) return { module }

  return {}
}

/** Strips the Pyodide mount prefix so frames match generated file paths. */
export function normalizeFile(path: string): string {
  const prefix = '/kamay/'
  return path.startsWith(prefix) ? path.slice(prefix.length) : path
}

/** Lists traceback frames from outermost to innermost. */
export function parseFrames(message: string): TracebackFrame[] {
  const frames: TracebackFrame[] = []
  for (const match of message.matchAll(FRAME_PATTERN)) {
    frames.push({
      file: normalizeFile(match[1] ?? ''),
      line: Number(match[2]),
      func: match[3] ?? null,
    })
  }
  return frames
}

/**
 * Picks the frame to report: the innermost one that belongs to a generated
 * file, so errors raised inside the runtime or the standard library still
 * point at the student's code. Falls back to the innermost frame.
 */
export function selectFrame(
  frames: TracebackFrame[],
  knownFiles?: ReadonlySet<string>,
): TracebackFrame | null {
  if (frames.length === 0) return null
  if (knownFiles && knownFiles.size > 0) {
    for (let index = frames.length - 1; index >= 0; index -= 1) {
      const frame = frames[index]!
      if (knownFiles.has(frame.file)) return frame
    }
  }
  return frames.at(-1)!
}

export function toRuntimeError(error: unknown, knownFiles?: ReadonlySet<string>): RuntimeError {
  const message = error instanceof Error ? error.message : String(error)
  const frame = selectFrame(parseFrames(message), knownFiles)
  const kindMatch = message.match(KIND_PATTERN)

  return {
    kind: kindMatch ? kindMatch[1]! : 'Error',
    message,
    file: frame?.file ?? null,
    line: frame?.line ?? null,
    details: parseErrorDetails(message),
  }
}
