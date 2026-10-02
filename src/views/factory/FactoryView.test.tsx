import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
import { FactoryView } from './FactoryView'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null, log: [] })
})

describe('FactoryView', () => {
  it('adds a catalog object to the scene', async () => {
    const user = userEvent.setup()
    render(<FactoryView />)

    await user.click(screen.getByRole('button', { name: 'Agregar Círculo al escenario' }))

    expect(screen.getByRole('button', { name: 'circle1' })).toBeInTheDocument()
    expect(useProjectStore.getState().project.scenes[0]?.objects).toHaveLength(1)
  })

  it('creates a class from the editor', async () => {
    const user = userEvent.setup()
    render(<FactoryView />)

    await user.click(screen.getByRole('button', { name: 'Nueva clase' }))
    const name = screen.getByDisplayValue('MiClase')
    await user.clear(name)
    await user.type(name, 'Heroe')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(useProjectStore.getState().project.scenes[0]?.classes[0]?.name).toBe('Heroe')
  })

  it('instantiates an object of a class', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().saveClass(sceneId, createClassDraft('Heroe'))

    render(<FactoryView />)
    await user.click(screen.getByRole('button', { name: 'Crear objeto de Heroe' }))

    expect(useProjectStore.getState().project.scenes[0]?.objects[0]?.class).toBe('Heroe')
  })

  it('removes an object after confirming the dialog', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')

    render(<FactoryView />)
    await user.click(screen.getByRole('button', { name: 'Eliminar circle1' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(useProjectStore.getState().project.scenes[0]?.objects).toHaveLength(0)
  })
})
