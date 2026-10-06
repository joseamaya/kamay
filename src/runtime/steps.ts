import type { RuntimeMessage } from './types'

/** A group of messages applied together as one step. */
export type Step = RuntimeMessage[]

export interface StepQueue {
  steps: Step[]
  cursor: number
  /** Leading `state` messages (from `__init__`) coalesce into one step. */
  initializing: boolean
}

export function createStepQueue(): StepQueue {
  return { steps: [], cursor: 0, initializing: true }
}

export function pushMessage(queue: StepQueue, message: RuntimeMessage): StepQueue {
  if (queue.initializing && message.type === 'state') {
    if (queue.steps.length === 0) return { ...queue, steps: [[message]] }
    const steps = queue.steps.slice()
    const last = steps[steps.length - 1]!
    steps[steps.length - 1] = [...last, message]
    return { ...queue, steps }
  }
  return { steps: [...queue.steps, [message]], cursor: queue.cursor, initializing: false }
}

/** Stops coalescing leading state messages once the initial setup is done. */
export function finishInitializing(queue: StepQueue): StepQueue {
  return queue.initializing ? { ...queue, initializing: false } : queue
}

export function currentStep(queue: StepQueue): Step | null {
  return queue.steps[queue.cursor] ?? null
}

export function advance(queue: StepQueue): StepQueue {
  return { ...queue, cursor: Math.min(queue.cursor + 1, queue.steps.length) }
}

export function remainingSteps(queue: StepQueue): Step[] {
  return queue.steps.slice(queue.cursor)
}

export function isDone(queue: StepQueue): boolean {
  return queue.cursor >= queue.steps.length
}
