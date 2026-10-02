import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
import { ActionsPanel } from './ActionsPanel'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null, log: [] })
})

describe('ActionsPanel', () => {
  it('shows a hint when nothing is selected', () => {
    render(<ActionsPanel />)
    expect(screen.getByText('Selecciona un objeto para darle órdenes.')).toBeInTheDocument()
  })

  it('offers custom class methods', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    const definition = createClassDraft('Heroe')
    definition.methods = [
      {
        name: 'saludar',
        parameters: [{ name: 'mensaje', type: 'string' }],
        body: { kind: 'code', code: 'self.decir(mensaje)' },
      },
    ]
    useProjectStore.getState().saveClass(sceneId, definition)
    useProjectStore.getState().instantiateClass(sceneId, definition.id)
    const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id
    useEditorStore.setState({ selectedObjectId: objectId })

    render(<ActionsPanel />)
    await user.selectOptions(screen.getByLabelText('Orden'), 'saludar')
    await user.type(screen.getByLabelText('Mensaje'), 'hola')
    await user.click(screen.getByRole('button', { name: 'Agregar orden' }))

    const events = useProjectStore.getState().project.scenes[0]!.events
    expect(events[0]?.actions[0]).toMatchObject({
      target: 'heroe1',
      method: 'saludar',
      args: { mensaje: 'hola' },
    })
  })

  it('adds an action for the selected object', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')
    const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id
    useEditorStore.setState({ selectedObjectId: objectId })

    render(<ActionsPanel />)
    await user.type(screen.getByLabelText('Mensaje'), 'hola')
    await user.click(screen.getByRole('button', { name: 'Agregar orden' }))

    const events = useProjectStore.getState().project.scenes[0]!.events
    expect(events[0]?.actions[0]).toMatchObject({
      target: 'circle1',
      method: 'decir',
      args: { mensaje: 'hola' },
    })
  })
})
