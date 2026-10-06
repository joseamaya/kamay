import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../model'
import { buildDelivery } from './delivery'
import { clearDeliveries, deleteDelivery, listDeliveries, saveDeliveries } from './deliveries'

function delivery(name: string, at: string) {
  return buildDelivery(createEmptyProject({ name }), ['first_object'], 16, new Date(at))
}

beforeEach(async () => {
  await clearDeliveries()
})

describe('deliveries repository', () => {
  it('saves, lists newest first and deletes by id', async () => {
    await saveDeliveries([delivery('A', '2026-01-01T00:00:00Z')])
    const saved = await saveDeliveries([delivery('B', '2026-02-01T00:00:00Z')])
    expect(saved).toHaveLength(1)
    expect(saved[0]?.id).toBeTruthy()

    const list = await listDeliveries()
    expect(list.map((record) => record.delivery.project.meta.name)).toEqual(['B', 'A'])

    await deleteDelivery(saved[0]!.id)
    expect(await listDeliveries()).toHaveLength(1)
  })
})
