import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useEditorStore, useProgressStore, useProjectStore } from '../../store'
import { FactoryView } from './FactoryView'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null, log: [] })
})

describe('FactoryView', () => {
  it('adds a catalog object to the scene', async () => {
    const user = userEvent.setup()
    render(<FactoryView />)

    await user.click(screen.getByRole('button', { name: 'Agregar Carro al escenario' }))

    expect(screen.getByRole('button', { name: 'carro1' })).toBeInTheDocument()
    expect(useProjectStore.getState().project.scenes[0]?.objects).toHaveLength(1)
  })

  it('offers a create-class call to action when there are no classes', () => {
    render(<FactoryView />)

    expect(screen.getByRole('button', { name: 'Crear mi primera clase' })).toBeInTheDocument()
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

  it('hides the class editor until level 3', () => {
    useProgressStore.setState({ completed: [], freeMode: false, unlockedLevel: 1 })
    render(<FactoryView />)

    expect(screen.queryByRole('button', { name: 'Nueva clase' })).not.toBeInTheDocument()
    expect(screen.getByText('Se desbloquea en el Nivel 3.')).toBeInTheDocument()
  })

  it('duplicates an object', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'carro')

    render(<FactoryView />)
    await user.click(screen.getByRole('button', { name: 'Duplicar carro1' }))

    const objects = useProjectStore.getState().project.scenes[0]!.objects
    expect(objects).toHaveLength(2)
    expect(objects[1]?.name).toBe('carro2')
  })

  it('does not allow deleting system classes', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'carro')

    render(<FactoryView />)

    expect(screen.getByRole('button', { name: 'Eliminar clase Vehiculo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Eliminar clase Carro' })).toBeDisabled()
  })

  it('removes an object after confirming the dialog', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'carro')

    render(<FactoryView />)
    await user.click(screen.getByRole('button', { name: 'Eliminar carro1' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(useProjectStore.getState().project.scenes[0]?.objects).toHaveLength(0)
  })

  it('offers base class tiles once inheritance is unlocked', () => {
    render(<FactoryView />)

    expect(
      screen.getByRole('button', { name: 'Crear clase que hereda de Vehiculo' }),
    ).toBeInTheDocument()
  })

  it('hides base class tiles until level 5', () => {
    useProgressStore.setState({ completed: [], freeMode: false, unlockedLevel: 1 })
    render(<FactoryView />)

    expect(
      screen.queryByRole('button', { name: 'Crear clase que hereda de Vehiculo' }),
    ).not.toBeInTheDocument()
  })

  it('creates a class that inherits a base from the palette', async () => {
    const user = userEvent.setup()
    render(<FactoryView />)

    await user.click(screen.getByRole('button', { name: 'Crear clase que hereda de Vehiculo' }))

    const select = screen.getByLabelText('Hereda de') as HTMLSelectElement
    expect(select.value).toBe('Vehiculo')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(useProjectStore.getState().project.scenes[0]?.classes[0]?.inherits).toBe('Vehiculo')
  })

  it('nests a subclass under its base', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().saveClass(sceneId, createClassDraft('Alpha'))
    useProjectStore
      .getState()
      .saveClass(sceneId, { ...createClassDraft('Beta'), inherits: 'Alpha' })

    render(<FactoryView />)

    expect(screen.getByText('Alpha').closest('li')).toHaveAttribute('data-depth', '0')
    expect(screen.getByText('Beta').closest('li')).toHaveAttribute('data-depth', '1')
  })

  it('shows a chip when the base is not in the scene', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore
      .getState()
      .saveClass(sceneId, { ...createClassDraft('Heroe'), inherits: 'Vehiculo' })

    render(<FactoryView />)

    expect(screen.getByText('hereda de Vehiculo')).toBeInTheDocument()
  })
})
