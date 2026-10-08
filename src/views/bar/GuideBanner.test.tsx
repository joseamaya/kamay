import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { getMessages } from '../../i18n'
import { ACTOR_CATALOG, addCatalogObject, createEmptyProject, createScene } from '../../model'
import { useEditorStore, useProgressStore, useProjectStore } from '../../store'
import { GuideBanner } from './GuideBanner'

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ selectedObjectId: null, revealedHints: {} })
})

describe('GuideBanner', () => {
  it('shows the level and the next mission', () => {
    render(<GuideBanner />)

    expect(screen.getByText('Nivel 1')).toBeInTheDocument()
    expect(screen.getByText('Siguiente misión: Pon algo en el escenario')).toBeInTheDocument()
  })

  it('suggests a reachable mission instead of a locked one', () => {
    useProgressStore.setState({
      freeMode: false,
      unlockedLevel: 4,
      completed: [
        'first_object',
        'give_order',
        'say_hello',
        'move_it',
        'own_class',
        'own_attribute',
        'own_method',
        'two_instances',
      ],
    })

    render(<GuideBanner />)

    expect(screen.getByText('Nivel 4')).toBeInTheDocument()
    expect(screen.getByText('Siguiente misión: Escribe tu método')).toBeInTheDocument()
    expect(screen.queryByText(/Hereda/)).not.toBeInTheDocument()
  })

  it('points to the factory when the next mission is creating a class', () => {
    useProgressStore.setState({
      freeMode: false,
      unlockedLevel: 3,
      completed: ['first_object', 'give_order', 'say_hello', 'move_it'],
    })

    render(<GuideBanner />)

    expect(
      screen.getByText('Crea tu clase desde el panel «Objetos», sección «Clases».'),
    ).toBeInTheDocument()
  })

  it('reveals the next mission hints progressively', async () => {
    const user = userEvent.setup()
    useProgressStore.setState({ freeMode: false, unlockedLevel: 1, completed: [] })

    render(<GuideBanner />)

    const firstHint = getMessages().missions.list.first_object.hints[0]
    expect(screen.queryByText(firstHint)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pista' }))

    expect(screen.getByText(firstHint)).toBeInTheDocument()
  })

  it('tailors the selected hint to the available capabilities', () => {
    const circle = ACTOR_CATALOG.find((item) => item.id === 'carro')!
    const scene = addCatalogObject(createScene('Principal'), circle)
    useProjectStore.setState({
      project: { ...createEmptyProject({ name: 'Demo' }), scenes: [scene] },
      past: [],
      future: [],
    })
    useProgressStore.setState({ freeMode: false, unlockedLevel: 1, completed: [] })
    useEditorStore.setState({ selectedObjectId: scene.objects[0]!.id })

    render(<GuideBanner />)

    expect(
      screen.getByText('Usa el panel de la derecha para cambiar sus propiedades.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/llamar a sus métodos/)).not.toBeInTheDocument()
  })
})
