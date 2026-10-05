import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEvidenceStore, useProjectStore } from '../../store'
import { RubricDialog } from './RubricDialog'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEvidenceStore.getState().reset()
})

describe('RubricDialog', () => {
  it('lists the criteria with their status', () => {
    render(<RubricDialog open onClose={() => undefined} />)

    expect(screen.getByRole('dialog', { name: 'Rúbrica' })).toBeInTheDocument()
    expect(screen.getByText('Objetos')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Herencia')).toBeInTheDocument()
    expect(screen.getAllByText('Presentado')).toHaveLength(9)
  })

  it('shows the recorded learning evidence', () => {
    useEvidenceStore.setState({
      version: 1,
      misconceptions: ['shared_state'],
      predictions: { state: { correct: 1, misconception: 0, explained: 0 } },
    })

    render(<RubricDialog open onClose={() => undefined} />)

    expect(screen.getByText(/Para repasar/)).toBeInTheDocument()
    expect(screen.getByText('Estado compartido')).toBeInTheDocument()
    expect(screen.getByText('Predicciones acertadas: 1 de 1')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<RubricDialog open={false} onClose={() => undefined} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
