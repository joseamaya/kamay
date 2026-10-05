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

/** A didactic hint that names the concept, or `null` when there is nothing useful to add. */
export function translateRuntimeHint(error: RuntimeError): string | null {
  const { hints } = getMessages().errors
  const { details } = error

  switch (error.kind) {
    case 'NameError':
      return details?.name ? format(hints.name, { name: details.name }) : hints.nameGeneric
    case 'AttributeError':
      return details?.owner && details.attribute
        ? format(hints.attribute, { owner: details.owner, attribute: details.attribute })
        : hints.attributeGeneric
    case 'ModuleNotFoundError':
    case 'ImportError':
      return details?.module
        ? format(hints.module, { module: details.module })
        : hints.moduleGeneric
    case 'TypeError':
      return hints.type
    case 'SyntaxError':
      return hints.syntax
    case 'IndentationError':
      return hints.indentation
    case 'ZeroDivisionError':
      return hints.zeroDivision
    default:
      return null
  }
}
