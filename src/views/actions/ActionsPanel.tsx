import { useState } from 'react'

import { getMessages } from '../../i18n'
import { BUILTIN_METHODS } from '../../model'
import type { Action, AttributeType, BuiltinMethod } from '../../model'
import { useActiveScene, useEditorStore, useProjectStore, useSelectedObject } from '../../store'
import { Button } from '../../ui/Button'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'
import { Select } from '../../ui/Select'
import { TextField } from '../../ui/TextField'

const EVENT_TYPE = 'on_start'

function defaultValue(type: AttributeType): string {
  return type === 'number' ? '0' : ''
}

export function ActionsPanel() {
  const messages = getMessages()
  const scene = useActiveScene()
  const object = useSelectedObject()
  const addAction = useProjectStore((state) => state.addAction)
  const removeAction = useProjectStore((state) => state.removeAction)
  const pushLog = useEditorStore((state) => state.pushLog)

  const [methodName, setMethodName] = useState(BUILTIN_METHODS[0]!.name)
  const [values, setValues] = useState<Record<string, string>>({})

  const methodLabels: Record<string, string> = {
    decir: messages.methods.decir,
    mover: messages.methods.mover,
    girar: messages.methods.girar,
    cambiar_escala: messages.methods.cambiar_escala,
  }
  const paramLabels: Record<string, string> = {
    mensaje: messages.params.mensaje,
    x: messages.params.x,
    y: messages.params.y,
    grados: messages.params.grados,
    factor: messages.params.factor,
  }

  if (!scene || !object) {
    return (
      <Panel title={messages.actions.title} className="min-h-0">
        <p className="text-muted-foreground text-sm">{messages.actions.empty}</p>
      </Panel>
    )
  }

  const definition = scene.classes.find((candidate) => candidate.name === object.class)
  const customMethods: BuiltinMethod[] = (definition?.methods ?? []).map((method) => ({
    name: method.name,
    parameters: method.parameters,
  }))
  const availableMethods: BuiltinMethod[] = [
    ...BUILTIN_METHODS.filter(
      (builtin) => !customMethods.some((custom) => custom.name === builtin.name),
    ),
    ...customMethods,
  ]
  const method =
    availableMethods.find((candidate) => candidate.name === methodName) ?? availableMethods[0]!

  const event = scene.events.find((candidate) => candidate.type === EVENT_TYPE)
  const actions = (event?.actions ?? [])
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => action.target === object.name || action.target === object.id)

  const handleAdd = () => {
    const args: Record<string, number | string> = {}
    for (const parameter of method.parameters) {
      const raw = values[parameter.name] ?? defaultValue(parameter.type)
      args[parameter.name] = parameter.type === 'number' ? Number(raw) || 0 : raw
    }
    const action: Action = { target: object.name, method: method.name, args }
    addAction(scene.id, EVENT_TYPE, action)
    pushLog(messages.activity.actionAdded)
  }

  return (
    <Panel title={messages.actions.title} className="min-h-0">
      <div className="flex flex-col gap-3">
        {actions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{messages.actions.noActions}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {actions.map(({ action, index }) => (
              <li key={index} className="flex items-center gap-2">
                <code className="bg-muted/50 border-border flex-1 overflow-hidden rounded-md border px-2 py-1 font-mono text-xs text-ellipsis whitespace-nowrap">
                  {action.method}({Object.values(action.args).join(', ')})
                </code>
                <button
                  type="button"
                  aria-label={messages.actions.remove}
                  onClick={() => {
                    removeAction(scene.id, EVENT_TYPE, index)
                    pushLog(messages.activity.actionRemoved)
                  }}
                  className="text-muted-foreground hover:text-destructive rounded-md px-2 py-1 text-lg leading-none"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-border flex flex-col gap-2 border-t pt-3">
          <Select
            label={messages.actions.method}
            value={method.name}
            options={availableMethods.map((candidate) => ({
              value: candidate.name,
              label: methodLabels[candidate.name] ?? candidate.name,
            }))}
            onChange={setMethodName}
          />
          {method.parameters.map((parameter) =>
            parameter.type === 'number' ? (
              <NumberField
                key={parameter.name}
                label={paramLabels[parameter.name] ?? parameter.name}
                value={Number(values[parameter.name] ?? defaultValue(parameter.type)) || 0}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [parameter.name]: String(value) }))
                }
              />
            ) : (
              <TextField
                key={parameter.name}
                label={paramLabels[parameter.name] ?? parameter.name}
                value={values[parameter.name] ?? defaultValue(parameter.type)}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [parameter.name]: value }))
                }
              />
            ),
          )}
          <Button size="sm" onClick={handleAdd}>
            {messages.actions.add}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
