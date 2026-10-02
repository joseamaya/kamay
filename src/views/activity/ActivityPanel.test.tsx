import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useEditorStore, useRuntimeStore } from '../../store'
import { ActivityPanel } from './ActivityPanel'

beforeEach(() => {
  useEditorStore.setState({ log: [] })
  useRuntimeStore.setState({ status: 'idle', error: null })
})

describe('ActivityPanel', () => {
  it('announces status changes politely', () => {
    render(<ActivityPanel />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-atomic', 'true')
  })

  it('announces errors assertively', () => {
    useRuntimeStore.setState({
      status: 'error',
      error: { kind: 'NameError', message: 'x', file: null, line: null },
    })

    render(<ActivityPanel />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive')
  })
})
