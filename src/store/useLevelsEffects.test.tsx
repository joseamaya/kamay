import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../model'
import { useEditorStore } from './editorStore'
import { useProgressStore } from './progressStore'
import { useProjectStore } from './store'
import { useLevelsEffects } from './useLevelsEffects'

function Harness() {
  useLevelsEffects()
  return null
}

beforeEach(() => {
  useProjectStore.setState({ project: createEmptyProject({ name: 'Demo' }), past: [], future: [] })
  useEditorStore.setState({ toast: null })
  useProgressStore.setState({
    completed: [],
    unlockedLevel: 1,
    freeMode: false,
    onboardingDone: true,
  })
})

describe('useLevelsEffects', () => {
  it('raises the level silently on mount', () => {
    useProgressStore.setState({ completed: ['first_object'], unlockedLevel: 1 })
    render(<Harness />)

    expect(useProgressStore.getState().unlockedLevel).toBe(2)
    expect(useEditorStore.getState().toast).toBeNull()
  })

  it('celebrates a level unlocked while playing', () => {
    render(<Harness />)

    act(() => {
      useProgressStore.setState({ completed: ['first_object'] })
    })

    expect(useProgressStore.getState().unlockedLevel).toBe(2)
    expect(useEditorStore.getState().toast).toEqual({ kind: 'level', level: 2 })
  })
})
