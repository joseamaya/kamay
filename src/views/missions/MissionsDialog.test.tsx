import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useProgressStore } from '../../store'
import { MissionsDialog } from './MissionsDialog'

beforeEach(() => {
  useProgressStore.setState({
    completed: [],
    freeMode: true,
    unlockedLevel: 1,
    onboardingDone: true,
  })
})

describe('MissionsDialog', () => {
  it('reveals hints progressively', async () => {
    const user = userEvent.setup()
    render(<MissionsDialog open onClose={() => undefined} />)

    const dialog = screen.getByRole('dialog', { name: 'Misiones' })
    const hintButton = within(dialog).getAllByRole('button', { name: 'Pista' })[0]!

    await user.click(hintButton)
    expect(screen.getByText('Empieza por la Fábrica: hay formas y personajes.')).toBeInTheDocument()

    await user.click(hintButton)
    expect(
      screen.getByText('Toca un objeto del catálogo y aparecerá en el escenario.'),
    ).toBeInTheDocument()
  })
})
