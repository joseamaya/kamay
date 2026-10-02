import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
import { AttributesPanel } from './AttributesPanel'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null, log: [] })
})

describe('AttributesPanel', () => {
  it('shows a hint when nothing is selected', () => {
    render(<AttributesPanel />)
    expect(
      screen.getByText('Selecciona un objeto para editar sus propiedades.'),
    ).toBeInTheDocument()
  })

  it('edits the selected object position', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')
    const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id
    useEditorStore.setState({ selectedObjectId: objectId })

    render(<AttributesPanel />)
    const input = screen.getByLabelText('X')
    await user.clear(input)
    await user.type(input, '25')

    expect(useProjectStore.getState().project.scenes[0]!.objects[0]!.attributes.x).toBe(25)
  })
})
