import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useActiveScene, useEditorStore, useProjectStore, useSelectedObject } from '../../store'
import { OrderComposer } from './OrderComposer'

function Harness() {
  const scene = useActiveScene()
  const object = useSelectedObject()
  if (!scene || !object) return null
  return <OrderComposer scene={scene} object={object} />
}

function currentScene() {
  return useProjectStore.getState().project.scenes[0]!
}

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null })
})

describe('OrderComposer', () => {
  it('offers custom class methods', async () => {
    const user = userEvent.setup()
    const definition = createClassDraft('Heroe')
    definition.methods = [
      {
        name: 'saludar',
        parameters: [{ name: 'mensaje', type: 'string' }],
        body: { kind: 'blocks', ops: [] },
      },
    ]
    useProjectStore.getState().saveClass(currentScene().id, definition)
    useProjectStore.getState().instantiateClass(currentScene().id, definition.id)
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    await user.selectOptions(screen.getByLabelText('Mensaje'), 'saludar')
    await user.type(screen.getByLabelText('Texto'), 'hola')
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(currentScene().orders[0]).toMatchObject({
      target: 'heroe1',
      method: 'saludar',
      args: { mensaje: 'hola' },
    })
  })

  it('adds a for-each order over a class', async () => {
    const user = userEvent.setup()
    useProjectStore.getState().addObject(currentScene().id, 'perro')
    useProjectStore.getState().addObject(currentScene().id, 'gato')
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    await user.selectOptions(screen.getByLabelText('Tipo de mensaje'), 'for_each')
    await user.selectOptions(screen.getByLabelText('Clase'), 'Animal')
    await user.selectOptions(screen.getByLabelText('Mensaje'), 'comer')
    await user.click(screen.getByRole('button', { name: 'Agregar «para cada»' }))

    expect(currentScene().orders[0]).toMatchObject({
      kind: 'for_each',
      class: 'Animal',
      variable: 'elemento',
      method: 'comer',
      args: {},
    })
  })

  it('adds orders for the object in order', async () => {
    const user = userEvent.setup()
    useProjectStore.getState().addObject(currentScene().id, 'carro')
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await user.selectOptions(screen.getByLabelText('Mensaje'), 'moverse')
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(currentScene().orders.map((order) => order.method)).toEqual(['tocar_bocina', 'moverse'])
  })
})
