import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { useProjectStore } from '../../store'
import { RubricDialog } from './RubricDialog'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
})

describe('RubricDialog', () => {
  it('lists the criteria with their status', () => {
    render(<RubricDialog open onClose={() => undefined} />)

    expect(screen.getByRole('dialog', { name: 'Rúbrica' })).toBeInTheDocument()
    expect(screen.getByText('Objetos')).toBeInTheDocument()
    expect(screen.getByText('Herencia')).toBeInTheDocument()
    expect(screen.getAllByText('No iniciado')).toHaveLength(6)
  })

  it('renders nothing when closed', () => {
    render(<RubricDialog open={false} onClose={() => undefined} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
