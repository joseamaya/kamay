import type { RuntimeCommand, TriggerKind } from './types'

type CommandListener = (command: RuntimeCommand) => void

export interface RuntimeTrigger {
  kind: TriggerKind
  source: string
}

const commandListeners = new Set<CommandListener>()
const resetListeners = new Set<() => void>()
const triggerListeners = new Set<(trigger: RuntimeTrigger) => void>()

export function emitRuntimeCommand(command: RuntimeCommand): void {
  commandListeners.forEach((listener) => listener(command))
}

export function onRuntimeCommand(listener: CommandListener): () => void {
  commandListeners.add(listener)
  return () => commandListeners.delete(listener)
}

export function emitRuntimeReset(): void {
  resetListeners.forEach((listener) => listener())
}

export function onRuntimeReset(listener: () => void): () => void {
  resetListeners.add(listener)
  return () => resetListeners.delete(listener)
}

export function emitRuntimeTrigger(trigger: RuntimeTrigger): void {
  triggerListeners.forEach((listener) => listener(trigger))
}

export function onRuntimeTrigger(listener: (trigger: RuntimeTrigger) => void): () => void {
  triggerListeners.add(listener)
  return () => triggerListeners.delete(listener)
}
