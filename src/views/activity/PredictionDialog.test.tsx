import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import type { PredictionScenario } from '../../pedagogy'
import { usePredictionStore, useProgressStore } from '../../store'
import { PredictionDialog } from './PredictionDialog'

const scenario: PredictionScenario = {
  objectName: 'perro1',
  className: 'Perro',
  attribute: 'energia',
  newValue: 20,
  siblingName: 'perro2',
  siblingValue: 50,
}

beforeEach(() => {
  usePredictionStore.getState().reset()
  useProgressStore.setState({ freeMode: false })
})

describe('PredictionDialog', () => {
  it('asks about the sibling and explains the misconception', async () => {
    const user = userEvent.setup()
    usePredictionStore.getState().ask(scenario)

    render(<PredictionDialog />)

    expect(screen.getByText(/¿Qué valor tendrá perro2\.energia\?/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'También cambiará a 20' }))
    expect(screen.getByText(/cada instancia guarda su propio estado/i)).toBeInTheDocument()
  })
})
