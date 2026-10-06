import { describe, expect, it } from 'vitest'

import { ACTOR_CATALOG, addCatalogObject, createEmptyProject, createScene } from '../model'
import { buildDelivery, deliveryFileName, exportDelivery, parseDelivery } from './delivery'

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
    expect(delivery.python['principal.py']).toContain('carro1 = Carro("carro1")')
    expect(delivery.missions).toEqual({ completed: ['first_object'], total: 11 })
    expect(delivery.rubric).toHaveLength(8)
    expect(delivery.rubric.find((entry) => entry.id === 'objects')?.status).toBe('practiced')
    expect(delivery.evidence).toEqual({
      version: 1,
      misconceptions: [],
      predictions: {},
      missionDates: {},
    })
  })

  it('includes the learning evidence when provided', () => {
    const delivery = buildDelivery(createEmptyProject({ name: 'X' }), [], 16, new Date(), {
      version: 1,
      misconceptions: ['shared_state'],
      predictions: { state: { correct: 1, misconception: 0, explained: 0 } },
      missionDates: { first_object: '2026-01-01T00:00:00Z' },
    })

    expect(delivery.evidence.misconceptions).toEqual(['shared_state'])
    expect(delivery.evidence.predictions.state?.correct).toBe(1)
  })

  it('includes the analytics summary when provided', () => {
    const delivery = buildDelivery(
      createEmptyProject({ name: 'X' }),
      [],
      16,
      new Date(),
      undefined,
      {
        errorsByType: [{ kind: 'NameError', count: 2 }],
        concepts: [
          {
            concept: 'class',
            first: '2026-01-01T10:00:00Z',
            last: '2026-01-01T10:20:00Z',
            durationMs: 1200000,
            events: 2,
          },
        ],
        predictions: 3,
      },
    )

    expect(delivery.analytics.errorsByType).toEqual([{ kind: 'NameError', count: 2 }])

    const parsed = parseDelivery(JSON.parse(JSON.stringify(delivery)))
    expect(parsed?.analytics.errorsByType).toEqual([{ kind: 'NameError', count: 2 }])
    expect(parsed?.analytics.predictions).toBe(3)
    expect(parsed?.analytics.concepts[0]?.concept).toBe('class')
  })

  it('exports a json blob', async () => {
    const text = await exportDelivery(
      buildDelivery(createEmptyProject({ name: 'X' }), [], 11),
    ).text()
    expect(JSON.parse(text).kind).toBe('entrega')
  })
})

describe('parseDelivery', () => {
  it('round-trips a valid delivery', () => {
    const delivery = buildDelivery(createEmptyProject({ name: 'Demo' }), ['first_object'], 16)

    const parsed = parseDelivery(JSON.parse(JSON.stringify(delivery)))

    expect(parsed?.project.meta.name).toBe('Demo')
    expect(parsed?.missions.completed).toEqual(['first_object'])
    expect(parsed?.evidence.version).toBe(1)
  })

  it('rejects invalid input', () => {
    expect(parseDelivery(null)).toBeNull()
    expect(parseDelivery({ app: 'other' })).toBeNull()
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
