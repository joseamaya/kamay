import { findBuiltinMethod } from '../model'
import type {
  Action,
  Attribute,
  ClassDefinition,
  Method,
  ObjectInstance,
  Project,
  Scene,
} from '../model'

export interface GeneratedFile {
  path: string
  content: string
}

export interface GenerationResult {
  files: GeneratedFile[]
}

const ENCODING_HEADER = '# -*- coding: utf-8 -*-'

const TYPE_HINTS: Record<Attribute['type'], string> = {
  number: 'float',
  string: 'str',
  boolean: 'bool',
}

function pyLiteral(value: unknown): string {
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

function indent(text: string, spaces = 4): string {
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? pad + line : line))
    .join('\n')
}

function collectClasses(project: Project): ClassDefinition[] {
  const byName = new Map<string, ClassDefinition>()
  for (const scene of project.scenes) {
    for (const definition of scene.classes) {
      if (!byName.has(definition.name)) byName.set(definition.name, definition)
    }
  }
  return [...byName.values()]
}

function generateMethod(method: Method): string {
  const parameters = ['self', ...method.parameters.map((p) => `${p.name}: ${TYPE_HINTS[p.type]}`)]
  const lines: string[] = [`def ${method.name}(${parameters.join(', ')}):`]

  if (method.body.kind === 'code') {
    lines.push(method.body.code.trim().length > 0 ? indent(method.body.code.trim()) : '    pass')
    return lines.join('\n')
  }

  if (method.body.ops.length === 0) {
    lines.push('    pass')
  } else {
    lines.push('    # TODO: ejecutar bloques (Fase 3)')
    lines.push('    pass')
  }
  return lines.join('\n')
}

function generateClassFile(definition: ClassDefinition): string {
  const bases = definition.inherits ? `(${definition.inherits})` : ''
  const lines: string[] = [ENCODING_HEADER, `# Clase ${definition.name}`]

  if (definition.inherits === 'Actor') {
    lines.push('', 'from kamay_runtime import Actor')
  }

  lines.push('', `class ${definition.name}${bases}:`)

  const members: string[] = []

  if (definition.inherits || definition.attributes.length > 0) {
    const initLines = ['def __init__(self, name=None):']
    const body: string[] = []
    if (definition.inherits) body.push('super().__init__(name)')
    for (const attribute of definition.attributes) {
      body.push(`self.${attribute.name} = ${pyLiteral(attribute.initial)}`)
    }
    if (body.length === 0) body.push('pass')
    initLines.push(indent(body.join('\n')))
    members.push(initLines.join('\n'))
  }

  for (const method of definition.methods) {
    members.push(generateMethod(method))
  }

  if (members.length === 0) {
    lines.push('    pass')
  } else {
    lines.push(indent(members.join('\n\n')))
  }

  return `${lines.join('\n')}\n`
}

function findObject(scene: Scene, target: string): ObjectInstance | undefined {
  return scene.objects.find((object) => object.id === target || object.name === target)
}

function resolveVariableName(scene: Scene, target: string): string {
  const found = findObject(scene, target)
  return found ? found.name : target
}

/**
 * Orders action arguments by the method's declared parameter order. Unknown
 * arguments are appended in their recorded order so nothing is dropped.
 */
function orderedArgs(scene: Scene, action: Action): unknown[] {
  const object = findObject(scene, action.target)
  const definition = object
    ? scene.classes.find((candidate) => candidate.name === object.class)
    : undefined
  const method = definition?.methods.find((candidate) => candidate.name === action.method)
  const parameters = method?.parameters ?? findBuiltinMethod(action.method)?.parameters
  if (!parameters) return Object.values(action.args)

  const byParameter = parameters
    .filter((parameter) => parameter.name in action.args)
    .map((parameter) => action.args[parameter.name])
  const extras = Object.entries(action.args)
    .filter(([name]) => !parameters.some((parameter) => parameter.name === name))
    .map(([, value]) => value)

  return [...byParameter, ...extras]
}

function generateAction(scene: Scene, action: Action): string {
  const variable = resolveVariableName(scene, action.target)
  const args = orderedArgs(scene, action).map(pyLiteral)
  return `${variable}.${action.method}(${args.join(', ')})`
}

function generateObjectStatements(object: ObjectInstance): string[] {
  const lines = [`${object.name} = ${object.class}(${pyLiteral(object.name)})`]
  for (const [key, value] of Object.entries(object.attributes)) {
    lines.push(`${object.name}.${key} = ${pyLiteral(value)}`)
  }
  return lines
}

function generateSceneBody(scene: Scene): string[] {
  const lines: string[] = [`# Escena: ${scene.name}`]

  for (const object of scene.objects) {
    lines.push(...generateObjectStatements(object))
  }

  for (const event of scene.events) {
    if (event.type === 'on_start') {
      for (const action of event.actions) {
        lines.push(generateAction(scene, action))
      }
    } else {
      lines.push(`# TODO: evento ${event.type} (Fase 2)`)
    }
  }

  return lines
}

function generateBootstrap(project: Project, classes: ClassDefinition[]): string {
  const usedClassNames = new Set<string>()
  for (const scene of project.scenes) {
    for (const object of scene.objects) usedClassNames.add(object.class)
  }

  const imports = classes
    .filter((definition) => usedClassNames.has(definition.name))
    .map((definition) => `from ${definition.name} import ${definition.name}`)

  const header = [ENCODING_HEADER, `# Proyecto: ${project.meta.name}`]
  if (project.meta.author) header.push(`# Autor: ${project.meta.author}`)
  header.push('# Generado por Kamay. Se regenera desde el modelo JSON; no edites a mano.')

  const body: string[] = []
  project.scenes.forEach((scene, index) => {
    if (index > 0) body.push('')
    body.push(...generateSceneBody(scene))
  })
  if (body.length === 0) body.push('pass')

  const main = ['def main():', indent(body.join('\n'))].join('\n')

  const parts = [...header, '']
  if (imports.length > 0) parts.push(...imports, '')
  parts.push(main, '', '', 'if __name__ == "__main__":', '    main()')

  return `${parts.join('\n')}\n`
}

/**
 * Generates the Python source for a project in a deterministic way:
 * the same model always produces the same files and ordering.
 */
export function generatePython(project: Project): GenerationResult {
  const classes = collectClasses(project)
  const files: GeneratedFile[] = classes.map((definition) => ({
    path: `${definition.name}.py`,
    content: generateClassFile(definition),
  }))

  files.push({ path: 'principal.py', content: generateBootstrap(project, classes) })

  return { files }
}
