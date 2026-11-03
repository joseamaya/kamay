import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import type { PredictionScenario } from '../../pedagogy'
import { usePredictionStore, useProgressStore } from '../../store'
import { PredictionDialog } from './PredictionDialog'

const scenario: PredictionScenario = {
  kind: 'independent',
  concept: 'state',
  objectName: 'perro1',
  className: 'Perro',
  attribute: 'energia',
  newValue: 20,
  siblingName: 'perro2',
  siblingValue: 50,
}

const sharedScenario: PredictionScenario = {
  kind: 'shared',
  concept: 'state',
  objectName: 'bateria1',
  className: 'Bateria',
  attribute: 'carga',
  newValue: 50,
  siblingName: 'radio1',
  siblingValue: 100,
  siblingAttribute: 'bateria',
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

  it('lets the student retry and get it right', async () => {
    const user = userEvent.setup()
    usePredictionStore.getState().ask(scenario)

    render(<PredictionDialog />)

    await user.click(screen.getByRole('button', { name: 'También cambiará a 20' }))
    await user.click(screen.getByRole('button', { name: 'Volver a intentar' }))
    expect(screen.getByText(/¿Qué valor tendrá perro2\.energia\?/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Seguirá siendo 50' }))
    expect(screen.getByText(/Cada instancia tiene su propio estado/)).toBeInTheDocument()
  })

  it('asks about a shared reference and explains that it is the same object', async () => {
    const user = userEvent.setup()
    usePredictionStore.getState().ask(sharedScenario)

    render(<PredictionDialog />)

    expect(screen.getByText(/radio1\.bateria apunta a bateria1/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Seguirá siendo 100' }))
    expect(screen.getByText(/comparten el mismo estado/)).toBeInTheDocument()
  })
})
