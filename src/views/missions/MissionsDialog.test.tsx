import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useEditorStore, useProgressStore } from '../../store'
import { MissionsDialog } from './MissionsDialog'

beforeEach(() => {
  useProgressStore.setState({
    completed: [],
    freeMode: true,
    unlockedLevel: 1,
    onboardingDone: true,
  })
  useEditorStore.setState({ revealedHints: {} })
})

describe('MissionsDialog', () => {
  it('reveals hints progressively', async () => {
    const user = userEvent.setup()
    render(<MissionsDialog open onClose={() => undefined} />)

    const dialog = screen.getByRole('dialog', { name: 'Misiones' })
    const hintButton = within(dialog).getAllByRole('button', { name: 'Pista' })[0]!

    await user.click(hintButton)
    expect(screen.getByText('Empieza por «Objetos»: hay formas y personajes.')).toBeInTheDocument()

    await user.click(hintButton)
    expect(
      screen.getByText('Toca un objeto del catálogo y aparecerá en el escenario.'),
    ).toBeInTheDocument()
  })

  it('marks missions above the current level as locked', () => {
    useProgressStore.setState({
      completed: [],
      freeMode: false,
      unlockedLevel: 1,
      onboardingDone: true,
    })

    render(<MissionsDialog open onClose={() => undefined} />)

    const dialog = screen.getByRole('dialog', { name: 'Misiones' })
    expect(within(dialog).getAllByText('Se desbloquea en el Nivel 3.').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('Se desbloquea en el Nivel 5.').length).toBeGreaterThan(0)
  })
})
