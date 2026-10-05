import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createClassDraft, createScene, instantiateClass } from '../../model'
import type { ClassDefinition } from '../../model'
import { ObjectConcept } from './ObjectConcept'

function klass(name: string, inherits: string, methods: string[] = []): ClassDefinition {
  return {
    ...createClassDraft(name),
    inherits,
    methods: methods.map((method) => ({
      name: method,
      parameters: [],
      body: { kind: 'blocks', ops: [] },
    })),
  }
}

describe('ObjectConcept', () => {
  it('shows behavior with its origin, the inheritance chain and the parts', () => {
    const animal = klass('Animal', 'Actor', ['comer'])
    const collar = klass('Collar', 'Actor', ['ajustar'])
    const perro: ClassDefinition = {
      ...klass('Perro', 'Animal', ['ladrar']),
      components: [{ name: 'collar', class: 'Collar' }],
    }
    let scene = { ...createScene('Principal'), classes: [animal, collar, perro] }
    scene = instantiateClass(scene, perro.id)
    const object = scene.objects[0]!

    render(<ObjectConcept scene={scene} object={object} />)

    expect(screen.getByText('Comportamiento')).toBeInTheDocument()
    expect(screen.getByText('ladrar()')).toBeInTheDocument()
    expect(screen.getByText('comer()')).toBeInTheDocument()
    expect(screen.getByText('Propio')).toBeInTheDocument()
    expect(screen.getByText('Heredado de Animal')).toBeInTheDocument()

    expect(screen.getByText('Herencia')).toBeInTheDocument()
    expect(screen.getByText('Perro → Animal → Actor')).toBeInTheDocument()

    expect(screen.getByText('Composición')).toBeInTheDocument()
    expect(screen.getByText('collar')).toBeInTheDocument()
    expect(screen.getByText('Collar')).toBeInTheDocument()
  })

  it('stays empty for a plain catalog object', () => {
    const circle = klass('Circle', 'Actor')
    let scene = { ...createScene('Principal'), classes: [circle] }
    scene = instantiateClass(scene, circle.id)

    const { container } = render(<ObjectConcept scene={scene} object={scene.objects[0]!} />)

    expect(container.querySelectorAll('section')).toHaveLength(0)
  })
})
