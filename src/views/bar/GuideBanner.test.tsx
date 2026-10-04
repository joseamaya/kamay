import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
import { GuideBanner } from './GuideBanner'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null })
})

describe('GuideBanner', () => {
  it('shows the level and the next mission', () => {
    render(<GuideBanner />)

    expect(screen.getByText('Nivel 1')).toBeInTheDocument()
    expect(screen.getByText('Siguiente misión: Pon algo en el escenario')).toBeInTheDocument()
  })
})
