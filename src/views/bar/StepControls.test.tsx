import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RuntimeApi } from '../../runtime'
import { createStepQueue } from '../../runtime/steps'
import { useRuntimeStore } from '../../store'
import { StepControls } from './StepControls'

function api(overrides: Partial<RuntimeApi> = {}): RuntimeApi {
  return {
    run: vi.fn(),
    stop: vi.fn(),
    setStepMode: vi.fn(),
    step: vi.fn(),
    resume: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  useRuntimeStore.setState({ stepMode: false, stepQueue: createStepQueue() })
})

describe('StepControls', () => {
  it('turns step mode on', async () => {
    const runtime = api()
    render(<StepControls runtime={runtime} />)

    await userEvent.click(screen.getByRole('button', { name: 'Paso a paso' }))

    expect(runtime.setStepMode).toHaveBeenCalledWith(true)
  })

  it('shows the step progress and advances', async () => {
    const runtime = api()
    useRuntimeStore.setState({
      stepMode: true,
      stepQueue: {
        steps: [[{ type: 'say', target: 'a', message: 'hola' }]],
        cursor: 0,
        initializing: false,
      },
    })

    render(<StepControls runtime={runtime} />)

    expect(screen.getByText('Paso 1 de 1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Paso' }))
    expect(runtime.step).toHaveBeenCalled()
  })

  it('resumes when step mode is turned off', async () => {
    const runtime = api()
    useRuntimeStore.setState({ stepMode: true, stepQueue: createStepQueue() })

    render(<StepControls runtime={runtime} />)
    await userEvent.click(screen.getByRole('button', { name: 'Paso a paso' }))

    expect(runtime.resume).toHaveBeenCalled()
  })
})
