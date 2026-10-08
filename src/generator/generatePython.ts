import { DOMAIN_BASES, objectsOfClass, resolveMethods, withDomainBases } from '../model'
import type { Action, ClassDefinition, Method, ObjectInstance, Project, Scene } from '../model'
import { blocksToLines } from './blocks'
import { indent, pyLiteral, TYPE_HINTS } from './python'

export interface GeneratedFile {
  path: string
  content: string
}

/** Identity of an editable literal so an edit can be mapped back to the model. */
export interface ValueTarget {
  kind: 'attribute' | 'action-arg'
  objectName: string
  /** Attribute key or parameter name. */
  key: string
  orderIndex: number
}

export interface EditableValue extends ValueTarget {
  value: number | string | boolean
  raw: string
  from: number
  to: number
}

/** A model entity located in the generated source, for inspector ↔ code links. */
export type GeneratedSymbolKind =
  'class' | 'init' | 'method' | 'attribute' | 'component' | 'object' | 'order'

export interface GeneratedSymbol {
  file: string
  kind: GeneratedSymbolKind
  /** Declaring class for class members; target class for objects and orders. */
  className?: string
  /** Instance name for object and order symbols. */
  objectName?: string
  /** Method, attribute or component name. */
  member?: string
  /** Index within `scene.orders` for order symbols. */
  orderIndex?: number
  /** 1-based inclusive line range in the file. */
  lineFrom: number
  lineTo: number
}

export interface GenerationResult {
  files: GeneratedFile[]
  editableValues: EditableValue[]
  symbols: GeneratedSymbol[]
}

/** The most specific symbol covering a line, or `null` when none matches. */
export function symbolAtLine(
  symbols: GeneratedSymbol[],
  file: string,
  line: number,
): GeneratedSymbol | null {
  let match: GeneratedSymbol | null = null
  for (const symbol of symbols) {
    if (symbol.file !== file) continue
    if (line < symbol.lineFrom || line > symbol.lineTo) continue
    if (!match || symbol.lineTo - symbol.lineFrom < match.lineTo - match.lineFrom) match = symbol
  }
  return match
}

const ENCODING_HEADER = '# -*- coding: utf-8 -*-'

const VALUE_OPEN = '\u0001'
const VALUE_CLOSE = '\u0002'

interface CollectedValue {
  target: ValueTarget
  value: number | string | boolean
  raw: string
}

function mark(
  raw: string,
  target: ValueTarget,
  value: unknown,
  collected: CollectedValue[],
): string {
  collected.push({ target, value: value as number | string | boolean, raw })
  return `${VALUE_OPEN}${raw}${VALUE_CLOSE}`
}

function collectClasses(project: Project): ClassDefinition[] {
  const byName = new Map<string, ClassDefinition>()
  for (const scene of project.scenes) {
    for (const definition of scene.classes) {
      if (!byName.has(definition.name)) byName.set(definition.name, definition)
    }
  }
  // A class may inherit a domain base that is not placed in the scene; emit it.
  for (const definition of [...byName.values()]) {
    const base = definition.inherits
    if (base && !byName.has(base) && base in DOMAIN_BASES) {
      byName.set(base, DOMAIN_BASES[base]!)
    }
  }
  return [...byName.values()]
}

function generateMethod(method: Method, definition: ClassDefinition, scene: Scene): string {
  const parameters = ['self', ...method.parameters.map((p) => `${p.name}: ${TYPE_HINTS[p.type]}`)]
  const lines: string[] = [`def ${method.name}(${parameters.join(', ')}):`]

  if (method.body.kind === 'code') {
    lines.push(method.body.code.trim().length > 0 ? indent(method.body.code.trim()) : '    pass')
    return lines.join('\n')
  }

  const blockLines = blocksToLines(scene, definition, method.body.ops)
  lines.push(blockLines.length > 0 ? indent(blockLines.join('\n')) : '    pass')
  return lines.join('\n')
}

function generateClassFile(
  definition: ClassDefinition,
  scene: Scene,
): { content: string; symbols: GeneratedSymbol[] } {
  const file = `${definition.name}.py`
  const bases = definition.inherits ? `(${definition.inherits})` : ''
  const lines: string[] = [ENCODING_HEADER, `# Clase ${definition.name}`]
  const symbols: GeneratedSymbol[] = []

  const componentClasses = [
    ...new Set(definition.components.map((component) => component.class)),
  ].filter((name) => name !== definition.name && name !== definition.inherits)

  const imports: string[] = []
  if (definition.inherits) {
    imports.push(`from ${definition.inherits} import ${definition.inherits}`)
  }
  for (const name of componentClasses) imports.push(`from ${name} import ${name}`)
  if (imports.length > 0) lines.push('', ...imports)

  lines.push('', `class ${definition.name}${bases}:`)
  symbols.push({
    file,
    kind: 'class',
    className: definition.name,
    lineFrom: lines.length,
    lineTo: lines.length,
  })

  let memberCount = 0
  const addMember = (block: string): number => {
    if (memberCount > 0) lines.push('')
    memberCount += 1
    const start = lines.length + 1
    for (const line of block.split('\n')) lines.push(line.length > 0 ? `    ${line}` : '')
    return start
  }

  if (definition.inherits || definition.attributes.length > 0 || definition.components.length > 0) {
    const body: string[] = []
    const entries: { kind: 'attribute' | 'component'; name: string }[] = []
    if (definition.inherits) body.push('super().__init__(name)')
    for (const attribute of definition.attributes) {
      entries.push({ kind: 'attribute', name: attribute.name })
      body.push(`self.${attribute.name} = ${pyLiteral(attribute.initial)}`)
    }
    for (const component of definition.components) {
      entries.push({ kind: 'component', name: component.name })
      body.push(`self.${component.name} = ${component.class}(${pyLiteral(component.name)})`)
    }
    if (body.length === 0) body.push('pass')
    const block = ['def __init__(self, name=None):', indent(body.join('\n'))].join('\n')
    const start = addMember(block)
    symbols.push({
      file,
      kind: 'init',
      className: definition.name,
      lineFrom: start,
      lineTo: start + block.split('\n').length - 1,
    })
    entries.forEach((entry, index) => {
      symbols.push({
        file,
        kind: entry.kind,
        className: definition.name,
        member: entry.name,
        lineFrom: start + 1 + index,
        lineTo: start + 1 + index,
      })
    })
  }

  for (const method of definition.methods) {
    const block = generateMethod(method, definition, scene)
    const start = addMember(block)
    symbols.push({
      file,
      kind: 'method',
      className: definition.name,
      member: method.name,
      lineFrom: start,
      lineTo: start + block.split('\n').length - 1,
    })
  }

  if (memberCount === 0) lines.push('    pass')

  return { content: `${lines.join('\n')}\n`, symbols }
}

function findObject(scene: Scene, target: string): ObjectInstance | undefined {
  return scene.objects.find((object) => object.id === target || object.name === target)
}

function resolveVariableName(scene: Scene, target: string): string {
  const found = findObject(scene, target)
  return found ? found.name : target
}

interface OrderedArg {
  name: string
  value: unknown
}

/** Methods reachable by an action: the target object's class or the loop class. */
function actionMethods(scene: Scene, action: Action): Method[] {
  const resolved = withDomainBases(scene)
  if (action.kind === 'for_each') return resolveMethods(resolved, action.class ?? '')
  const object = findObject(resolved, action.target)
  return object ? resolveMethods(resolved, object.class) : []
}

/**
 * Orders action arguments by the method's declared parameter order. Unknown
 * arguments are appended in their recorded order so nothing is dropped.
 */
function orderedArgs(scene: Scene, action: Action): OrderedArg[] {
  const method = actionMethods(scene, action).find((candidate) => candidate.name === action.method)
  const parameters = method?.parameters
  if (!parameters) return Object.entries(action.args).map(([name, value]) => ({ name, value }))

  const byParameter = parameters
    .filter((parameter) => parameter.name in action.args)
    .map((parameter) => ({ name: parameter.name, value: action.args[parameter.name] }))
  const extras = Object.entries(action.args)
    .filter(([name]) => !parameters.some((parameter) => parameter.name === name))
    .map(([name, value]) => ({ name, value }))

  return [...byParameter, ...extras]
}

function generateAction(
  scene: Scene,
  action: Action,
  orderIndex: number,
  collected: CollectedValue[],
): string {
  const variable =
    action.kind === 'for_each'
      ? (action.variable ?? 'elemento')
      : resolveVariableName(scene, action.target)
  const args = orderedArgs(scene, action).map(({ name, value }) =>
    mark(
      pyLiteral(value),
      { kind: 'action-arg', objectName: variable, key: name, orderIndex },
      value,
      collected,
    ),
  )

  if (action.kind === 'for_each') {
    const members = objectsOfClass(scene, action.class ?? '').map((object) => object.name)
    return [
      `for ${variable} in [${members.join(', ')}]:`,
      `    ${variable}.${action.method}(${args.join(', ')})`,
    ].join('\n')
  }

  return `${variable}.${action.method}(${args.join(', ')})`
}

function generateObjectStatements(object: ObjectInstance, collected: CollectedValue[]): string[] {
  const lines = [`${object.name} = ${object.class}(${pyLiteral(object.name)})`]
  for (const [key, value] of Object.entries(object.attributes)) {
    lines.push(
      `${object.name}.${key} = ${mark(
        pyLiteral(value),
        { kind: 'attribute', objectName: object.name, key, orderIndex: -1 },
        value,
        collected,
      )}`,
    )
  }
  return lines
}

function generateSceneBody(
  scene: Scene,
  collected: CollectedValue[],
): { lines: string[]; symbols: GeneratedSymbol[] } {
  const file = 'principal.py'
  const lines: string[] = [`# Escena: ${scene.name}`]
  const symbols: GeneratedSymbol[] = []
  let lineCount = lines.length

  for (const object of scene.objects) {
    const statements = generateObjectStatements(object, collected)
    symbols.push({
      file,
      kind: 'object',
      className: object.class,
      objectName: object.name,
      lineFrom: lineCount + 1,
      lineTo: lineCount + statements.length,
    })
    lines.push(...statements)
    lineCount += statements.length
  }

  // The scene runs its orders in the order they were added.
  scene.orders.forEach((action, index) => {
    const text = generateAction(scene, action, index, collected)
    const height = text.split('\n').length
    symbols.push({
      file,
      kind: 'order',
      className: action.class ?? undefined,
      objectName:
        action.kind === 'for_each' ? undefined : resolveVariableName(scene, action.target),
      member: action.method,
      orderIndex: index,
      lineFrom: lineCount + 1,
      lineTo: lineCount + height,
    })
    lines.push(text)
    lineCount += height
  })

  return { lines, symbols }
}

function generateBootstrap(
  project: Project,
  classes: ClassDefinition[],
  collected: CollectedValue[],
): { content: string; symbols: GeneratedSymbol[] } {
  const usedClassNames = new Set<string>()
  for (const scene of project.scenes) {
    for (const object of scene.objects) usedClassNames.add(object.class)
  }

  // Raw-code projects run in Python and need the runtime to report object state.
  const rawCode = classes.some((definition) =>
    definition.methods.some((method) => method.body.kind === 'code'),
  )

  const imports = (
    rawCode ? classes : classes.filter((definition) => usedClassNames.has(definition.name))
  ).map((definition) => `from ${definition.name} import ${definition.name}`)

  if (rawCode) imports.push('from kamay_runtime import preparar')

  const header = [ENCODING_HEADER, `# Proyecto: ${project.meta.name}`]
  if (project.meta.author) header.push(`# Autor: ${project.meta.author}`)
  header.push('# Generado por Kamay. Se regenera desde el modelo JSON; no edites a mano.')

  const body: string[] = []
  const bodySymbols: GeneratedSymbol[] = []
  let bodyLineCount = 0
  if (rawCode) {
    for (const definition of classes) body.push(`preparar(${definition.name})`)
    body.push('')
    bodyLineCount += classes.length + 1
  }
  project.scenes.forEach((scene, index) => {
    if (index > 0) {
      body.push('')
      bodyLineCount += 1
    }
    const sceneBody = generateSceneBody(scene, collected)
    for (const symbol of sceneBody.symbols) {
      bodySymbols.push({
        ...symbol,
        lineFrom: symbol.lineFrom + bodyLineCount,
        lineTo: symbol.lineTo + bodyLineCount,
      })
    }
    body.push(...sceneBody.lines)
    bodyLineCount += sceneBody.lines.reduce((total, line) => total + line.split('\n').length, 0)
  })
  if (body.length === 0) body.push('pass')

  const main = ['def main():', indent(body.join('\n'))].join('\n')

  const parts = [...header, '']
  if (imports.length > 0) parts.push(...imports, '')
  parts.push(main, '', '', 'if __name__ == "__main__":', '    main()')

  // `main` holds `def main():` plus the body lines; find where its body starts.
  const mainIndex = header.length + 1 + (imports.length > 0 ? imports.length + 1 : 0)
  const offset = mainIndex + 1
  const symbols = bodySymbols.map((symbol) => ({
    ...symbol,
    lineFrom: symbol.lineFrom + offset,
    lineTo: symbol.lineTo + offset,
  }))

  return { content: `${parts.join('\n')}\n`, symbols }
}

/** Removes the value markers and returns their positions in the clean source. */
function extractEditableValues(
  marked: string,
  collected: CollectedValue[],
): { content: string; values: EditableValue[] } {
  let content = ''
  const values: EditableValue[] = []
  let cursor = 0
  let index = 0

  for (;;) {
    const open = marked.indexOf(VALUE_OPEN, cursor)
    if (open === -1) break
    const close = marked.indexOf(VALUE_CLOSE, open + 1)
    if (close === -1) break
    content += marked.slice(cursor, open)
    const raw = marked.slice(open + 1, close)
    const from = content.length
    content += raw
    const to = content.length
    const item = collected[index]
    if (item) values.push({ ...item.target, value: item.value, raw: item.raw, from, to })
    index += 1
    cursor = close + 1
  }
  content += marked.slice(cursor)

  return { content, values }
}

/**
 * Generates the Python source for a project in a deterministic way:
 * the same model always produces the same files and ordering. When a scene id
 * is given, only that scene is generated so the stage and the code match.
 */
export function generatePython(project: Project, sceneId?: string | null): GenerationResult {
  const scenes = sceneId ? project.scenes.filter((scene) => scene.id === sceneId) : project.scenes
  const scoped = scenes.length > 0 ? { ...project, scenes } : project
  const classes = collectClasses(scoped)
  const files: GeneratedFile[] = []
  const symbols: GeneratedSymbol[] = []
  for (const definition of classes) {
    const scene =
      scoped.scenes.find((candidate) =>
        candidate.classes.some((item) => item.id === definition.id),
      ) ?? scoped.scenes[0]!
    const generated = generateClassFile(definition, scene)
    files.push({ path: `${definition.name}.py`, content: generated.content })
    symbols.push(...generated.symbols)
  }

  const collected: CollectedValue[] = []
  const bootstrap = generateBootstrap(scoped, classes, collected)
  const { content, values } = extractEditableValues(bootstrap.content, collected)
  files.push({ path: 'principal.py', content })
  symbols.push(...bootstrap.symbols)

  return { files, editableValues: values, symbols }
}
