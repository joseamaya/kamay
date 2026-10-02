import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { usePreferencesStore } from './preferencesStore'
import { usePreferencesEffects } from './usePreferencesEffects'

function Harness() {
  usePreferencesEffects()
  return null
}

beforeEach(() => {
  const root = document.documentElement
  root.classList.remove('dark')
  root.style.fontSize = ''
  delete root.dataset.reducedMotion
  usePreferencesStore.setState({ theme: 'light', fontScale: 'normal', reducedMotion: false })
})

describe('usePreferencesEffects', () => {
  it('applies the theme and font scale to the document root', () => {
    render(<Harness />)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.fontSize).toBe('100%')

    act(() => {
      usePreferencesStore.getState().setTheme('dark')
      usePreferencesStore.getState().setFontScale('xlarge')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.fontSize).toBe('125%')
  })

  it('flags reduced motion on the root', () => {
    usePreferencesStore.setState({ reducedMotion: true })
    render(<Harness />)

    expect(document.documentElement.dataset.reducedMotion).toBe('true')
  })
})
