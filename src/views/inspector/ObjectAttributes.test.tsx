import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useActiveScene, useEditorStore, useProjectStore, useSelectedObject } from '../../store'
import { ObjectAttributes } from './ObjectAttributes'

function Harness() {
  const scene = useActiveScene()
  const object = useSelectedObject()
  if (!scene || !object) return null
  return <ObjectAttributes scene={scene} object={object} />
}

function currentScene() {
  return useProjectStore.getState().project.scenes[0]!
}

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null })
})

describe('ObjectAttributes', () => {
  it('edits a custom per-instance attribute', async () => {
    const user = userEvent.setup()
    const definition = createClassDraft('Heroe')
    definition.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    useProjectStore.getState().saveClass(currentScene().id, definition)
    useProjectStore.getState().instantiateClass(currentScene().id, definition.id)
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    const input = screen.getByLabelText('vida')
    await user.clear(input)
    await user.type(input, '40')

    expect(currentScene().objects[0]!.attributes.vida).toBe(40)
  })

  it('resets a custom attribute to the class default', async () => {
    const user = userEvent.setup()
    const definition = createClassDraft('Heroe')
    definition.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    useProjectStore.getState().saveClass(currentScene().id, definition)
    useProjectStore.getState().instantiateClass(currentScene().id, definition.id)
    const objectId = currentScene().objects[0]!.id
    useProjectStore.getState().updateObjectAttributes(currentScene().id, objectId, { vida: 40 })
    useEditorStore.setState({ selectedObjectId: objectId })

    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Restablecer al valor de la clase: vida' }))

    expect(currentScene().objects[0]!.attributes.vida).toBe(100)
  })

  it('labels inherited attributes with their origin', () => {
    const animal = createClassDraft('Animal')
    animal.attributes.push({ name: 'energia', type: 'number', initial: 50 })
    useProjectStore.getState().saveClass(currentScene().id, animal)
    const perro = createClassDraft('Perro')
    perro.inherits = 'Animal'
    useProjectStore.getState().saveClass(currentScene().id, perro)
    useProjectStore.getState().instantiateClass(currentScene().id, perro.id)
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)

    expect(screen.getByLabelText('energia')).toBeInTheDocument()
    expect(screen.getByText('Heredado de Animal')).toBeInTheDocument()
  })

  it('groups the fields into transform, appearance and state', () => {
    const definition = createClassDraft('Heroe')
    definition.attributes.push({ name: 'vida', type: 'number', initial: 100 })
    useProjectStore.getState().saveClass(currentScene().id, definition)
    useProjectStore.getState().instantiateClass(currentScene().id, definition.id)
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)

    expect(screen.getByText('Transformación')).toBeInTheDocument()
    expect(screen.getByText('Aspecto')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
  })

  it('edits the object position', async () => {
    const user = userEvent.setup()
    useProjectStore.getState().addObject(currentScene().id, 'carro')
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    const input = screen.getByLabelText('X')
    await user.clear(input)
    await user.type(input, '25')

    expect(currentScene().objects[0]!.attributes.x).toBe(25)
  })
})
