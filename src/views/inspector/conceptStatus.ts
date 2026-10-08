import { useMemo } from 'react'

import type { Project } from '../../model'
import { evaluateRubric } from '../../missions'
import type { RubricCriterionId, RubricStatus } from '../../missions'
import type { ConceptId } from '../../pedagogy'
import { useProjectStore } from '../../store'

/** Concepts that map to a rubric criterion; the rest have no progress badge. */
const CONCEPT_CRITERION: Partial<Record<ConceptId, RubricCriterionId>> = {
  object: 'objects',
  method_call: 'orders',
  class: 'classes',
  state: 'state',
  inheritance: 'inheritance',
  polymorphism: 'polymorphism',
  composition: 'composition',
}

export function conceptStatus(project: Project, concept: ConceptId): RubricStatus | null {
  const criterion = CONCEPT_CRITERION[concept]
  if (!criterion) return null
  return evaluateRubric(project).find((entry) => entry.id === criterion)?.status ?? null
}

/** Rubric status for a concept, or null when it has no criterion. */
export function useConceptStatus(concept: ConceptId): RubricStatus | null {
  const project = useProjectStore((state) => state.project)
  return useMemo(() => conceptStatus(project, concept), [project, concept])
}
