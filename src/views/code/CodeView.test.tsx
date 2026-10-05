import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore, useRuntimeStore } from '../../store'
import { CodeView } from './CodeView'

function editorText(container: HTMLElement): string {
  return container.querySelector('.cm-content')?.textContent ?? ''
}

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ codeFile: null, codeCollapsed: false, codeHeight: 240 })
  useRuntimeStore.setState({ status: 'idle', error: null })
})

describe('CodeView', () => {
  it('shows the active file name and its code', async () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'carro')

    const { container } = render(<CodeView />)

    expect(screen.getByText('principal.py')).toBeInTheDocument()
    await waitFor(() => expect(editorText(container)).toContain('carro1 = Carro("carro1")'))

    act(() => {
      useEditorStore.setState({ codeFile: 'Carro.py' })
    })

    expect(screen.getByText('Carro.py')).toBeInTheDocument()
    await waitFor(() => expect(editorText(container)).toContain('class Carro(Vehiculo):'))
  })

  it('opens the offending file when a runtime error points at generated code', async () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'carro')

    render(<CodeView />)
    expect(screen.getByText('principal.py')).toBeInTheDocument()

    act(() => {
      useRuntimeStore.setState({
        status: 'error',
        error: { kind: 'NameError', message: 'NameError: ...', file: 'Carro.py', line: 3 },
      })
    })

    await waitFor(() => expect(screen.getByText('Carro.py')).toBeInTheDocument())
  })

  it('copies the active file', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<CodeView />)

    await user.click(screen.getByRole('button', { name: 'Copiar' }))

    expect(writeText).toHaveBeenCalled()
  })

  it('collapses and expands the panel', async () => {
    const user = userEvent.setup()
    render(<CodeView />)

    await user.click(screen.getByRole('button', { name: 'Ocultar' }))
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })
})
