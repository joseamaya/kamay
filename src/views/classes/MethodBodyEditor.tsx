import { useState } from 'react'
import type { ReactNode } from 'react'

import { blocksToCode } from '../../generator'
import { getMessages } from '../../i18n'
import {
  availableBlockAttributes,
  availableBlockMethods,
  createCallBlock,
  createRepeatBlock,
  createSetBlock,
  defaultValueFor,
} from '../../model'
import type {
  Attribute,
  AttributeType,
  BuiltinMethod,
  ClassDefinition,
  Method,
  MethodBody,
  Operation,
  Scene,
} from '../../model'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { LazyCodeEditor } from '../../ui/LazyCodeEditor'
import { NumberField } from '../../ui/NumberField'
import { Select } from '../../ui/Select'
import { TextField } from '../../ui/TextField'

const SMALL_BUTTON =
  'text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-1.5 text-sm leading-none disabled:opacity-40'

function ValueField({
  type,
  label,
  value,
  onChange,
}: {
  type: AttributeType
  label: string
  value: unknown
  onChange: (value: number | string | boolean) => void
}) {
  const messages = getMessages()
  if (type === 'number') {
    return (
      <NumberField
        label={label}
        value={typeof value === 'number' ? value : 0}
        onChange={onChange}
      />
    )
  }
  if (type === 'boolean') {
    return (
      <Select
        label={label}
        value={String(value ?? false)}
        options={[
          { value: 'true', label: messages.booleans.true },
          { value: 'false', label: messages.booleans.false },
        ]}
        onChange={(next) => onChange(next === 'true')}
      />
    )
  }
  return (
    <TextField label={label} value={typeof value === 'string' ? value : ''} onChange={onChange} />
  )
}

function methodLabel(methods: BuiltinMethod[], name: string): string {
  const labels = getMessages().methods as Record<string, string>
  return labels[name] ?? methods.find((method) => method.name === name)?.name ?? name
}

function parameterLabel(name: string): string {
  const labels = getMessages().params as Record<string, string>
  return labels[name] ?? name
}

function BlockCard({
  op,
  methods,
  attributes,
  onChange,
}: {
  op: Operation
  methods: BuiltinMethod[]
  attributes: Attribute[]
  onChange: (op: Operation) => void
}) {
  const messages = getMessages()

  if (op.op === 'call') {
    const methodName = String(op.args.method ?? methods[0]?.name ?? '')
    const selected = methods.find((method) => method.name === methodName) ?? methods[0]
    const values = (op.args.values ?? {}) as Record<string, unknown>

    return (
      <div className="flex flex-col gap-2">
        <Select
          label={messages.classEditor.blockMethod}
          value={selected?.name ?? ''}
          options={methods.map((method) => ({
            value: method.name,
            label: methodLabel(methods, method.name),
          }))}
          onChange={(name) => onChange({ ...op, args: { method: name, values: {} } })}
        />
        {selected?.parameters.map((parameter) => (
          <ValueField
            key={parameter.name}
            type={parameter.type}
            label={parameterLabel(parameter.name)}
            value={values[parameter.name]}
            onChange={(value) =>
              onChange({
                ...op,
                args: { ...op.args, values: { ...values, [parameter.name]: value } },
              })
            }
          />
        ))}
      </div>
    )
  }

  if (op.op === 'set') {
    const name = String(op.args.name ?? attributes[0]?.name ?? '')
    const attribute = attributes.find((candidate) => candidate.name === name) ?? attributes[0]

    return (
      <div className="flex flex-col gap-2">
        <Select
          label={messages.classEditor.blockAttribute}
          value={name}
          options={attributes.map((item) => ({ value: item.name, label: item.name }))}
          onChange={(next) => {
            const selectedAttribute = attributes.find((item) => item.name === next)
            onChange({
              ...op,
              args: {
                name: next,
                value: selectedAttribute ? defaultValueFor(selectedAttribute.type) : 0,
              },
            })
          }}
        />
        {attribute ? (
          <ValueField
            type={attribute.type}
            label={messages.classEditor.blockValue}
            value={op.args.value}
            onChange={(value) => onChange({ ...op, args: { ...op.args, value } })}
          />
        ) : null}
      </div>
    )
  }

  return (
    <NumberField
      label={messages.classEditor.blockTimes}
      value={Number(op.args.times) || 0}
      onChange={(times) => onChange({ ...op, args: { ...op.args, times } })}
    />
  )
}

function opLabel(op: Operation): string {
  const messages = getMessages().classEditor
  if (op.op === 'call') return messages.blockCall
  if (op.op === 'set') return messages.blockSet
  return messages.blockRepeat
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={SMALL_BUTTON}
    >
      {children}
    </button>
  )
}

function BlockList({
  ops,
  methods,
  attributes,
  onChange,
}: {
  ops: Operation[]
  methods: BuiltinMethod[]
  attributes: Attribute[]
  onChange: (ops: Operation[]) => void
}) {
  const messages = getMessages()

  const replace = (index: number, next: Operation) =>
    onChange(ops.map((op, current) => (current === index ? next : op)))
  const remove = (index: number) => onChange(ops.filter((_, current) => current !== index))
  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= ops.length) return
    const next = [...ops]
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    onChange(next)
  }

  return (
    <ul className="flex flex-col gap-2">
      {ops.map((op, index) => (
        <li key={op.id} className="border-border rounded-md border p-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">{opLabel(op)}</span>
            <div className="flex items-center gap-1">
              <IconButton
                label={messages.classEditor.moveUp}
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                ↑
              </IconButton>
              <IconButton
                label={messages.classEditor.moveDown}
                onClick={() => move(index, 1)}
                disabled={index === ops.length - 1}
              >
                ↓
              </IconButton>
              <IconButton label={messages.classEditor.removeBlock} onClick={() => remove(index)}>
                ×
              </IconButton>
            </div>
          </div>
          <BlockCard
            op={op}
            methods={methods}
            attributes={attributes}
            onChange={(next) => replace(index, next)}
          />
          {op.op === 'repeat' ? (
            <div className="border-border mt-2 border-l-2 pl-2">
              <BlockList
                ops={op.children}
                methods={methods}
                attributes={attributes}
                onChange={(children) => replace(index, { ...op, children })}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export interface MethodBodyEditorProps {
  scene: Scene
  definition: ClassDefinition
  method: Method
  onChange: (body: MethodBody) => void
}

export function MethodBodyEditor({ scene, definition, method, onChange }: MethodBodyEditorProps) {
  const messages = getMessages()
  const [confirmReset, setConfirmReset] = useState(false)

  const body = method.body
  const methods = availableBlockMethods(scene, definition)
  const attributes = availableBlockAttributes(scene, definition)
  const preview = blocksToCode(scene, definition, body.kind === 'blocks' ? body.ops : [])

  return (
    <section className="mt-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">
          {messages.classEditor.body}
        </span>
        {body.kind === 'blocks' ? (
          <div className="flex items-center gap-1">
            <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs">
              {messages.classEditor.blocks}
            </span>
            <button
              type="button"
              onClick={() => onChange({ kind: 'code', code: preview })}
              className="text-primary text-xs font-medium hover:underline"
            >
              {messages.classEditor.convertToCode}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">
              {messages.classEditor.advancedCode}
            </span>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-primary text-xs font-medium hover:underline"
            >
              {messages.classEditor.backToBlocks}
            </button>
          </div>
        )}
      </div>

      {body.kind === 'blocks' ? (
        <>
          <BlockList
            ops={body.ops}
            methods={methods}
            attributes={attributes}
            onChange={(ops) => onChange({ kind: 'blocks', ops })}
          />

          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({
                  kind: 'blocks',
                  ops: [...body.ops, createCallBlock(methods[0]?.name ?? '')],
                })
              }
            >
              {messages.classEditor.addCall}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={attributes.length === 0}
              onClick={() => {
                const attribute = attributes[0]
                if (!attribute) return
                onChange({
                  kind: 'blocks',
                  ops: [
                    ...body.ops,
                    createSetBlock(attribute.name, defaultValueFor(attribute.type)),
                  ],
                })
              }}
            >
              {messages.classEditor.addSet}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ kind: 'blocks', ops: [...body.ops, createRepeatBlock()] })}
            >
              {messages.classEditor.addRepeat}
            </Button>
          </div>

          {attributes.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              {messages.classEditor.blockNoAttributes}
            </p>
          ) : null}

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">{messages.classEditor.preview}</span>
            <div className="border-border h-24 overflow-hidden rounded-md border">
              <LazyCodeEditor readOnly value={preview} />
            </div>
          </div>
        </>
      ) : (
        <div className="border-border h-28 overflow-hidden rounded-md border">
          <LazyCodeEditor
            value={body.code}
            onValueChange={(code) => onChange({ kind: 'code', code })}
            ariaLabel={messages.classEditor.body}
          />
        </div>
      )}

      <Dialog
        open={confirmReset}
        title={messages.classEditor.backToBlocks}
        confirmLabel={messages.dialog.continue}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          onChange({ kind: 'blocks', ops: [] })
        }}
      >
        {messages.classEditor.backToBlocksMessage}
      </Dialog>
    </section>
  )
}
