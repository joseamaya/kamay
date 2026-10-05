import { describe, expect, it } from 'vitest'

import { MISSIONS } from '../missions'
import { CONCEPTS, conceptForMission, conceptsForLevel, findConcept } from './concepts'

describe('concepts', () => {
  it('has unique ids and valid prerequisites', () => {
    const ids = CONCEPTS.map((concept) => concept.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const concept of CONCEPTS) {
      for (const prerequisite of concept.prerequisites) {
        expect(findConcept(prerequisite)).toBeDefined()
      }
    }
  })

  it('maps every mission to a concept', () => {
    for (const mission of MISSIONS) {
      expect(conceptForMission(mission.id)).not.toBeNull()
    }
  })

  it('never requires a prerequisite from a later level', () => {
    for (const concept of CONCEPTS) {
      for (const prerequisite of concept.prerequisites) {
        expect(findConcept(prerequisite)!.level).toBeLessThanOrEqual(concept.level)
      }
    }
  })

  it('filters concepts by level', () => {
    expect(conceptsForLevel(1).map((concept) => concept.id)).toEqual(['object'])
    expect(conceptsForLevel(3).map((concept) => concept.id)).toContain('state')
    expect(conceptsForLevel(6).map((concept) => concept.id)).toContain('polymorphism')
  })
})
