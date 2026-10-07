import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEditorStore } from '../../store'
import { MissionToast } from './MissionToast'

beforeEach(() => {
  useEditorStore.setState({ toast: null })
})

describe('MissionToast', () => {
  it('renders nothing without a toast', () => {
    render(<MissionToast />)
    expect(screen.queryByText('¡Misión completada!')).not.toBeInTheDocument()
  })

  it('shows the mission and hides it after a delay', () => {
    vi.useFakeTimers()
    useEditorStore.setState({ toast: { kind: 'mission', detail: 'Pon algo en el escenario' } })
    render(<MissionToast />)

    expect(screen.getByText('¡Misión completada!')).toBeInTheDocument()
    expect(screen.getByText('Pon algo en el escenario')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(useEditorStore.getState().toast).toBeNull()
    vi.useRealTimers()
  })

  it('celebrates an unlocked level with its title', () => {
    useEditorStore.setState({ toast: { kind: 'level', level: 4 } })
    render(<MissionToast />)

    expect(screen.getByText('¡Nivel 4 desbloqueado!')).toBeInTheDocument()
    expect(screen.getByText('Escribe código')).toBeInTheDocument()
  })
})
