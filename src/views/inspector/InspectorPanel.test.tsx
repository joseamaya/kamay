import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
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
})

describe('InspectorPanel', () => {
  it('shows the selected object with its orders and state', () => {
    selectCar()

    render(<InspectorPanel />)

    expect(screen.getByText('carro1')).toBeInTheDocument()
    expect(screen.getByText('Instancia de Carro')).toBeInTheDocument()
    expect(screen.getByText('Llamadas')).toBeInTheDocument()
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
})
