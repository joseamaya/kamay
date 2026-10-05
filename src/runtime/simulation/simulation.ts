import {
  collisionKey,
  findBuiltinMethod,
  resolveAttributeDefaults,
  resolveMethods,
} from '../../model'
import type { Action, AttributeValue, Operation, Project, Scene, SceneEvent } from '../../model'
import type { RuntimeError, RuntimeMessage, RuntimeStatus, TriggerKind } from '../types'

interface RuntimeObject {
  id: string
  name: string
  class: string
  attributes: Record<string, AttributeValue>
}

export interface SimulationOptions {
  project: Project
  sceneId: string | null
  emit: (message: RuntimeMessage) => void
  onError: (error: RuntimeError) => void
  onStatus: (status: RuntimeStatus) => void
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
    this.scene = scene ?? options.project.scenes[0]!
  }

  start(): void {
    this.options.onStatus('running')
    for (const object of this.scene.objects) {
      const attributes: Record<string, AttributeValue> = {
        ...resolveAttributeDefaults(this.scene, object.class),
        ...object.attributes,
      }
      this.objects.set(object.name, {
        id: object.id,
        name: object.name,
        class: object.class,
        attributes,
      })
      for (const [name, value] of Object.entries(attributes)) {
        this.emitState(object.name, name, value)
      }
    }
    for (const event of this.scene.events) {
      if (event.type === 'on_start') this.runActions(event)
    }
    this.options.onStatus('ready')
  }

  trigger(kind: TriggerKind, source: string): void {
    for (const event of this.scene.events) {
      if (this.matchesTrigger(event, kind, source)) this.runActions(event)
    }
  }

  stop(): void {
    this.objects.clear()
  }

  private matchesTrigger(event: SceneEvent, kind: TriggerKind, source: string): boolean {
    if (kind === 'click') return event.type === 'on_click' && event.source === source
    if (kind === 'key') return event.type === 'on_key' && event.key === source
    if (kind === 'collision') {
      if (event.type !== 'on_collision' || !event.source || !event.other) return false
      return collisionKey(event.source, event.other) === source
    }
    return false
  }

  private runActions(event: SceneEvent): void {
    for (const action of event.actions) this.runAction(action)
  }

  private runAction(action: Action): void {
    const object = this.findObject(action.target)
    if (object) this.invoke(object, action.method, action.args)
  }

  private invoke(
    object: RuntimeObject,
    name: string,
    values: Record<string, AttributeValue>,
  ): void {
    const method = resolveMethods(this.scene, object.class).find(
      (candidate) => candidate.name === name,
    )
    if (method) {
      if (method.body.kind === 'code') {
        this.error(`No se puede simular el método ${name} (código avanzado).`)
        return
      }
      this.runOps(object, method.body.ops)
      return
    }
    if (findBuiltinMethod(name)) {
      this.runBuiltin(object, name, values)
      return
    }
    this.error(`No existe el método ${name} en ${object.class}.`)
  }

  private runBuiltin(
    object: RuntimeObject,
    name: string,
    values: Record<string, AttributeValue>,
  ): void {
    switch (name) {
      case 'decir':
        this.options.emit({
          type: 'say',
          target: object.name,
          message: String(values.mensaje ?? ''),
        })
        break
      case 'mover':
        this.options.emit({
          type: 'move',
          target: object.name,
          x: Number(values.x) || 0,
          y: Number(values.y) || 0,
        })
        break
      case 'girar':
        this.options.emit({
          type: 'rotate',
          target: object.name,
          degrees: Number(values.grados) || 0,
        })
        break
      case 'cambiar_escala':
        this.options.emit({
          type: 'scale',
          target: object.name,
          factor: Number(values.factor) || 0,
        })
        break
      case 'esperar':
        this.options.emit({ type: 'wait', seconds: Number(values.segundos) || 0 })
        break
      case 'emitir': {
        const signal = String(values.nombre ?? '')
        for (const event of this.scene.events) {
          if (event.type === 'on_signal' && event.signal === signal) this.runActions(event)
        }
        break
      }
    }
  }

  private runOps(object: RuntimeObject, ops: Operation[]): void {
    for (const op of ops) {
      if (op.op === 'set') {
        this.setAttribute(object, String(op.args.name ?? ''), op.args.value as AttributeValue)
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
          (op.args.values ?? {}) as Record<string, AttributeValue>,
        )
      } else if (op.op === 'repeat') {
        const times = Number(op.args.times) || 0
        for (let index = 0; index < times; index += 1) this.runOps(object, op.children)
      } else if (op.op === 'code') {
        this.error('No se puede simular un bloque de código avanzado.')
      }
    }
  }

  private setAttribute(object: RuntimeObject, name: string, value: AttributeValue): void {
    object.attributes[name] = value
    this.emitState(object.name, name, value)
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

  private error(message: string): void {
    this.options.onError({ kind: 'SimulationError', message, file: null, line: null })
  }
}
