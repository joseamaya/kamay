import type { RuntimeError } from './types'

/**
 * Turns a Pyodide error into a structured runtime error. The traceback lists
 * frames from outermost to innermost, so the reported line is the last one
 * (where the error actually happened).
 */
export function toRuntimeError(error: unknown): RuntimeError {
  const message = error instanceof Error ? error.message : String(error)
  const lines = [...message.matchAll(/line (\d+)/g)]
  const lastLine = lines.at(-1)
  const kindMatch = message.match(/([A-Za-z_]*Error)/)

  return {
    kind: kindMatch ? kindMatch[1] : 'Error',
    message,
    line: lastLine ? Number(lastLine[1]) : null,
  }
}
