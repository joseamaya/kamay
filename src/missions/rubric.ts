import { BASE_CLASS, classCustomAttributes } from '../model'
import type { Project } from '../model'
import { customClasses } from './missions'

export type RubricStatus = 'none' | 'partial' | 'achieved'

export type RubricCriterionId =
  'objects' | 'orders' | 'classes' | 'inheritance' | 'composition' | 'events' | 'sequences'

export interface RubricEntry {
  id: RubricCriterionId
  status: RubricStatus
  /** Number of matching elements in the project, as evidence. */
  count: number
}

function statusFromCount(count: number): RubricStatus {
  if (count <= 0) return 'none'
  return count >= 2 ? 'achieved' : 'partial'
}

/** Evaluates the project against the concept rubric, from the built model. */
export function evaluateRubric(project: Project): RubricEntry[] {
  const scenes = project.scenes
  const objects = scenes.flatMap((scene) => scene.objects)
  const classes = scenes.flatMap((scene) => scene.classes)
  const events = scenes.flatMap((scene) => scene.events)
  const actions = events.flatMap((event) => event.actions)

  const ownClasses = customClasses(project)
  const classesAchieved = ownClasses.some(
    (definition) => classCustomAttributes(definition).length > 0 && definition.methods.length > 0,
  )
  const inheritanceCount = classes.filter(
    (definition) => definition.inherits != null && definition.inherits !== BASE_CLASS,
  ).length
  const eventsCount = events.filter(
    (event) =>
      event.type === 'on_collision' || event.type === 'on_key' || event.type === 'on_signal',
  ).length
  const sequencesCount = actions.filter((action) => action.method === 'esperar').length
  const compositionCount = classes.filter((definition) => definition.components.length > 0).length

  return [
    { id: 'objects', status: statusFromCount(objects.length), count: objects.length },
    { id: 'orders', status: statusFromCount(actions.length), count: actions.length },
    {
      id: 'classes',
      status: classesAchieved ? 'achieved' : statusFromCount(ownClasses.length),
      count: ownClasses.length,
    },
    {
      id: 'inheritance',
      status: inheritanceCount > 0 ? 'achieved' : 'none',
      count: inheritanceCount,
    },
    {
      id: 'composition',
      status: compositionCount > 0 ? 'achieved' : 'none',
      count: compositionCount,
    },
    { id: 'events', status: statusFromCount(eventsCount), count: eventsCount },
    { id: 'sequences', status: statusFromCount(sequencesCount), count: sequencesCount },
  ]
}
