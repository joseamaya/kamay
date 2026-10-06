import {
  collisionKey,
  DOMAIN_BASES,
  objectsOfClass,
  resolveMethods,
  withDomainBases,
} from '../model'
import type {
  Action,
  ClassDefinition,
  EventType,
  Method,
  ObjectInstance,
  Project,
  Scene,
  SceneEvent,
} from '../model'
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
  eventType: EventType | null
  source: string | null
  other: string | null
  eventKey: string | null
  actionIndex: number
}

export interface EditableValue extends ValueTarget {
  value: number | string | boolean
  raw: string
  from: number
  to: number
}

export interface GenerationResult {
  files: GeneratedFile[]
  editableValues: EditableValue[]
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

function eventRef(
  event: SceneEvent,
): Omit<ValueTarget, 'kind' | 'objectName' | 'key' | 'actionIndex'> {
  return {
    eventType: event.type,
    source: event.source,
    other: event.other,
    eventKey: event.key,
  }
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

function generateClassFile(definition: ClassDefinition, scene: Scene): string {
  const bases = definition.inherits ? `(${definition.inherits})` : ''
  const lines: string[] = [ENCODING_HEADER, `# Clase ${definition.name}`]

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

  const members: string[] = []

  if (definition.inherits || definition.attributes.length > 0 || definition.components.length > 0) {
    const initLines = ['def __init__(self, name=None):']
    const body: string[] = []
    if (definition.inherits) body.push('super().__init__(name)')
    for (const attribute of definition.attributes) {
      body.push(`self.${attribute.name} = ${pyLiteral(attribute.initial)}`)
    }
    for (const component of definition.components) {
      body.push(`self.${component.name} = ${component.class}(${pyLiteral(component.name)})`)
    }
    if (body.length === 0) body.push('pass')
    initLines.push(indent(body.join('\n')))
    members.push(initLines.join('\n'))
  }

  for (const method of definition.methods) {
    members.push(generateMethod(method, definition, scene))
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
  event: SceneEvent,
  actionIndex: number,
  collected: CollectedValue[],
): string {
  const variable =
    action.kind === 'for_each'
      ? (action.variable ?? 'elemento')
      : resolveVariableName(scene, action.target)
  const args = orderedArgs(scene, action).map(({ name, value }) =>
    mark(
      pyLiteral(value),
      {
        kind: 'action-arg',
        objectName: variable,
        key: name,
        actionIndex,
        ...eventRef(event),
      },
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
        {
          kind: 'attribute',
          objectName: object.name,
          key,
          eventType: null,
          source: null,
          other: null,
          eventKey: null,
          actionIndex: -1,
        },
        value,
        collected,
      )}`,
    )
  }
  return lines
}

function pushHandler(lines: string[], name: string, actions: string[]): void {
  lines.push(`def ${name}():`)
  lines.push(actions.length > 0 ? indent(actions.join('\n')) : '    pass')
}

function pyIdentifier(value: string): string {
  const base = value === ' ' ? 'space' : value.replace(/[^A-Za-z0-9_]/g, '_')
  return /^[A-Za-z_]/.test(base) ? base : `_${base}`
}

function generateSceneBody(scene: Scene, collected: CollectedValue[]): string[] {
  const lines: string[] = [`# Escena: ${scene.name}`]

  for (const object of scene.objects) {
    lines.push(...generateObjectStatements(object, collected))
  }

  for (const event of scene.events) {
    if (event.type !== 'on_click' || !event.source) continue
    const name = `al_hacer_clic_${event.source}`
    pushHandler(
      lines,
      name,
      event.actions.map((action, index) => generateAction(scene, action, event, index, collected)),
    )
    lines.push(`registrar("click", ${pyLiteral(event.source)}, ${name})`)
  }

  for (const event of scene.events) {
    if (event.type !== 'on_collision' || !event.source || !event.other) continue
    const [first, second] = [event.source, event.other].sort()
    const name = `al_colisionar_${first}_${second}`
    pushHandler(
      lines,
      name,
      event.actions.map((action, index) => generateAction(scene, action, event, index, collected)),
    )
    lines.push(
      `registrar("collision", ${pyLiteral(collisionKey(event.source, event.other))}, ${name})`,
    )
  }

  const keyGroups = groupActionsBy(scene, 'on_key', (event) => event.key)
  for (const [key, refs] of keyGroups) {
    const name = `al_pulsar_${pyIdentifier(key)}`
    pushHandler(
      lines,
      name,
      refs.map(({ event, actionIndex }) =>
        generateAction(scene, event.actions[actionIndex]!, event, actionIndex, collected),
      ),
    )
    lines.push(`registrar("key", ${pyLiteral(key)}, ${name})`)
  }

  // Run start actions last so every handler is registered before they fire.
  for (const event of scene.events) {
    if (event.type !== 'on_start') continue
    event.actions.forEach((action, index) => {
      lines.push(generateAction(scene, action, event, index, collected))
    })
  }

  return lines
}

interface ActionRef {
  event: SceneEvent
  actionIndex: number
}

/** Groups the generated actions of an event type by a discriminating field. */
function groupActionsBy(
  scene: Scene,
  type: 'on_key',
  pick: (event: SceneEvent) => string | null,
): Map<string, ActionRef[]> {
  const groups = new Map<string, ActionRef[]>()
  for (const event of scene.events) {
    if (event.type !== type) continue
    const value = pick(event)
    if (!value) continue
    const refs = groups.get(value) ?? []
    event.actions.forEach((_, actionIndex) => refs.push({ event, actionIndex }))
    groups.set(value, refs)
  }
  return groups
}

function generateBootstrap(
  project: Project,
  classes: ClassDefinition[],
  collected: CollectedValue[],
): string {
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

  const needsRegistrar = project.scenes.some((scene) =>
    scene.events.some(
      (event) =>
        ((event.type === 'on_click' || event.type === 'on_collision') && event.source) ||
        (event.type === 'on_key' && event.key),
    ),
  )
  if (needsRegistrar) imports.push('from kamay_runtime import registrar')
  if (rawCode) imports.push('from kamay_runtime import preparar')

  const header = [ENCODING_HEADER, `# Proyecto: ${project.meta.name}`]
  if (project.meta.author) header.push(`# Autor: ${project.meta.author}`)
  header.push('# Generado por Kamay. Se regenera desde el modelo JSON; no edites a mano.')

  const body: string[] = []
  if (rawCode) {
    for (const definition of classes) body.push(`preparar(${definition.name})`)
    body.push('')
  }
  project.scenes.forEach((scene, index) => {
    if (index > 0) body.push('')
    body.push(...generateSceneBody(scene, collected))
  })
  if (body.length === 0) body.push('pass')

  const main = ['def main():', indent(body.join('\n'))].join('\n')

  const parts = [...header, '']
  if (imports.length > 0) parts.push(...imports, '')
  parts.push(main, '', '', 'if __name__ == "__main__":', '    main()')

  return `${parts.join('\n')}\n`
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
  const files: GeneratedFile[] = classes.map((definition) => {
    const scene =
      scoped.scenes.find((candidate) =>
        candidate.classes.some((item) => item.id === definition.id),
      ) ?? scoped.scenes[0]!
    return { path: `${definition.name}.py`, content: generateClassFile(definition, scene) }
  })

  const collected: CollectedValue[] = []
  const marked = generateBootstrap(scoped, classes, collected)
  const { content, values } = extractEditableValues(marked, collected)
  files.push({ path: 'principal.py', content })

  return { files, editableValues: values }
}
