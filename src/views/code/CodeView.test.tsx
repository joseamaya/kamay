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
    useProjectStore.getState().addObject(sceneId, 'circle')

    const { container } = render(<CodeView />)

    expect(screen.getByText('principal.py')).toBeInTheDocument()
    await waitFor(() => expect(editorText(container)).toContain('circle1 = Circle("circle1")'))

    act(() => {
      useEditorStore.setState({ codeFile: 'Circle.py' })
    })

    expect(screen.getByText('Circle.py')).toBeInTheDocument()
    await waitFor(() => expect(editorText(container)).toContain('class Circle(Actor):'))
  })

  it('opens the offending file when a runtime error points at generated code', async () => {
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')

    render(<CodeView />)
    expect(screen.getByText('principal.py')).toBeInTheDocument()

    act(() => {
      useRuntimeStore.setState({
        status: 'error',
        error: { kind: 'NameError', message: 'NameError: ...', file: 'Circle.py', line: 3 },
      })
    })

    await waitFor(() => expect(screen.getByText('Circle.py')).toBeInTheDocument())
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
