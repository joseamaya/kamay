import { getMessages } from '../../i18n'
import {
  ACTOR_SHAPES,
  availableBlockAttributes,
  isEngineAttribute,
  newVisualVariant,
} from '../../model'
import type { Attribute, AttributeValue, ClassDefinition, Scene, VisualVariant } from '../../model'
import { Button } from '../../ui/Button'
import { ColorInput } from '../../ui/ColorInput'

const INPUT_CLASS =
  'border-border bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none'

export interface VisualVariantsEditorProps {
  scene: Scene
  definition: ClassDefinition
  variants: VisualVariant[]
  onChange: (variants: VisualVariant[]) => void
}

function defaultValueFor(attribute: Attribute | undefined): AttributeValue {
  return attribute?.initial ?? ''
}

export function VisualVariantsEditor({
  scene,
  definition,
  variants,
  onChange,
}: VisualVariantsEditorProps) {
  const messages = getMessages()
  const attributes = availableBlockAttributes(scene, definition).filter(
    (attribute) => !isEngineAttribute(attribute.name),
  )
  const shapeOptions = [
    { value: '', label: messages.classEditor.variantNoShape },
    ...ACTOR_SHAPES.map((shape) => ({ value: shape, label: messages.shapes[shape] })),
  ]

  const update = (index: number, patch: Partial<VisualVariant>) => {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)))
  }

  const updateCondition = (index: number, attributeName: string) => {
    const attribute = attributes.find((candidate) => candidate.name === attributeName)
    update(index, { when: [{ attribute: attributeName, value: defaultValueFor(attribute) }] })
  }

  const updateValue = (index: number, value: AttributeValue) => {
    const condition = variants[index]?.when[0]
    if (!condition) return
    update(index, { when: [{ ...condition, value }] })
  }

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">{messages.classEditor.appearance}</h3>
        <Button
          variant="ghost"
          size="sm"
          disabled={attributes.length === 0}
          onClick={() =>
            onChange([
              ...variants,
              newVisualVariant(attributes[0]!.name, defaultValueFor(attributes[0])),
            ])
          }
        >
          {messages.classEditor.addVariant}
        </Button>
      </header>
      {attributes.length === 0 ? (
        <p className="text-muted-foreground text-xs">{messages.classEditor.variantNoAttributes}</p>
      ) : variants.length === 0 ? (
        <p className="text-muted-foreground text-xs">{messages.classEditor.noVariants}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {variants.map((variant, index) => {
            const condition = variant.when[0]
            const attribute = attributes.find(
              (candidate) => candidate.name === condition?.attribute,
            )
            return (
              <li
                key={variant.id}
                className="border-border flex flex-col gap-2 rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    aria-label={messages.classEditor.variantName}
                    className={INPUT_CLASS}
                    value={variant.name}
                    onChange={(event) => update(index, { name: event.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={messages.classEditor.removeVariant}
                    onClick={() => onChange(variants.filter((_, i) => i !== index))}
                    className="text-muted-foreground hover:text-destructive px-1 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">
                      {messages.classEditor.variantAttribute}
                    </span>
                    <select
                      className={INPUT_CLASS}
                      value={condition?.attribute ?? ''}
                      onChange={(event) => updateCondition(index, event.target.value)}
                    >
                      {attributes.map((candidate) => (
                        <option key={candidate.name} value={candidate.name}>
                          {candidate.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">
                      {messages.classEditor.variantValue}
                    </span>
                    {attribute?.type === 'number' ? (
                      <input
                        type="number"
                        className={INPUT_CLASS}
                        value={Number(condition?.value ?? 0) || 0}
                        onChange={(event) => updateValue(index, Number(event.target.value) || 0)}
                      />
                    ) : attribute?.type === 'boolean' ? (
                      <select
                        className={INPUT_CLASS}
                        value={String(condition?.value ?? false)}
                        onChange={(event) => updateValue(index, event.target.value === 'true')}
                      >
                        <option value="true">{messages.booleans.true}</option>
                        <option value="false">{messages.booleans.false}</option>
                      </select>
                    ) : (
                      <input
                        className={INPUT_CLASS}
                        value={String(condition?.value ?? '')}
                        onChange={(event) => updateValue(index, event.target.value)}
                      />
                    )}
                  </label>
                </div>
                <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-2">
                  <label className="flex flex-col items-center gap-1 text-xs">
                    <span className="text-muted-foreground">
                      {messages.classEditor.variantColor}
                    </span>
                    <input
                      type="checkbox"
                      aria-label={messages.classEditor.variantColor}
                      checked={variant.color !== null}
                      onChange={(event) =>
                        update(index, { color: event.target.checked ? '#f4c542' : null })
                      }
                    />
                  </label>
                  <ColorInput
                    label=""
                    value={variant.color ?? '#f4c542'}
                    onChange={(value) => update(index, { color: value })}
                  />
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">
                      {messages.classEditor.variantShape}
                    </span>
                    <select
                      className={INPUT_CLASS}
                      value={variant.shape ?? ''}
                      onChange={(event) => update(index, { shape: event.target.value || null })}
                    >
                      {shapeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-muted-foreground">{messages.classEditor.variantGlyph}</span>
                  <input
                    className={INPUT_CLASS}
                    value={variant.glyph ?? ''}
                    onChange={(event) => update(index, { glyph: event.target.value || null })}
                  />
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
