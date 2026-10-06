import { createId } from '../model'
import { openKamayDb } from './db'
import type { Delivery } from './delivery'
import type { DeliveryRecord } from './types'

/** Stored student deliveries, newest first. */
export async function listDeliveries(): Promise<DeliveryRecord[]> {
  const db = await openKamayDb()
  const records = await db.getAll('deliveries')
  return records.sort((a, b) => b.delivery.exportedAt.localeCompare(a.delivery.exportedAt))
}

/** Persists imported deliveries and returns the stored records (with new ids). */
export async function saveDeliveries(deliveries: Delivery[]): Promise<DeliveryRecord[]> {
  const db = await openKamayDb()
  const records = deliveries.map((delivery) => ({ id: createId('delivery'), delivery }))
  const tx = db.transaction('deliveries', 'readwrite')
  await Promise.all(records.map((record) => tx.store.put(record)))
  await tx.done
  return records
}

export async function deleteDelivery(id: string): Promise<void> {
  const db = await openKamayDb()
  await db.delete('deliveries', id)
}

export async function clearDeliveries(): Promise<void> {
  const db = await openKamayDb()
  await db.clear('deliveries')
}
