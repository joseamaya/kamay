import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CodeEditor from './CodeEditor'

function content(container: HTMLElement): string {
  return container.querySelector('.cm-content')?.textContent ?? ''
}

function contentEditable(container: HTMLElement): string | null {
  return container.querySelector('.cm-content')?.getAttribute('contenteditable') ?? null
}

describe('CodeEditor', () => {
  it('renders the value', () => {
    const { container } = render(<CodeEditor value={'print("hola")'} />)

    expect(container.querySelector('.cm-editor')).not.toBeNull()
    expect(content(container)).toContain('print("hola")')
  })

  it('is editable by default and read-only when asked', () => {
    const { container, rerender } = render(<CodeEditor value="x = 1" />)
    expect(contentEditable(container)).toBe('true')

    rerender(<CodeEditor value="x = 1" readOnly />)
    expect(contentEditable(container)).toBe('false')
  })

  it('syncs the document when the value prop changes', () => {
    const { container, rerender } = render(<CodeEditor value="a = 1" />)
    expect(content(container)).toContain('a = 1')

    rerender(<CodeEditor value="b = 2" />)
    expect(content(container)).toContain('b = 2')
    expect(content(container)).not.toContain('a = 1')
  })

  it('highlights the requested lines', () => {
    const { container, rerender } = render(
      <CodeEditor value={'a = 1\nb = 2\nc = 3'} highlightLines={{ from: 2, to: 2 }} />,
    )

    const lines = () => container.querySelectorAll('.cm-line')
    expect(lines()[1]?.classList.contains('cm-kamay-highlight')).toBe(true)
    expect(lines()[0]?.classList.contains('cm-kamay-highlight')).toBe(false)

    rerender(<CodeEditor value={'a = 1\nb = 2\nc = 3'} highlightLines={null} />)
    expect(container.querySelector('.cm-kamay-highlight')).toBeNull()
  })
})
