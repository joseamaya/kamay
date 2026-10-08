import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useEditorStore, useEvidenceStore, useProjectStore } from '../../store'
import { InspectorPanel } from './InspectorPanel'

function selectCar() {
  const sceneId = useProjectStore.getState().project.scenes[0]!.id
  useProjectStore.getState().addObject(sceneId, 'carro')
  const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id
  useEditorStore.setState({ selectedObjectId: objectId })
}

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null, log: [] })
  useEvidenceStore.setState({ misconceptions: [] })
})

describe('InspectorPanel', () => {
  it('shows the selected object with its orders and state', () => {
    selectCar()

    render(<InspectorPanel />)

    expect(screen.getByText('carro1')).toBeInTheDocument()
    expect(screen.getByText('Instancia de Carro')).toBeInTheDocument()
    expect(screen.getByText('Llamada')).toBeInTheDocument()
    expect(screen.getByLabelText('Método')).toBeInTheDocument()
  })

  it('shows the scene properties when nothing is selected', () => {
    render(<InspectorPanel />)

    expect(screen.getByText('Escena')).toBeInTheDocument()
    expect(screen.getByLabelText('Fondo')).toBeInTheDocument()
    expect(
      screen.getByText('Selecciona un objeto para editar sus propiedades.'),
    ).toBeInTheDocument()
  })

  it('duplicates and deletes the selected object', async () => {
    const user = userEvent.setup()
    selectCar()

    render(<InspectorPanel />)

    await user.click(screen.getByRole('button', { name: 'Duplicar' }))
    expect(useProjectStore.getState().project.scenes[0]!.objects).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    expect(useProjectStore.getState().project.scenes[0]!.objects).toHaveLength(1)
    expect(useEditorStore.getState().selectedObjectId).toBeNull()
  })

  it('links a member to its location in the code', async () => {
    const user = userEvent.setup()
    selectCar()

    render(<InspectorPanel />)

    await user.click(screen.getByRole('button', { name: 'Ver moverse en el código' }))
    expect(useEditorStore.getState().highlightedMember).toEqual({
      kind: 'method',
      className: 'Vehiculo',
      name: 'moverse',
    })
  })

  it('links the object to its location in the code', async () => {
    const user = userEvent.setup()
    selectCar()

    render(<InspectorPanel />)

    await user.click(screen.getByRole('button', { name: 'Ver el objeto en el código' }))
    expect(useEditorStore.getState().highlightedMember).toEqual({
      kind: 'object',
      objectName: 'carro1',
    })
  })

  it('warns about a class misconception without recording it', () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    const animal = createClassDraft('Animal')
    animal.methods.push({ name: 'comer', parameters: [], body: { kind: 'blocks', ops: [] } })
    useProjectStore.getState().saveClass(sceneId, animal)
    const perro = createClassDraft('Perro')
    perro.inherits = 'Animal'
    useProjectStore.getState().saveClass(sceneId, perro)
    useProjectStore.getState().instantiateClass(sceneId, perro.id)
    useEditorStore.setState({
      selectedObjectId: useProjectStore.getState().project.scenes[0]!.objects[0]!.id,
    })

    render(<InspectorPanel />)

    expect(screen.getByText(/Herencia para reutilizar/)).toBeInTheDocument()
    expect(useEvidenceStore.getState().misconceptions).not.toContain('inheritance_for_reuse')
  })
})
