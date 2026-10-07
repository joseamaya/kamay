import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('exposes the label as its accessible name and as a tooltip', () => {
    render(<IconButton label="Ejecutar">▶</IconButton>)

    expect(screen.getByRole('button', { name: 'Ejecutar' })).toBeInTheDocument()
    expect(screen.getByText('Ejecutar')).toBeInTheDocument()
  })

  it('calls onClick and respects disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(
      <IconButton label="Ejecutar" onClick={onClick}>
        ▶
      </IconButton>,
    )

    await user.click(screen.getByRole('button', { name: 'Ejecutar' }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(
      <IconButton label="Ejecutar" onClick={onClick} disabled>
        ▶
      </IconButton>,
    )
    await user.click(screen.getByRole('button', { name: 'Ejecutar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('marks a toggle as pressed', () => {
    render(
      <IconButton label="Paso a paso" pressed>
        ≡
      </IconButton>,
    )

    expect(screen.getByRole('button', { name: 'Paso a paso' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
