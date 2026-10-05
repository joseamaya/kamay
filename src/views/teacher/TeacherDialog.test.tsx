import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { buildDelivery } from '../../persistence'
import { useTeacherStore } from '../../store'
import { TeacherDialog } from './TeacherDialog'

beforeEach(() => {
  useTeacherStore.getState().clear()
})

describe('TeacherDialog', () => {
  it('shows the empty state', () => {
    render(<TeacherDialog open onClose={() => undefined} />)

    expect(screen.getByRole('dialog', { name: 'Modo docente' })).toBeInTheDocument()
    expect(screen.getByText('Todavía no hay entregas importadas.')).toBeInTheDocument()
  })

  it('renders the aggregate report for the imported deliveries', () => {
    useTeacherStore
      .getState()
      .add([buildDelivery(createEmptyProject({ name: 'Demo' }), ['first_object'], 16)])

    render(<TeacherDialog open onClose={() => undefined} />)

    expect(screen.getByText('Entregas importadas: 1')).toBeInTheDocument()
    expect(screen.getByText('Demo')).toBeInTheDocument()
    expect(screen.getByText('Misiones completadas: 1')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<TeacherDialog open={false} onClose={() => undefined} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
