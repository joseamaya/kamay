import { format, getMessages } from '../i18n'
import type { RuntimeError } from './types'

type RuntimeErrorKey =
  'name' | 'attribute' | 'syntax' | 'indentation' | 'type' | 'zeroDivision' | 'generic'

const KIND_MAP: Record<string, RuntimeErrorKey> = {
  NameError: 'name',
  AttributeError: 'attribute',
  SyntaxError: 'syntax',
  IndentationError: 'indentation',
  TypeError: 'type',
  ZeroDivisionError: 'zeroDivision',
}

export function translateRuntimeError(error: RuntimeError): string {
  const { runtime } = getMessages().errors
  const key = KIND_MAP[error.kind] ?? 'generic'
  const summary = runtime[key]
  return error.line ? format(runtime.withLine, { summary, line: error.line }) : summary
}
