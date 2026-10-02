import { useMemo, useState } from 'react'

import { getMessages } from '../../i18n'
import {
  ACTOR_CATALOG,
  availableBaseClasses,
  BASE_CLASS,
  createClassDraft,
  hasClassDraftErrors,
  newAttribute,
  validateClassDraft,
} from '../../model'
import type {
  Attribute,
  AttributeType,
  ClassDefinition,
  Method,
  Parameter,
  Scene,
} from '../../model'
import { Button } from '../../ui/Button'
import { ColorInput } from '../../ui/ColorInput'
import { Dialog } from '../../ui/Dialog'
import { Select } from '../../ui/Select'
import { MethodBodyEditor } from './MethodBodyEditor'

const INPUT_CLASS =
  'border-border bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none'

function defaultValue(type: AttributeType): number | string | boolean {
  if (type === 'number') return 0
  if (type === 'boolean') return false
  return ''
}

export interface ClassEditorDialogProps {
  scene: Scene
  initial: ClassDefinition | null
  onSave: (definition: ClassDefinition) => void
  onClose: () => void
}

export function ClassEditorDialog({ scene, initial, onSave, onClose }: ClassEditorDialogProps) {
  const messages = getMessages()
  const [draft, setDraft] = useState<ClassDefinition>(() => initial ?? createClassDraft())

  const errors = useMemo(() => validateClassDraft(scene, draft), [scene, draft])
  const invalid = hasClassDraftErrors(errors)

  const typeOptions = [
    { value: 'number', label: messages.types.number },
    { value: 'string', label: messages.types.string },
    { value: 'boolean', label: messages.types.boolean },
  ]
  const shapeOptions = ACTOR_CATALOG.map((item) => ({
    value: item.shape,
    label: messages.catalog[item.shape],
  }))
  const baseOptions = availableBaseClasses(scene, draft).map((name) => ({
    value: name,
    label: name,
  }))

  const visual = (name: 'color' | 'shape', fallback: string): string => {
    const attribute = draft.attributes.find((candidate) => candidate.name === name)
    return typeof attribute?.initial === 'string' ? attribute.initial : fallback
  }

  const setVisual = (name: 'color' | 'shape', value: string) => {
    setDraft((current) => ({
      ...current,
      attributes: current.attributes.map((attribute) =>
        attribute.name === name ? { ...attribute, initial: value } : attribute,
      ),
    }))
  }

  const customAttributes = draft.attributes
    .map((attribute, index) => ({ attribute, index }))
    .filter(({ attribute }) => attribute.name !== 'color' && attribute.name !== 'shape')

  const updateAttribute = (index: number, patch: Partial<Attribute>) => {
    setDraft((current) => ({
      ...current,
      attributes: current.attributes.map((attribute, i) =>
        i === index ? { ...attribute, ...patch } : attribute,
      ),
    }))
  }

  const updateMethod = (index: number, patch: Partial<Method>) => {
    setDraft((current) => ({
      ...current,
      methods: current.methods.map((method, i) => (i === index ? { ...method, ...patch } : method)),
    }))
  }

  const updateParameter = (
    methodIndex: number,
    parameterIndex: number,
    patch: Partial<Parameter>,
  ) => {
    setDraft((current) => ({
      ...current,
      methods: current.methods.map((method, i) =>
        i === methodIndex
          ? {
              ...method,
              parameters: method.parameters.map((parameter, p) =>
                p === parameterIndex ? { ...parameter, ...patch } : parameter,
              ),
            }
          : method,
      ),
    }))
  }

  const handleSave = () => {
    if (invalid) return
    onSave({
      ...draft,
      name: draft.name.trim(),
      attributes: draft.attributes.map((attribute) => ({
        ...attribute,
        name: attribute.name.trim(),
      })),
      methods: draft.methods.map((method) => ({
        ...method,
        name: method.name.trim(),
        parameters: method.parameters.map((parameter) => ({
          ...parameter,
          name: parameter.name.trim(),
        })),
      })),
    })
  }

  return (
    <Dialog
      open
      title={initial ? messages.classEditor.titleEdit : messages.classEditor.titleNew}
      confirmLabel={messages.classEditor.save}
      cancelLabel={messages.dialog.cancel}
      panelClassName="max-w-2xl"
      confirmDisabled={invalid}
      onConfirm={handleSave}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">{messages.classEditor.name}</span>
              <input
                className={INPUT_CLASS}
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
              {errors.nameInvalid ? (
                <span className="text-destructive">{messages.classEditor.errorNameInvalid}</span>
              ) : errors.nameTaken ? (
                <span className="text-destructive">{messages.classEditor.errorNameTaken}</span>
              ) : null}
            </label>
            <div className="flex flex-col gap-1">
              <Select
                label={messages.classEditor.base}
                value={draft.inherits ?? BASE_CLASS}
                options={baseOptions}
                onChange={(value) => setDraft((current) => ({ ...current, inherits: value }))}
              />
              {errors.inheritsInvalid ? (
                <span className="text-destructive text-xs">
                  {messages.classEditor.errorInherits}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <ColorInput
              label={messages.classEditor.color}
              value={visual('color', '#e2603a')}
              onChange={(value) => setVisual('color', value)}
            />
            <Select
              label={messages.classEditor.shape}
              value={visual('shape', 'circle')}
              options={shapeOptions}
              onChange={(value) => setVisual('shape', value)}
            />
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <header className="flex items-center justify-between">
            <h3 className="font-semibold">{messages.classEditor.attributes}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  attributes: [...current.attributes, newAttribute()],
                }))
              }
            >
              {messages.classEditor.addAttribute}
            </Button>
          </header>
          {customAttributes.length === 0 ? (
            <p className="text-muted-foreground text-xs">{messages.classEditor.noAttributes}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {customAttributes.map(({ attribute, index }) => (
                <li key={index} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                  <input
                    aria-label={messages.classEditor.attributeName}
                    className={INPUT_CLASS}
                    value={attribute.name}
                    onChange={(event) => updateAttribute(index, { name: event.target.value })}
                  />
                  <select
                    aria-label={messages.classEditor.attribute}
                    className={INPUT_CLASS}
                    value={attribute.type}
                    onChange={(event) =>
                      updateAttribute(index, {
                        type: event.target.value as AttributeType,
                        initial: defaultValue(event.target.value as AttributeType),
                      })
                    }
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {attribute.type === 'number' ? (
                    <input
                      type="number"
                      aria-label={messages.classEditor.value}
                      className={INPUT_CLASS}
                      value={Number(attribute.initial) || 0}
                      onChange={(event) =>
                        updateAttribute(index, { initial: Number(event.target.value) || 0 })
                      }
                    />
                  ) : attribute.type === 'boolean' ? (
                    <select
                      aria-label={messages.classEditor.value}
                      className={INPUT_CLASS}
                      value={String(attribute.initial)}
                      onChange={(event) =>
                        updateAttribute(index, { initial: event.target.value === 'true' })
                      }
                    >
                      <option value="true">{messages.booleans.true}</option>
                      <option value="false">{messages.booleans.false}</option>
                    </select>
                  ) : (
                    <input
                      aria-label={messages.classEditor.value}
                      className={INPUT_CLASS}
                      value={String(attribute.initial)}
                      onChange={(event) => updateAttribute(index, { initial: event.target.value })}
                    />
                  )}
                  <button
                    type="button"
                    aria-label={messages.classEditor.removeAttribute}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        attributes: current.attributes.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-muted-foreground hover:text-destructive px-1 text-lg leading-none"
                  >
                    ×
                  </button>
                  {errors.attributes[index] ? (
                    <span className="text-destructive col-span-4 text-xs">
                      {messages.classEditor.errorAttribute}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <header className="flex items-center justify-between">
            <h3 className="font-semibold">{messages.classEditor.methods}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  methods: [
                    ...current.methods,
                    { name: 'nuevo', parameters: [], body: { kind: 'blocks', ops: [] } },
                  ],
                }))
              }
            >
              {messages.classEditor.addMethod}
            </Button>
          </header>
          {draft.methods.map((method, methodIndex) => (
            <div key={methodIndex} className="border-border rounded-md border p-2">
              <div className="flex items-center gap-2">
                <input
                  aria-label={messages.classEditor.methodName}
                  className={INPUT_CLASS}
                  value={method.name}
                  onChange={(event) => updateMethod(methodIndex, { name: event.target.value })}
                />
                <button
                  type="button"
                  aria-label={messages.classEditor.removeMethod}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      methods: current.methods.filter((_, i) => i !== methodIndex),
                    }))
                  }
                  className="text-muted-foreground hover:text-destructive px-1 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              {errors.methods[methodIndex]?.nameInvalid ||
              errors.methods[methodIndex]?.nameTaken ? (
                <span className="text-destructive text-xs">
                  {errors.methods[methodIndex]?.nameTaken
                    ? messages.classEditor.errorNameTaken
                    : messages.classEditor.errorNameInvalid}
                </span>
              ) : null}

              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {messages.classEditor.parameters}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMethod(methodIndex, {
                        parameters: [...method.parameters, { name: 'parametro', type: 'number' }],
                      })
                    }
                  >
                    {messages.classEditor.addParameter}
                  </Button>
                </div>
                {method.parameters.map((parameter, parameterIndex) => (
                  <div
                    key={parameterIndex}
                    className="mt-1 grid grid-cols-[1fr_auto_auto] items-center gap-2"
                  >
                    <input
                      aria-label={messages.classEditor.parameterName}
                      className={INPUT_CLASS}
                      value={parameter.name}
                      onChange={(event) =>
                        updateParameter(methodIndex, parameterIndex, { name: event.target.value })
                      }
                    />
                    <select
                      aria-label={messages.classEditor.parameter}
                      className={INPUT_CLASS}
                      value={parameter.type}
                      onChange={(event) =>
                        updateParameter(methodIndex, parameterIndex, {
                          type: event.target.value as AttributeType,
                        })
                      }
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={messages.classEditor.removeParameter}
                      onClick={() =>
                        updateMethod(methodIndex, {
                          parameters: method.parameters.filter((_, p) => p !== parameterIndex),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive px-1 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {errors.methods[methodIndex]?.invalidParameters ? (
                  <span className="text-destructive text-xs">
                    {messages.classEditor.errorParameter}
                  </span>
                ) : null}
              </div>

              <MethodBodyEditor
                scene={scene}
                definition={draft}
                method={method}
                onChange={(body) => updateMethod(methodIndex, { body })}
              />
            </div>
          ))}
        </section>
      </div>
    </Dialog>
  )
}
