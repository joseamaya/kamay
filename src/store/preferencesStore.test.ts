import { beforeEach, describe, expect, it } from 'vitest'

import { usePreferencesStore } from './preferencesStore'

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({
    theme: 'light',
    fontScale: 'normal',
    reducedMotion: false,
    projector: false,
    sidebarView: 'objects',
    inspectorOpen: true,
  })
})

describe('usePreferencesStore', () => {
  it('updates and persists the theme and font scale', () => {
    usePreferencesStore.getState().setTheme('dark')
    usePreferencesStore.getState().setFontScale('large')

    const stored = JSON.parse(localStorage.getItem('kamay.preferences')!)
    expect(stored).toEqual({
      theme: 'dark',
      fontScale: 'large',
      projector: false,
      sidebarView: 'objects',
      inspectorOpen: true,
    })
  })

  it('updates and persists the projector preference', () => {
    usePreferencesStore.getState().setProjector(true)

    expect(usePreferencesStore.getState().projector).toBe(true)
    const stored = JSON.parse(localStorage.getItem('kamay.preferences')!)
    expect(stored).toEqual({
      theme: 'light',
      fontScale: 'normal',
      projector: true,
      sidebarView: 'objects',
      inspectorOpen: true,
    })
  })

  it('updates and persists the layout preferences', () => {
    usePreferencesStore.getState().setSidebarView('project')
    usePreferencesStore.getState().setInspectorOpen(false)

    const stored = JSON.parse(localStorage.getItem('kamay.preferences')!)
    expect(stored).toEqual({
      theme: 'light',
      fontScale: 'normal',
      projector: false,
      sidebarView: 'project',
      inspectorOpen: false,
    })
  })

  it('tracks reduced motion without persisting it', () => {
    usePreferencesStore.getState().setTheme('dark')
    usePreferencesStore.getState().setReducedMotion(true)

    expect(usePreferencesStore.getState().reducedMotion).toBe(true)
    const stored = JSON.parse(localStorage.getItem('kamay.preferences')!)
    expect(stored).toEqual({
      theme: 'dark',
      fontScale: 'normal',
      projector: false,
      sidebarView: 'objects',
      inspectorOpen: true,
    })
  })
})
