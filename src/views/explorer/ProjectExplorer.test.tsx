import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createEmptyProject } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
import { ProjectExplorer } from './ProjectExplorer'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ codeFile: null, codeCollapsed: true })
})

describe('ProjectExplorer', () => {
  it('lists the generated files and opens one in the code dock', async () => {
    const user = userEvent.setup()
    const sceneId = useProjectStore.getState().project.scenes[0]!.id
    useProjectStore.getState().saveClass(sceneId, createClassDraft('Heroe'))

    render(<ProjectExplorer />)

    expect(screen.getByRole('button', { name: 'principal.py' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const heroe = screen.getByRole('button', { name: 'Heroe.py' })
    expect(heroe).not.toHaveAttribute('aria-current')

    await user.click(heroe)

    expect(useEditorStore.getState().codeFile).toBe('Heroe.py')
    expect(useEditorStore.getState().codeCollapsed).toBe(false)
  })

  it('shows the scene manager', () => {
    render(<ProjectExplorer />)
    expect(screen.getByRole('button', { name: 'Nueva escena' })).toBeInTheDocument()
  })
})
