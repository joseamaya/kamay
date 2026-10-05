import { describe, expect, it } from 'vitest'

import { advance, createStepQueue, currentStep, isDone, pushMessage, remainingSteps } from './steps'
import type { RuntimeMessage } from './types'

const state = (name: string): RuntimeMessage => ({
  type: 'state',
  target: 'perro1',
  name,
  value: 1,
})
const say = (message: string): RuntimeMessage => ({ type: 'say', target: 'perro1', message })

describe('step queue', () => {
  it('coalesces the leading state messages into one step', () => {
    let queue = createStepQueue()
    queue = pushMessage(queue, state('color'))
    queue = pushMessage(queue, state('shape'))
    queue = pushMessage(queue, state('energia'))
    queue = pushMessage(queue, say('hola'))
    queue = pushMessage(queue, state('energia'))

    expect(queue.steps).toHaveLength(3)
    expect(queue.steps[0]).toHaveLength(3)
    expect(queue.steps[1]).toHaveLength(1)
    expect(queue.steps[2]).toHaveLength(1)
  })

  it('advances one step at a time until done', () => {
    let queue = createStepQueue()
    queue = pushMessage(queue, say('uno'))
    queue = pushMessage(queue, say('dos'))

    expect(currentStep(queue)).toEqual([say('uno')])
    queue = advance(queue)
    expect(currentStep(queue)).toEqual([say('dos')])
    expect(isDone(queue)).toBe(false)
    queue = advance(queue)
    expect(currentStep(queue)).toBeNull()
    expect(isDone(queue)).toBe(true)
  })

  it('exposes the remaining steps for resuming', () => {
    let queue = createStepQueue()
    queue = pushMessage(queue, say('uno'))
    queue = pushMessage(queue, say('dos'))
    queue = advance(queue)

    expect(remainingSteps(queue)).toEqual([[say('dos')]])
  })
})
