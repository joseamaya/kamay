import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createScene } from '../../model'
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
})
