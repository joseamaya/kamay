import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useObservationsStore, useProjectStore } from '../../store'
import { StatePanel } from './StatePanel'

function projectWithHeroe(): void {
  const definition = createClassDraft('Heroe')
  definition.attributes.push({ name: 'energia', type: 'number', initial: 50 })
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  const sceneId = useProjectStore.getState().project.scenes[0]!.id
  useProjectStore.getState().saveClass(sceneId, definition)
  useProjectStore.getState().instantiateClass(sceneId, definition.id)
}

beforeEach(() => {
  useObservationsStore.getState().reset()
})

describe('StatePanel', () => {
  it('shows attributes changed during the run', () => {
    projectWithHeroe()
    useObservationsStore.getState().record({ target: 'heroe1', name: 'energia', value: 80 })

    render(<StatePanel />)

    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('heroe1.energia')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
  })

  it('hides when nothing changed from the modeled state', () => {
    projectWithHeroe()
    useObservationsStore.getState().record({ target: 'heroe1', name: 'energia', value: 50 })

    const { container } = render(<StatePanel />)

    expect(container).toBeEmptyDOMElement()
  })
})
