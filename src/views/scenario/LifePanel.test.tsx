import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useRuntimeLogStore } from '../../store'
import { LifePanel } from './LifePanel'

beforeEach(() => {
  useRuntimeLogStore.getState().reset()
})

describe('LifePanel', () => {
  it('renders nothing without events', () => {
    const { container } = render(<LifePanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists the birth and the calls of the objects', () => {
    const log = useRuntimeLogStore.getState()
    log.record({
      type: 'created',
      id: 'carro1',
      name: 'carro1',
      className: 'Carro',
      attributes: {},
    })
    log.record({
      type: 'call',
      id: 'carro1',
      name: 'carro1',
      className: 'Carro',
      method: 'prender',
      args: {},
    })
    log.record({ type: 'return', id: 'carro1', method: 'prender' })

    render(<LifePanel />)

    expect(screen.getByText('Nace carro1 (Carro)')).toBeInTheDocument()
    expect(screen.getByText('carro1.prender()')).toBeInTheDocument()
  })

  it('lists state changes with before and after, hiding the initial seeding', () => {
    const log = useRuntimeLogStore.getState()
    log.record({ type: 'state', target: 'carro1', name: 'distancia', value: 0 })
    log.record({
      type: 'created',
      id: 'carro1',
      name: 'carro1',
      className: 'Carro',
      attributes: {},
    })
    log.record({ type: 'state', target: 'carro1', name: 'distancia', value: 50 })

    render(<LifePanel />)

    expect(screen.getByText('carro1.distancia: 0 → 50')).toBeInTheDocument()
    expect(screen.queryByText('carro1.distancia: 0 → 0')).not.toBeInTheDocument()
  })
})
