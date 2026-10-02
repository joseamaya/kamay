import type { RuntimeCommand } from './types'

type CommandListener = (command: RuntimeCommand) => void

const commandListeners = new Set<CommandListener>()
const resetListeners = new Set<() => void>()

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
