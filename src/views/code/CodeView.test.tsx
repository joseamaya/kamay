import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
import { CodeView } from './CodeView'

function editorText(container: HTMLElement): string {
  return container.querySelector('.cm-content')?.textContent ?? ''
}

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ codeFile: null, codeCollapsed: false, codeHeight: 240 })
})

describe('CodeView', () => {
  it('lists the generated files and switches tabs', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().addObject(sceneId, 'circle')

    const { container } = render(<CodeView />)

    expect(screen.getByRole('tab', { name: 'principal.py' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.click(screen.getByRole('tab', { name: 'Circle.py' }))

    expect(screen.getByRole('tab', { name: 'Circle.py' })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(editorText(container)).toContain('class Circle(Actor):'))
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
