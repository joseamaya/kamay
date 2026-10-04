import { getMessages } from '../../i18n'
import {
  readNumber,
  readString,
  resolveAttributeDefaults,
  resolveCustomAttributes,
} from '../../model'
import type { ObjectInstance, Scene } from '../../model'
import { useProjectStore } from '../../store'
import { ColorInput } from '../../ui/ColorInput'
import { NumberField } from '../../ui/NumberField'
import { Select } from '../../ui/Select'
import { Slider } from '../../ui/Slider'
import { TextField } from '../../ui/TextField'

export interface ObjectAttributesProps {
  scene: Scene
  object: ObjectInstance
}

export function ObjectAttributes({ scene, object }: ObjectAttributesProps) {
  const messages = getMessages()
  const updateObjectAttributes = useProjectStore((state) => state.updateObjectAttributes)

  const patch = (values: Record<string, number | string | boolean>) =>
    updateObjectAttributes(scene.id, object.id, values)

  const customAttributes = resolveCustomAttributes(scene, object.class)
  const defaults = resolveAttributeDefaults(scene, object.class)

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={messages.inspector.positionX}
          value={readNumber(object.attributes, 'x', 0)}
          onChange={(value) => patch({ x: value })}
        />
        <NumberField
          label={messages.inspector.positionY}
          value={readNumber(object.attributes, 'y', 0)}
          onChange={(value) => patch({ y: value })}
        />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Slider
          label={messages.inspector.rotation}
          value={readNumber(object.attributes, 'rotation', 0)}
          min={-180}
          max={180}
          onChange={(value) => patch({ rotation: value })}
        />
        <Slider
          label={messages.inspector.scale}
          value={readNumber(object.attributes, 'scale', 1)}
          min={0.2}
          max={3}
          step={0.1}
          onChange={(value) => patch({ scale: value })}
        />
        <ColorInput
          label={messages.inspector.color}
          value={readString(object.attributes, 'color', '#e2603a')}
          onChange={(value) => patch({ color: value })}
        />
      </div>

      {customAttributes.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {messages.inspector.customAttributes}
          </h3>
          {customAttributes.map((attribute) => {
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
      ) : null}
    </>
  )
}
