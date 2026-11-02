import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useObservationsStore } from '../../store'
import { StatePanel } from './StatePanel'

beforeEach(() => {
  useObservationsStore.getState().reset()
})

describe('StatePanel', () => {
  it('shows the before → after of the last change', () => {
    const store = useObservationsStore.getState()
    store.record({ target: 'heroe1', name: 'energia', value: 50 })
    store.record({ target: 'heroe1', name: 'energia', value: 80 })

    render(<StatePanel />)

    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('heroe1.energia')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
  })

  it('uses the previous step value as the before, not the initial one', () => {
    const store = useObservationsStore.getState()
    store.record({ target: 'heroe1', name: 'energia', value: 50 })
    store.record({ target: 'heroe1', name: 'energia', value: 70 })
    store.record({ target: 'heroe1', name: 'energia', value: 90 })

    render(<StatePanel />)

    expect(screen.getByText('70')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.queryByText('50')).not.toBeInTheDocument()
  })

  it('hides when nothing changed', () => {
    useObservationsStore.getState().record({ target: 'heroe1', name: 'energia', value: 50 })

    const { container } = render(<StatePanel />)

    expect(container).toBeEmptyDOMElement()
  })
})
