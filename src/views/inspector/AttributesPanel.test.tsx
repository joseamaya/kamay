import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
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

  it('edits a custom per-instance attribute', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    const definition = createClassDraft('Heroe')
    definition.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    useProjectStore.getState().saveClass(sceneId, definition)
    useProjectStore.getState().instantiateClass(sceneId, definition.id)
    const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id
    useEditorStore.setState({ selectedObjectId: objectId })

    render(<AttributesPanel />)
    const input = screen.getByLabelText('vida')
    await user.clear(input)
    await user.type(input, '40')

    expect(useProjectStore.getState().project.scenes[0]!.objects[0]!.attributes.vida).toBe(40)
  })

  it('resets a custom attribute to the class default', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    const definition = createClassDraft('Heroe')
    definition.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    useProjectStore.getState().saveClass(sceneId, definition)
    useProjectStore.getState().instantiateClass(sceneId, definition.id)
    const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id
    useProjectStore.getState().updateObjectAttributes(sceneId, objectId, { vida: 40 })
    useEditorStore.setState({ selectedObjectId: objectId })

    render(<AttributesPanel />)
    await user.click(screen.getByRole('button', { name: 'Restablecer al valor de la clase: vida' }))

    expect(useProjectStore.getState().project.scenes[0]!.objects[0]!.attributes.vida).toBe(100)
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
