import { BASE_CLASS } from '../model'
import type { Project } from '../model'
import {
  composesMeaningfulPart,
  customClassInstanceCount,
  customClasses,
  hasDesignedClass,
  hasDistinctInstances,
  inheritsBehavior,
} from './missions'

/** Depth of learning evidence for a concept. */
export type RubricStatus = 'introduced' | 'practiced' | 'demonstrated'

export type RubricCriterionId =
  | 'objects'
  | 'orders'
  | 'classes'
  | 'state'
  | 'inheritance'
  | 'composition'
  | 'events'
  | 'sequences'

export interface RubricEntry {
  id: RubricCriterionId
  status: RubricStatus
  /** Number of matching elements in the project, as evidence. */
  count: number
}

function evidence(count: number, demonstrated: boolean): RubricStatus {
  if (demonstrated) return 'demonstrated'
  return count > 0 ? 'practiced' : 'introduced'
}

/** Evaluates the project against the concept rubric, from the built model. */
export function evaluateRubric(project: Project): RubricEntry[] {
  const scenes = project.scenes
  const objects = scenes.flatMap((scene) => scene.objects)
  const classes = scenes.flatMap((scene) => scene.classes)
  const events = scenes.flatMap((scene) => scene.events)
  const actions = events.flatMap((event) => event.actions)

  const ownClasses = customClasses(project)
  const inheritanceCount = classes.filter(
    (definition) => definition.inherits != null && definition.inherits !== BASE_CLASS,
  ).length
  const compositionCount = classes.filter((definition) => definition.components.length > 0).length
  const eventsCount = events.filter(
    (event) =>
      event.type === 'on_collision' || event.type === 'on_key' || event.type === 'on_signal',
  ).length
  const sequencesCount = actions.filter((action) => action.method === 'esperar').length
  const stateCount = customClassInstanceCount(project)

  return [
    { id: 'objects', status: evidence(objects.length, objects.length >= 2), count: objects.length },
    { id: 'orders', status: evidence(actions.length, actions.length >= 2), count: actions.length },
    {
      id: 'classes',
      status: evidence(ownClasses.length, hasDesignedClass(project)),
      count: ownClasses.length,
    },
    { id: 'state', status: evidence(stateCount, hasDistinctInstances(project)), count: stateCount },
    {
      id: 'inheritance',
      status: evidence(inheritanceCount, inheritsBehavior(project)),
      count: inheritanceCount,
    },
    {
      id: 'composition',
      status: evidence(compositionCount, composesMeaningfulPart(project)),
      count: compositionCount,
    },
    { id: 'events', status: evidence(eventsCount, eventsCount >= 2), count: eventsCount },
    {
      id: 'sequences',
      status: evidence(sequencesCount, sequencesCount >= 2),
      count: sequencesCount,
    },
  ]
}
