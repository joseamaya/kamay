import { format, getMessages } from '../../i18n'
import {
  classAncestry,
  classCustomAttributes,
  resolveComponentsWithOrigin,
  resolveMethodsWithOrigin,
} from '../../model'
import type { ObjectInstance, Scene } from '../../model'
import { ConceptTerm } from './ConceptTerm'
import { groupByOwner } from './groupByOwner'

export interface ObjectConceptProps {
  scene: Scene
  object: ObjectInstance
}

export function ObjectConcept({ scene, object }: ObjectConceptProps) {
  const messages = getMessages()
  const ancestry = classAncestry(scene, object.class)
  const methodGroups = groupByOwner(resolveMethodsWithOrigin(scene, object.class), object.class)
  const components = resolveComponentsWithOrigin(scene, object.class)

  const partMembers = (className: string): string[] => {
    const definition = scene.classes.find((candidate) => candidate.name === className)
    if (!definition) return []
    return [
      ...definition.methods.map((method) => `${method.name}()`),
      ...classCustomAttributes(definition).map((attribute) => attribute.name),
    ]
  }

  return (
    <div className="flex flex-col gap-3">
      {methodGroups.length > 0 ? (
        <section className="flex flex-col">
          <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            <ConceptTerm id="method" />
          </h3>
          {methodGroups.map((group) => (
            <div key={group.owner} className="flex flex-col">
              {group.own ? null : (
                <h4 className="text-muted-foreground text-xs">
                  {format(messages.inspector.inheritedFrom, { name: group.owner })}
                </h4>
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((method) => (
                  <li key={method.name} className="text-xs">
                    <code className="font-mono">{method.name}()</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {ancestry.length > 1 ? (
        <section className="flex flex-col">
          <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            <ConceptTerm id="inheritance" />
          </h3>
          <p className="text-xs">{ancestry.join(' → ')}</p>
        </section>
      ) : null}

      {components.length > 0 ? (
        <section className="flex flex-col">
          <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            <ConceptTerm id="composition" />
          </h3>
          <ul className="flex flex-col gap-0.5">
            {components.map((entry) => {
              const members = partMembers(entry.value.class)
              return (
                <li
                  key={entry.value.name}
                  className="flex items-baseline justify-between gap-2 text-xs"
                >
                  <span>{entry.value.name}</span>
                  <span className="text-muted-foreground">
                    {entry.value.class}
                    {members.length > 0 ? ` · ${members.join(', ')}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
