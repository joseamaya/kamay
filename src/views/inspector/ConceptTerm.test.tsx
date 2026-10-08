import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ConceptTerm } from './ConceptTerm'

describe('ConceptTerm', () => {
  it('shows the concept term and explains it in a tooltip', () => {
    render(<ConceptTerm id="state" />)

    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(
      screen.getByText('El valor que tienen los atributos en un momento dado.'),
    ).toBeInTheDocument()
  })

  it('allows overriding the displayed term', () => {
    render(<ConceptTerm id="class" label="Clases" />)

    expect(screen.getByText('Clases')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'El molde que describe cómo serán sus objetos.' }),
    ).toBeInTheDocument()
  })
})
