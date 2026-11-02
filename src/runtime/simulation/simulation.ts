import {
  objectsOfClass,
  resolveAttributeDefaults,
  resolveAttributes,
  resolveComponents,
  resolveMethods,
  withDomainBases,
} from '../../model'
import type { Action, AttributeValue, Operation, Project, Scene } from '../../model'
import type { RuntimeError, RuntimeMessage, RuntimeStatus } from '../types'

interface RuntimeObject {
  id: string
  name: string
  class: string
  attributes: Record<string, AttributeValue>
}

/** Thrown internally to stop the simulation as soon as an error is reported. */
class SimulationHalt extends Error {}

export interface SimulationOptions {
  project: Project
  sceneId: string | null
  emit: (message: RuntimeMessage) => void
  onError: (error: RuntimeError) => void
  onStatus: (status: RuntimeStatus) => void
  /** Called once objects are instantiated, before `on_start` runs. */
  onInitialized?: () => void
}

/** Whether the scene has any method the simulator cannot interpret (raw code). */
export function hasRawCode(project: Project, sceneId: string | null): boolean {
  const scenes = sceneId ? project.scenes.filter((scene) => scene.id === sceneId) : project.scenes
  return scenes.some((scene) =>
    scene.classes.some((definition) =>
      definition.methods.some((method) => method.body.kind === 'code'),
    ),
  )
}

/**
 * Interprets a block-only project in TypeScript and streams the same messages
 * the Python runtime would, so the canvas, state panel and step mode are reused.
 */
export class Simulation {
  private readonly scene: Scene
  private readonly objects = new Map<string, RuntimeObject>()
  private readonly options: SimulationOptions

  constructor(options: SimulationOptions) {
    this.options = options
    const scene = options.sceneId
      ? options.project.scenes.find((candidate) => candidate.id === options.sceneId)
      : options.project.scenes[0]
    this.scene = withDomainBases(scene ?? options.project.scenes[0]!)
  }

  start(): void {
    this.options.onStatus('running')
    try {
      for (const object of this.scene.objects) {
        this.instantiate(object.name, object.class, object.attributes, object.id)
      }
      this.options.onInitialized?.()
      for (const action of this.scene.orders) this.runAction(action)
    } catch (error) {
      if (!(error instanceof SimulationHalt)) throw error
      this.options.onStatus('error')
      return
    }
    this.options.emit({ type: 'finished' })
    this.options.onStatus('ready')
  }

  stop(): void {
    this.objects.clear()
  }

  /**
   * Creates an object and, recursively, the components it owns. Component names
   * are qualified with their owner (`carro1.motor`) so two owners never share
   * the identity of their parts, mirroring the generated Python. A local class
   * chain guards against composition cycles from imported projects.
   */
  private instantiate(
    name: string,
    className: string,
    overrides: Record<string, AttributeValue> = {},
    id: string = name,
    path: string[] = [],
  ): RuntimeObject {
    const merged: Record<string, AttributeValue> = {
      ...resolveAttributeDefaults(this.scene, className),
      ...overrides,
    }
    const references = new Set(
      resolveAttributes(this.scene, className)
        .filter((attribute) => attribute.type === 'reference')
        .map((attribute) => attribute.name),
    )
    const attributes: Record<string, AttributeValue> = {}
    for (const [key, value] of Object.entries(merged)) {
      // A reference with no target is simply "nothing", not an empty value.
      if (references.has(key) && (typeof value !== 'string' || value.length === 0)) continue
      attributes[key] = value
    }
    const runtime: RuntimeObject = { id, name, class: className, attributes }
    this.objects.set(name, runtime)
    for (const [attribute, value] of Object.entries(attributes)) {
      this.emitState(name, attribute, value)
    }

    const ancestry = [...path, className]
    for (const component of resolveComponents(this.scene, className)) {
      if (!this.scene.classes.some((candidate) => candidate.name === component.class)) {
        this.error(`No existe la clase ${component.class} de la parte ${component.name}.`)
      }
      if (ancestry.includes(component.class)) {
        this.error(`Composición cíclica: ${className} contiene ${component.class}.`)
      }
      const childName = `${name}.${component.name}`
      this.instantiate(childName, component.class, {}, childName, ancestry)
    }

    this.emitCreated(runtime)
    return runtime
  }

  private runAction(action: Action): void {
    if (action.kind === 'for_each') {
      for (const instance of objectsOfClass(this.scene, action.class ?? '')) {
        const object = this.findObject(instance.name)
        if (object) this.invoke(object, action.method, action.args)
      }
      return
    }
    const object = this.findObject(action.target)
    if (object) this.invoke(object, action.method, action.args)
  }

  private invoke(object: RuntimeObject, name: string, args: Record<string, unknown> = {}): void {
    const method = resolveMethods(this.scene, object.class).find(
      (candidate) => candidate.name === name,
    )
    if (!method) {
      this.error(`No existe el método ${name} en ${object.class}.`)
      return
    }
    if (method.body.kind === 'code') {
      this.error(`No se puede simular el método ${name} (código avanzado).`)
      return
    }
    this.emitCall(object, name, args)
    this.runOps(object, method.body.ops, args)
    this.options.emit({ type: 'return', id: object.id, method: name })
  }

  private runOps(
    object: RuntimeObject,
    ops: Operation[],
    args: Record<string, unknown> = {},
  ): void {
    for (const op of ops) {
      if (op.op === 'set') {
        this.setAttribute(object, String(op.args.name ?? ''), op.args.value as AttributeValue)
      } else if (op.op === 'set_from_param') {
        const name = String(op.args.name ?? '')
        const parameter = String(op.args.parameter ?? '')
        const value = args[parameter]
        if (value === undefined) {
          this.error(`No se pasó el parámetro ${parameter}.`)
          return
        }
        if (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'boolean') {
          this.error(`El parámetro ${parameter} no es un valor simple.`)
          return
        }
        this.setAttribute(object, name, value)
      } else if (op.op === 'change') {
        const name = String(op.args.name ?? '')
        const amount = Number(op.args.amount) || 0
        const current = Number(object.attributes[name]) || 0
        this.setAttribute(
          object,
          name,
          op.args.operator === '-' ? current - amount : current + amount,
        )
      } else if (op.op === 'call') {
        this.invoke(
          object,
          String(op.args.method ?? ''),
          (op.args.values ?? {}) as Record<string, unknown>,
        )
      } else if (op.op === 'call_on') {
        const target = String(op.args.target ?? '')
        const part = this.resolvePart(object, target)
        if (!part) {
          this.error(`No existe la parte ${target} en ${object.class}.`)
          return
        }
        this.invoke(
          part,
          String(op.args.method ?? ''),
          (op.args.values ?? {}) as Record<string, unknown>,
        )
      } else if (op.op === 'repeat') {
        const times = Number(op.args.times) || 0
        for (let index = 0; index < times; index += 1) this.runOps(object, op.children, args)
      } else if (op.op === 'code') {
        this.error('No se puede simular un bloque de código avanzado.')
      }
    }
  }

  private setAttribute(object: RuntimeObject, name: string, value: AttributeValue): void {
    object.attributes[name] = value
    this.emitState(object.name, name, value)
  }

  private emitCreated(object: RuntimeObject): void {
    this.options.emit({
      type: 'created',
      id: object.id,
      name: object.name,
      className: object.class,
      attributes: { ...object.attributes },
    })
  }

  private emitCall(object: RuntimeObject, method: string, args: Record<string, unknown>): void {
    this.options.emit({
      type: 'call',
      id: object.id,
      name: object.name,
      className: object.class,
      method,
      args,
    })
  }

  private emitState(target: string, name: string, value: AttributeValue): void {
    this.options.emit({ type: 'state', target, name, value })
  }

  private findObject(target: string): RuntimeObject | undefined {
    for (const object of this.objects.values()) {
      if (object.id === target || object.name === target) return object
    }
    return undefined
  }

  /** A call destination: an owned component (`owner.part`) or a reference value. */
  private resolvePart(object: RuntimeObject, target: string): RuntimeObject | undefined {
    const component = this.findObject(`${object.name}.${target}`)
    if (component) return component
    const reference = object.attributes[target]
    if (typeof reference === 'string' && reference.length > 0) return this.findObject(reference)
    return undefined
  }

  private error(message: string): void {
    this.options.onError({ kind: 'SimulationError', message, file: null, line: null })
    throw new SimulationHalt(message)
  }
}
