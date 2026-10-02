import type { Diagnostic } from '@codemirror/lint'
import type { Text } from '@codemirror/state'

export interface CodeDiagnostic {
  line: number
  message: string
}

/** Maps line-based diagnostics to document ranges, clamping out-of-range lines. */
export function toDiagnostics(doc: Text, diagnostics: CodeDiagnostic[]): Diagnostic[] {
  const result: Diagnostic[] = []
  for (const item of diagnostics) {
    if (!Number.isFinite(item.line)) continue
    const lineNumber = Math.min(Math.max(Math.trunc(item.line), 1), doc.lines)
    const line = doc.line(lineNumber)
    result.push({ from: line.from, to: line.to, severity: 'error', message: item.message })
  }
  return result
}
