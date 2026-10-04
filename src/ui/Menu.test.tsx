import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Menu, MenuItem } from './Menu'

describe('Menu', () => {
  it('opens and closes on the trigger', async () => {
    const user = userEvent.setup()
    render(
      <Menu label="Más opciones">
        {() => <MenuItem onClick={() => undefined}>Nuevo</MenuItem>}
      </Menu>,
    )

    const trigger = screen.getByRole('button', { name: 'Más opciones' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Nuevo' })).toBeInTheDocument()
  })

  it('runs an item action and closes the menu', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Menu label="Más opciones">
        {(close) => (
          <MenuItem
            onClick={() => {
              close()
              onSelect()
            }}
          >
            Nuevo
          </MenuItem>
        )}
      </Menu>,
    )

    await user.click(screen.getByRole('button', { name: 'Más opciones' }))
    await user.click(screen.getByRole('menuitem', { name: 'Nuevo' }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <Menu label="Más opciones">
        {() => <MenuItem onClick={() => undefined}>Nuevo</MenuItem>}
      </Menu>,
    )

    await user.click(screen.getByRole('button', { name: 'Más opciones' }))
    expect(screen.getByRole('menuitem')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
  })
})
