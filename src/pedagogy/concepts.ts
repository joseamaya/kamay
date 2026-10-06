import type { MissionId } from '../missions'

export type ConceptId =
  | 'object'
  | 'class'
  | 'instance'
  | 'attribute'
  | 'state'
  | 'method'
  | 'method_call'
  | 'parameter'
  | 'event'
  | 'inheritance'
  | 'composition'
  | 'polymorphism'

export type MisconceptionId =
  'class_is_object' | 'shared_state' | 'inheritance_vs_composition' | 'inheritance_for_reuse'

export interface ConceptDefinition {
  id: ConceptId
  prerequisites: ConceptId[]
  /** Level at which the concept becomes available in the guided path. */
  level: number
  misconceptions: MisconceptionId[]
}

export const CONCEPTS: ConceptDefinition[] = [
  { id: 'object', prerequisites: [], level: 1, misconceptions: [] },
  { id: 'method_call', prerequisites: ['object'], level: 2, misconceptions: [] },
  { id: 'parameter', prerequisites: ['method_call'], level: 2, misconceptions: [] },
  { id: 'event', prerequisites: ['method_call'], level: 2, misconceptions: [] },
  { id: 'class', prerequisites: ['object'], level: 3, misconceptions: ['class_is_object'] },
  {
    id: 'instance',
    prerequisites: ['class', 'object'],
    level: 3,
    misconceptions: ['class_is_object'],
  },
  { id: 'attribute', prerequisites: ['class'], level: 3, misconceptions: [] },
  {
    id: 'state',
    prerequisites: ['attribute', 'instance'],
    level: 3,
    misconceptions: ['shared_state'],
  },
  { id: 'method', prerequisites: ['class'], level: 3, misconceptions: [] },
  {
    id: 'inheritance',
    prerequisites: ['class', 'method'],
    level: 5,
    misconceptions: ['inheritance_vs_composition', 'inheritance_for_reuse'],
  },
  {
    id: 'composition',
    prerequisites: ['class', 'instance'],
    level: 6,
    misconceptions: ['inheritance_vs_composition'],
  },
  {
    id: 'polymorphism',
    prerequisites: ['inheritance', 'method_call'],
    level: 5,
    misconceptions: [],
  },
]

const CONCEPT_BY_ID = new Map<ConceptId, ConceptDefinition>(
  CONCEPTS.map((concept) => [concept.id, concept]),
)

const MISSION_CONCEPT: Partial<Record<MissionId, ConceptId>> = {
  first_object: 'object',
  give_order: 'method_call',
  say_hello: 'method_call',
  move_it: 'parameter',
  collision: 'event',
  own_class: 'class',
  own_attribute: 'attribute',
  own_method: 'method',
  inherit: 'inheritance',
  inherited_behavior: 'inheritance',
  polymorphism: 'polymorphism',
  same_message: 'polymorphism',
  compose: 'composition',
  composed_part: 'composition',
  two_instances: 'state',
}

export function findConcept(id: ConceptId): ConceptDefinition | undefined {
  return CONCEPT_BY_ID.get(id)
}

/** Main concept a mission practices, or `null` when it maps to none. */
export function conceptForMission(id: MissionId): ConceptId | null {
  return MISSION_CONCEPT[id] ?? null
}

/** Concepts introduced up to (and including) the given level. */
export function conceptsForLevel(level: number): ConceptDefinition[] {
  return CONCEPTS.filter((concept) => concept.level <= level)
}
