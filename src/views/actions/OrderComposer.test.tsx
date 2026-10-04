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
        body: { kind: 'code', code: 'self.decir(mensaje)' },
      },
    ]
    useProjectStore.getState().saveClass(currentScene().id, definition)
    useProjectStore.getState().instantiateClass(currentScene().id, definition.id)
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    await user.selectOptions(screen.getByLabelText('Orden'), 'saludar')
    await user.type(screen.getByLabelText('Mensaje'), 'hola')
    await user.click(screen.getByRole('button', { name: 'Agregar orden' }))

    expect(currentScene().events[0]?.actions[0]).toMatchObject({
      target: 'heroe1',
      method: 'saludar',
      args: { mensaje: 'hola' },
    })
  })

  it('adds a click action whose source is the object', async () => {
    const user = userEvent.setup()
    useProjectStore.getState().addObject(currentScene().id, 'circle')
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    await user.selectOptions(screen.getByLabelText('Cuándo'), 'on_click')
    await user.type(screen.getByLabelText('Mensaje'), 'hola')
    await user.click(screen.getByRole('button', { name: 'Agregar orden' }))

    const clickEvent = currentScene().events.find((event) => event.type === 'on_click')
    expect(clickEvent?.source).toBe('circle1')
    expect(clickEvent?.actions[0]).toMatchObject({ method: 'decir', args: { mensaje: 'hola' } })
  })

  it('adds a collision action with the other object', async () => {
    const user = userEvent.setup()
    useProjectStore.getState().addObject(currentScene().id, 'circle')
    useProjectStore.getState().addObject(currentScene().id, 'circle')
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    await user.selectOptions(screen.getByLabelText('Cuándo'), 'on_collision')
    await user.type(screen.getByLabelText('Mensaje'), 'boom')
    await user.click(screen.getByRole('button', { name: 'Agregar orden' }))

    const event = currentScene().events.find((candidate) => candidate.type === 'on_collision')
    expect(event?.source).toBe('circle1')
    expect(event?.other).toBe('circle2')
  })

  it('adds an action for the object', async () => {
    const user = userEvent.setup()
    useProjectStore.getState().addObject(currentScene().id, 'circle')
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    await user.type(screen.getByLabelText('Mensaje'), 'hola')
    await user.click(screen.getByRole('button', { name: 'Agregar orden' }))

    expect(currentScene().events[0]?.actions[0]).toMatchObject({
      target: 'circle1',
      method: 'decir',
      args: { mensaje: 'hola' },
    })
  })
})
