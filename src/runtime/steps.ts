import type { RuntimeMessage } from './types'

/** A group of messages applied together as one step. */
export type Step = RuntimeMessage[]

export interface StepQueue {
  steps: Step[]
  cursor: number
  /** Leading `state` messages (from `__init__`) coalesce into one step. */
  initializing: boolean
  /** Open method calls: their `state`/nested calls join the current step. */
  depth: number
}

export function createStepQueue(): StepQueue {
  return { steps: [], cursor: 0, initializing: true, depth: 0 }
}

export function pushMessage(queue: StepQueue, message: RuntimeMessage): StepQueue {
  const birth = message.type === 'state' || message.type === 'created'
  if (queue.initializing && birth) {
    if (queue.steps.length === 0) return { ...queue, steps: [[message]] }
    const steps = queue.steps.slice()
    const last = steps[steps.length - 1]!
    steps[steps.length - 1] = [...last, message]
    return { ...queue, steps }
  }

  const opening = message.type === 'call'
  const closing = message.type === 'return'
  const inCall = queue.depth > 0
  const steps = queue.steps.slice()

  if (opening) {
    if (inCall && steps.length > 0) steps[steps.length - 1] = [...steps[steps.length - 1]!, message]
    else steps.push([message])
  } else if (closing || inCall) {
    if (steps.length > 0) steps[steps.length - 1] = [...steps[steps.length - 1]!, message]
    else steps.push([message])
  } else if (message.type === 'finished') {
    if (steps.length > 0) steps[steps.length - 1] = [...steps[steps.length - 1]!, message]
  } else {
    steps.push([message])
  }

  const depth = opening ? queue.depth + 1 : closing ? Math.max(0, queue.depth - 1) : queue.depth
  return { steps, cursor: queue.cursor, initializing: false, depth }
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
