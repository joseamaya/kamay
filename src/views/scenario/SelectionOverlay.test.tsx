import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEditorStore, useProgressStore, useProjectStore } from '../../store'
import { SelectionOverlay } from './SelectionOverlay'

function selectCircle(): void {
  const sceneId = useProjectStore.getState().project.scenes[0]!.id
  useProjectStore.getState().addObject(sceneId, 'circle')
  const objectId = useProjectStore.getState().project.scenes[0]!.objects[0]!.id
  useEditorStore.setState({ selectedObjectId: objectId })
}

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null, log: [] })
})

describe('SelectionOverlay', () => {
  it('shows the object menu with appearance and orders', () => {
    selectCircle()

    render(<SelectionOverlay />)

    expect(screen.getByText('circle1')).toBeInTheDocument()
    expect(screen.getByText('Clase: Circle')).toBeInTheDocument()
    expect(screen.getByText('Aspecto')).toBeInTheDocument()
    expect(screen.getByText('Órdenes')).toBeInTheDocument()
    expect(screen.getByLabelText('Cuándo')).toBeInTheDocument()
  })

  it('hides orders until level 2', () => {
    useProgressStore.setState({ completed: [], freeMode: false, unlockedLevel: 1 })
    selectCircle()

    render(<SelectionOverlay />)

    expect(screen.getByText('Aspecto')).toBeInTheDocument()
    expect(screen.queryByText('Órdenes')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Cuándo')).not.toBeInTheDocument()
  })

  it('deletes the selected object after confirmation', async () => {
    const user = userEvent.setup()
    selectCircle()

    render(<SelectionOverlay />)
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    expect(useProjectStore.getState().project.scenes[0]!.objects).toHaveLength(0)
    expect(useEditorStore.getState().selectedObjectId).toBeNull()
  })
})
