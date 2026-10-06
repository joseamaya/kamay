import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createScene } from '../../model'
import type { ClassDefinition } from '../../model'
import { useProgressStore } from '../../store'
import { ClassEditorDialog } from './ClassEditorDialog'

function renderDialog() {
  return render(
    <ClassEditorDialog
      scene={createScene('Principal')}
      initial={null}
      onSave={() => {}}
      onClose={() => {}}
    />,
  )
}

beforeEach(() => {
  useProgressStore.setState({ freeMode: false, unlockedLevel: 3 })
})

describe('ClassEditorDialog', () => {
  it('shows where inheritance and composition unlock', () => {
    renderDialog()

    expect(screen.getByText('Hereda de')).toBeInTheDocument()
    expect(screen.getByText('Se desbloquea en el Nivel 5.')).toBeInTheDocument()
    expect(screen.getByText('Componentes')).toBeInTheDocument()
    expect(screen.getByText('Se desbloquea en el Nivel 6.')).toBeInTheDocument()
  })

  it('offers the base class select once inheritance is unlocked', () => {
    useProgressStore.setState({ freeMode: true })
    renderDialog()

    expect(screen.getByLabelText('Hereda de')).toBeInTheDocument()
    expect(screen.queryByText('Se desbloquea en el Nivel 5.')).not.toBeInTheDocument()
  })

  it('offers a no-base option and hides Actor', () => {
    useProgressStore.setState({ freeMode: true })
    renderDialog()

    const select = screen.getByLabelText('Hereda de') as HTMLSelectElement
    expect(select.value).toBe('')
    expect(screen.getByRole('option', { name: 'Sin base' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Actor' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Vehiculo' })).toBeInTheDocument()
  })

  it('adds a visual variant for a custom attribute', async () => {
    const user = userEvent.setup()
    const draft = createClassDraft('Vehiculo')
    const initial: ClassDefinition = {
      ...draft,
      attributes: [...draft.attributes, { name: 'encendido', type: 'boolean', initial: false }],
    }

    render(
      <ClassEditorDialog
        scene={createScene('Principal')}
        initial={initial}
        onSave={() => {}}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Apariencia')).toBeInTheDocument()
    expect(screen.getByText('Sin variantes.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Agregar variante' }))

    expect(screen.getByLabelText('Nombre de la variante')).toBeInTheDocument()
  })
})
