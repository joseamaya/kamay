import type { TriggerKind } from './types'

export type EventHandler = () => void

function key(kind: TriggerKind, source: string): string {
  return `${kind}:${source}`
}

/**
 * Keeps the Python event handlers registered by the running program so the
 * main thread can trigger them later (click, collision).
 */
export class EventRegistry {
  private handlers = new Map<string, EventHandler>()

  clear(): void {
    this.handlers.clear()
  }

  register(kind: TriggerKind, source: string, handler: EventHandler): void {
    this.handlers.set(key(kind, source), handler)
  }

  has(kind: TriggerKind, source: string): boolean {
    return this.handlers.has(key(kind, source))
  }

  /** Runs the handler for the given trigger; returns false when none is registered. */
  dispatch(kind: TriggerKind, source: string): boolean {
    const handler = this.handlers.get(key(kind, source))
    if (!handler) return false
    handler()
    return true
  }
}
