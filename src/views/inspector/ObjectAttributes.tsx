import { format, getMessages } from '../../i18n'
import { resolveAttributeDefaults, resolveCustomAttributesWithOrigin } from '../../model'
import type { ObjectInstance, Scene } from '../../model'
import { askPredictionForAttribute, useProjectStore } from '../../store'
import { NumberField } from '../../ui/NumberField'
import { Select } from '../../ui/Select'
import { TextField } from '../../ui/TextField'
import { groupByOwner } from './groupByOwner'

export interface ObjectAttributesProps {
  scene: Scene
  object: ObjectInstance
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
      {children}
    </h3>
  )
}

export function ObjectAttributes({ scene, object }: ObjectAttributesProps) {
  const messages = getMessages()
  const updateObjectAttributes = useProjectStore((state) => state.updateObjectAttributes)

  const patch = (values: Record<string, number | string | boolean>) => {
    updateObjectAttributes(scene.id, object.id, values)
    const entries = Object.entries(values)
    if (entries.length !== 1) return
    const [name, value] = entries[0]!
    askPredictionForAttribute(scene, object, name, value)
  }

  const groups = groupByOwner(resolveCustomAttributesWithOrigin(scene, object.class), object.class)
  const defaults = resolveAttributeDefaults(scene, object.class)

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionTitle>{messages.selection.state}</SectionTitle>
          {groups.map((group) => (
            <div key={group.owner} className="flex flex-col gap-2">
              {group.own ? null : (
                <h4 className="text-muted-foreground text-xs">
                  {format(messages.inspector.inheritedFrom, { name: group.owner })}
                </h4>
              )}
              {group.items.map((attribute) => {
                const fallback = defaults[attribute.name] ?? 0
                const value = object.attributes[attribute.name] ?? fallback
                const resetLabel = `${messages.inspector.resetToClass}: ${attribute.name}`

                return (
                  <div key={attribute.name} className="flex items-end gap-2">
                    <div className="flex-1">
                      {attribute.type === 'number' ? (
                        <NumberField
                          label={attribute.name}
                          value={typeof value === 'number' ? value : 0}
                          onChange={(next) => patch({ [attribute.name]: next })}
                        />
                      ) : attribute.type === 'boolean' ? (
                        <Select
                          label={attribute.name}
                          value={String(value)}
                          options={[
                            { value: 'true', label: messages.booleans.true },
                            { value: 'false', label: messages.booleans.false },
                          ]}
                          onChange={(next) => patch({ [attribute.name]: next === 'true' })}
                        />
                      ) : (
                        <TextField
                          label={attribute.name}
                          value={typeof value === 'string' ? value : ''}
                          onChange={(next) => patch({ [attribute.name]: next })}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={resetLabel}
                      disabled={value === fallback}
                      onClick={() => patch({ [attribute.name]: fallback })}
                      className="border-border hover:bg-muted disabled:text-muted-foreground/40 h-8 rounded-md border px-2 text-base leading-none"
                    >
                      ↺
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}
