import type { Attribute } from '../model'

export const TYPE_HINTS: Record<Attribute['type'], string> = {
  number: 'float',
  string: 'str',
  boolean: 'bool',
}

export function pyLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'float("nan")'
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(pyLiteral).join(', ')}]`
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return `{${entries.map(([key, item]) => `${pyLiteral(key)}: ${pyLiteral(item)}`).join(', ')}}`
  }
  return 'None'
}

export function indent(text: string, spaces = 4): string {
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? pad + line : line))
    .join('\n')
}
