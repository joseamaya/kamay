import { format, getMessages } from '../../i18n'
import { classAncestry, resolveComponentsWithOrigin, resolveMethodsWithOrigin } from '../../model'
import type { ObjectInstance, Scene } from '../../model'

export interface ObjectConceptProps {
  scene: Scene
  object: ObjectInstance
}

export function ObjectConcept({ scene, object }: ObjectConceptProps) {
  const messages = getMessages()
  const ancestry = classAncestry(scene, object.class)
  const methods = resolveMethodsWithOrigin(scene, object.class)
  const components = resolveComponentsWithOrigin(scene, object.class)

  const originLabel = (owner: string) =>
    owner === object.class
      ? messages.inspector.own
      : format(messages.inspector.inheritedFrom, { name: owner })

  return (
    <div className="flex flex-col gap-3">
      {methods.length > 0 ? (
        <section className="flex flex-col">
          <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            {messages.inspector.behavior}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {methods.map((entry) => (
              <li
                key={entry.value.name}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <code className="font-mono">{entry.value.name}()</code>
                <span className="text-muted-foreground">{originLabel(entry.owner)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {ancestry.length > 2 ? (
        <section className="flex flex-col">
          <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            {messages.inspector.inheritance}
          </h3>
          <p className="text-xs">{ancestry.join(' → ')}</p>
        </section>
      ) : null}

      {components.length > 0 ? (
        <section className="flex flex-col">
          <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            {messages.inspector.composition}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {components.map((entry) => (
              <li
                key={entry.value.name}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <span>{entry.value.name}</span>
                <span className="text-muted-foreground">{entry.value.class}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
