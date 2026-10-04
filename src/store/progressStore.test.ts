import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProgressStore } from './progressStore'

describe('useProgressStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState({
      completed: [],
      freeMode: false,
      unlockedLevel: 1,
      onboardingDone: false,
    })
  })

  it('completes missions and persists progress', () => {
    useProgressStore.getState().complete('first_object')

    expect(useProgressStore.getState().completed).toEqual(['first_object'])
    expect(JSON.parse(localStorage.getItem('kamay.progress')!)).toEqual({
      completed: ['first_object'],
      freeMode: false,
      unlockedLevel: 1,
      onboardingDone: false,
    })
  })

  it('marks onboarding as done and persists it', () => {
    useProgressStore.getState().completeOnboarding()

    expect(useProgressStore.getState().onboardingDone).toBe(true)
    expect(JSON.parse(localStorage.getItem('kamay.progress')!).onboardingDone).toBe(true)
  })

  it('stores the free mode and unlocked level', () => {
    useProgressStore.getState().setFreeMode(true)
    useProgressStore.getState().setUnlockedLevel(4)

    const stored = JSON.parse(localStorage.getItem('kamay.progress')!)
    expect(stored.freeMode).toBe(true)
    expect(stored.unlockedLevel).toBe(4)
  })

  it('resets progress but keeps free mode', () => {
    useProgressStore.setState({ completed: ['first_object'], freeMode: true, unlockedLevel: 3 })

    useProgressStore.getState().reset()

    expect(useProgressStore.getState()).toMatchObject({
      completed: [],
      unlockedLevel: 1,
      freeMode: true,
    })
  })

  it('reads a legacy array-shaped progress', async () => {
    localStorage.setItem('kamay.progress', JSON.stringify(['first_object']))
    vi.resetModules()

    const { useProgressStore: fresh } = await import('./progressStore')

    expect(fresh.getState().completed).toEqual(['first_object'])
    expect(fresh.getState().freeMode).toBe(false)
    expect(fresh.getState().unlockedLevel).toBe(1)
  })
})
