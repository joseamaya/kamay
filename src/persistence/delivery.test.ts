import { describe, expect, it } from 'vitest'

import { ACTOR_CATALOG, addCatalogObject, createEmptyProject, createScene } from '../model'
import { buildDelivery, deliveryFileName, exportDelivery } from './delivery'

describe('buildDelivery', () => {
  it('bundles the project, the generated python and the missions', () => {
    const project = {
      ...createEmptyProject({ name: 'Mi juego' }),
      scenes: [addCatalogObject(createScene('Principal'), ACTOR_CATALOG[0]!)],
    }

    const delivery = buildDelivery(project, ['first_object'], 11, new Date('2026-10-02T00:00:00Z'))

    expect(delivery.app).toBe('kamay')
    expect(delivery.kind).toBe('entrega')
    expect(delivery.project).toEqual(project)
    expect(delivery.python['principal.py']).toContain('circle1 = Circle("circle1")')
    expect(delivery.missions).toEqual({ completed: ['first_object'], total: 11 })
    expect(delivery.rubric).toHaveLength(9)
    expect(delivery.rubric.find((entry) => entry.id === 'objects')?.status).toBe('practiced')
  })

  it('exports a json blob', async () => {
    const text = await exportDelivery(
      buildDelivery(createEmptyProject({ name: 'X' }), [], 11),
    ).text()
    expect(JSON.parse(text).kind).toBe('entrega')
  })
})

describe('deliveryFileName', () => {
  it('includes the slug and the date', () => {
    const project = createEmptyProject({ name: 'Canción del Sur' })
    expect(deliveryFileName(project, new Date('2026-10-02T00:00:00Z'))).toBe(
      'cancion-del-sur-entrega-2026-10-02.json',
    )
  })
})
