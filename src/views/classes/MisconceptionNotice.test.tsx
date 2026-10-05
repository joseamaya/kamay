import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createClassDraft, createScene, upsertClass } from '../../model'
import { useEvidenceStore } from '../../store'
import { MisconceptionNotice } from './MisconceptionNotice'

beforeEach(() => {
  useEvidenceStore.getState().reset()
})

describe('MisconceptionNotice', () => {
  it('explains inheritance used only to reuse and records it', () => {
    const animal = createClassDraft('Animal')
    animal.methods.push({ name: 'comer', parameters: [], body: { kind: 'blocks', ops: [] } })
    const perro = createClassDraft('Perro')
    perro.inherits = 'Animal'
    let scene = upsertClass(createScene('Principal'), animal)
    scene = upsertClass(scene, perro)

    render(<MisconceptionNotice scene={scene} definition={perro} />)

    expect(screen.getByText(/La herencia expresa una relación/)).toBeInTheDocument()
    expect(useEvidenceStore.getState().misconceptions).toContain('inheritance_for_reuse')
  })

  it('renders nothing when there is no misconception', () => {
    const perro = createClassDraft('Perro')
    const { container } = render(
      <MisconceptionNotice scene={createScene('Principal')} definition={perro} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
