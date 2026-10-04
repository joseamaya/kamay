import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useProgressStore } from '../../store'
import { WelcomeCard } from './WelcomeCard'

beforeEach(() => {
  useProgressStore.setState({
    completed: [],
    freeMode: false,
    unlockedLevel: 1,
    onboardingDone: false,
  })
})

describe('WelcomeCard', () => {
  it('shows the first steps and marks onboarding as done', async () => {
    const user = userEvent.setup()
    render(<WelcomeCard />)

    expect(screen.getByText('¡Bienvenido a Kamay!')).toBeInTheDocument()
    expect(screen.getByText('Selecciónalo para ver qué puede hacer.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '¡Empecemos!' }))

    expect(useProgressStore.getState().onboardingDone).toBe(true)
  })
})
