import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { clearAnalytics, saveAnalytics } from '../persistence'
import { useAnalyticsStore } from './analyticsStore'

beforeEach(async () => {
  await clearAnalytics()
  useAnalyticsStore.setState({ events: [], hydrated: false })
})

describe('analyticsStore', () => {
  it('records events in memory with a timestamp', () => {
    useAnalyticsStore.getState().record({ type: 'mission', concept: 'class', detail: 'own_class' })

    const events = useAnalyticsStore.getState().events
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: 'mission', concept: 'class', detail: 'own_class' })
    expect(typeof events[0]?.at).toBe('string')
  })

  it('hydrates from storage once', async () => {
    await saveAnalytics([{ type: 'error', at: '2026-01-01T00:00:00Z', detail: 'NameError' }])
    useAnalyticsStore.setState({ events: [], hydrated: false })

    await useAnalyticsStore.getState().hydrate()

    expect(useAnalyticsStore.getState().events).toHaveLength(1)
    expect(useAnalyticsStore.getState().hydrated).toBe(true)
  })
})
