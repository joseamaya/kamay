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

  it('edits the object position', async () => {
    const user = userEvent.setup()
    useProjectStore.getState().addObject(currentScene().id, 'circle')
    useEditorStore.setState({ selectedObjectId: currentScene().objects[0]!.id })

    render(<Harness />)
    const input = screen.getByLabelText('X')
    await user.clear(input)
    await user.type(input, '25')

    expect(currentScene().objects[0]!.attributes.x).toBe(25)
  })
})
