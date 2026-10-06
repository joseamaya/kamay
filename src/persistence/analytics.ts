import type { AnalyticsEvent } from '../pedagogy'
import { openKamayDb } from './db'

const RECORD_ID = 'current'

/** Loads the durable activity log. Falls back to empty when storage is unavailable. */
export async function loadAnalytics(): Promise<AnalyticsEvent[]> {
  try {
    const db = await openKamayDb()
    const record = await db.get('analytics', RECORD_ID)
    return record?.events ?? []
  } catch {
    return []
  }
}

/** Persists the durable activity log. Ignored when storage is unavailable. */
export async function saveAnalytics(events: AnalyticsEvent[]): Promise<void> {
  try {
    const db = await openKamayDb()
    await db.put('analytics', { id: RECORD_ID, events })
  } catch {
    // Storage can be unavailable (private mode, tests); the log stays in memory.
  }
}

export async function clearAnalytics(): Promise<void> {
  try {
    const db = await openKamayDb()
    await db.delete('analytics', RECORD_ID)
  } catch {
    // Storage can be unavailable; nothing to clear.
  }
}
