import {
  availableBlockAttributes,
  availableBlockMethods,
  createCallBlock,
  createChangeBlock,
  createCodeBlock,
  createRepeatBlock,
  createSetBlock,
} from './blocks'
import type { ChangeOperator } from './blocks'
import type { MethodSignature } from './methods'
import type { Attribute, ClassDefinition, Operation, Scene } from './schema'

interface Line {
  indent: number
  text: string
}

interface ParseContext {
  methods: MethodSignature[]
  attributes: Attribute[]
}

const REPEAT_PATTERN = /^for\s+_\s+in\s+range\(\s*(-?\d+)\s*\)\s*:\s*$/
const CALL_PATTERN = /^self\.([A-Za-z_]\w*)\s*\((.*)\)\s*$/
const CHANGE_PATTERN =
  /^self\.([A-Za-z_]\w*)\s*=\s*self\.([A-Za-z_]\w*)\s*([+-])\s*(-?\d+(?:\.\d+)?)\s*$/
const SET_PATTERN = /^self\.([A-Za-z_]\w*)\s*=\s*(.+)$/

function toLines(code: string): Line[] {
  return code
    .replace(/\t/g, '    ')
    .split('\n')
    .map((raw) => ({ indent: raw.length - raw.trimStart().length, text: raw.trimEnd() }))
    .filter((line) => line.text.trim().length > 0)
}

/** Splits arguments on top-level commas, honouring quotes and brackets. */
function splitArgs(raw: string): string[] | null {
  const text = raw.trim()
  if (text === '') return []

  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!
    if (quote) {
      current += char
      if (char === quote && text[index - 1] !== '\\') quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      current += char
      continue
    }
    if (char === '(' || char === '[' || char === '{') depth += 1
    else if (char === ')' || char === ']' || char === '}') {
      depth -= 1
      if (depth < 0) return null
    }
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  if (quote || depth !== 0) return null
  parts.push(current.trim())
  return parts
}

function parseLiteral(raw: string): number | string | boolean | undefined {
  const text = raw.trim()
  if (text === 'True') return true
  if (text === 'False') return false
  if (/^-?\d+$/.test(text) || /^-?\d+\.\d+$/.test(text)) return Number(text)
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text) as string
    } catch {
      return undefined
    }
  }
  const single = text.match(/^'(.*)'$/)
  if (single) return single[1]!
  return undefined
}

interface ParsedCall {
  name: string
  values: Record<string, unknown>
}

function parseCall(text: string, context: ParseContext): ParsedCall | null {
  const match = text.match(CALL_PATTERN)
  if (!match) return null

  const name = match[1]!
  const parameters = context.methods.find((method) => method.name === name)?.parameters
  if (!parameters) return null

  const args = splitArgs(match[2] ?? '')
  if (!args || args.length !== parameters.length) return null

  const values: Record<string, unknown> = {}
  for (let index = 0; index < parameters.length; index += 1) {
    const value = parseLiteral(args[index]!)
    if (value === undefined) return null
    values[parameters[index]!.name] = value
  }
  return { name, values }
}

function parseSet(text: string, context: ParseContext): { name: string; value: unknown } | null {
  const match = text.match(SET_PATTERN)
  if (!match) return null

  const name = match[1]!
  if (!context.attributes.some((attribute) => attribute.name === name)) return null

  const value = parseLiteral(match[2]!)
  if (value === undefined) return null
  return { name, value }
}

interface ParsedChange {
  name: string
  operator: ChangeOperator
  amount: number
}

function parseChange(text: string, context: ParseContext): ParsedChange | null {
  const match = text.match(CHANGE_PATTERN)
  if (!match) return null

  const name = match[1]!
  if (match[2] !== name) return null
  const attribute = context.attributes.find((candidate) => candidate.name === name)
  if (!attribute || attribute.type !== 'number') return null

  return { name, operator: match[3] as ChangeOperator, amount: Number(match[4]) }
}

function matchCall(text: string, context: ParseContext): Operation | null {
  const parsed = parseCall(text, context)
  return parsed ? createCallBlock(parsed.name, parsed.values) : null
}

function matchSet(text: string, context: ParseContext): Operation | null {
  const parsed = parseSet(text, context)
  return parsed ? createSetBlock(parsed.name, parsed.value) : null
}

function matchChange(text: string, context: ParseContext): Operation | null {
  const parsed = parseChange(text, context)
  return parsed ? createChangeBlock(parsed.name, parsed.operator, parsed.amount) : null
}

function matchRepeat(text: string): number | null {
  const match = text.match(REPEAT_PATTERN)
  return match ? Number(match[1]) : null
}

function isRecognized(text: string, context: ParseContext): boolean {
  return (
    matchRepeat(text) !== null ||
    parseCall(text, context) !== null ||
    parseChange(text, context) !== null ||
    parseSet(text, context) !== null
  )
}

function parseLines(
  lines: Line[],
  start: number,
  baseIndent: number,
  context: ParseContext,
): Operation[] {
  const ops: Operation[] = []
  let index = start

  while (index < lines.length && lines[index]!.indent >= baseIndent) {
    const line = lines[index]!
    const content = line.text.slice(baseIndent)

    if (line.indent === baseIndent) {
      const times = matchRepeat(content)
      if (times !== null) {
        index += 1
        const childStart = index
        while (index < lines.length && lines[index]!.indent > baseIndent) index += 1
        const childIndent = lines[childStart]?.indent ?? baseIndent + 4
        const children =
          index > childStart ? parseLines(lines, childStart, childIndent, context) : []
        ops.push({ ...createRepeatBlock(times), children })
        continue
      }

      const call = matchCall(content, context)
      if (call) {
        ops.push(call)
        index += 1
        continue
      }

      const change = matchChange(content, context)
      if (change) {
        ops.push(change)
        index += 1
        continue
      }

      const set = matchSet(content, context)
      if (set) {
        ops.push(set)
        index += 1
        continue
      }
    }

    const advancedStart = index
    index += 1
    while (
      index < lines.length &&
      lines[index]!.indent >= baseIndent &&
      !(
        lines[index]!.indent === baseIndent &&
        isRecognized(lines[index]!.text.slice(baseIndent), context)
      )
    ) {
      index += 1
    }
    const code = lines
      .slice(advancedStart, index)
      .map((item) => item.text.slice(baseIndent))
      .join('\n')
    ops.push(createCodeBlock(code))
  }

  return ops
}

/**
 * Turns Python method-body code into blocks. Statements the visual editor can
 * represent become blocks; everything else is preserved as "advanced code"
 * blocks so nothing is lost.
 */
export function codeToBlocks(scene: Scene, definition: ClassDefinition, code: string): Operation[] {
  const lines = toLines(code)
  if (lines.length === 0) return []

  const context: ParseContext = {
    methods: availableBlockMethods(scene, definition),
    attributes: availableBlockAttributes(scene, definition),
  }
  const baseIndent = Math.min(...lines.map((line) => line.indent))
  return parseLines(lines, 0, baseIndent, context)
}
