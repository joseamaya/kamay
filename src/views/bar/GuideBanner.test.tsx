import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEditorStore, useProgressStore, useProjectStore } from '../../store'
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

  it('suggests a reachable mission instead of a locked one', () => {
    useProgressStore.setState({
      freeMode: false,
      unlockedLevel: 4,
      completed: [
        'first_object',
        'give_order',
        'say_hello',
        'move_it',
        'own_class',
        'own_attribute',
        'own_method',
      ],
    })

    render(<GuideBanner />)

    expect(screen.getByText('Nivel 4')).toBeInTheDocument()
    expect(screen.getByText('Siguiente misión: Provoca un choque')).toBeInTheDocument()
    expect(screen.queryByText(/Hereda/)).not.toBeInTheDocument()
  })
})
