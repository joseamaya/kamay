import { useState } from 'react'

import { format, getMessages } from '../../i18n'
import { identifierPattern, iterableClasses, resolveMethods, withDomainBases } from '../../model'
import type {
  Action,
  AttributeType,
  MethodParameter,
  MethodSignature,
  ObjectInstance,
  Scene,
} from '../../model'
import { useCapabilities, useEditorStore, useProjectStore } from '../../store'
import { Button } from '../../ui/Button'
import { NumberField } from '../../ui/NumberField'
import { Select } from '../../ui/Select'
import { TextField } from '../../ui/TextField'
import { MemberLink } from '../inspector/MemberLink'

type OrderKind = 'call' | 'for_each'

function defaultValue(type: AttributeType): string {
  return type === 'number' ? '0' : ''
}

function buildArgs(
  parameters: MethodParameter[],
  values: Record<string, string>,
): Record<string, number | string> {
  const args: Record<string, number | string> = {}
  for (const parameter of parameters) {
    const raw = values[parameter.name] ?? defaultValue(parameter.type)
    args[parameter.name] = parameter.type === 'number' ? Number(raw) || 0 : raw
  }
  return args
}

/** Keeps the loop variable a valid Python identifier, falling back when empty. */
function safeIdentifier(value: string, fallback: string): string {
  return identifierPattern.test(value) ? value : fallback
}

export interface OrderComposerProps {
  scene: Scene
  object: ObjectInstance
}

export function OrderComposer({ scene, object }: OrderComposerProps) {
  const messages = getMessages()
  const capabilities = useCapabilities()
  const addOrder = useProjectStore((state) => state.addOrder)
  const removeOrder = useProjectStore((state) => state.removeOrder)
  const pushLog = useEditorStore((state) => state.pushLog)

  const [kind, setKind] = useState<OrderKind>('call')
  const [methodName, setMethodName] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [forEachClass, setForEachClass] = useState('')
  const [forEachVariable, setForEachVariable] = useState('elemento')
  const [forEachMethodName, setForEachMethodName] = useState('')
  const [forEachValues, setForEachValues] = useState<Record<string, string>>({})

  const resolvedScene = withDomainBases(scene)

  const methodLabels: Record<string, string> = messages.methods
  const paramLabels: Record<string, string> = {
    mensaje: messages.params.mensaje,
    x: messages.params.x,
    y: messages.params.y,
    nombre: messages.params.nombre,
  }

  const availableMethods: MethodSignature[] = resolveMethods(scene, object.class).map((method) => ({
    name: method.name,
    parameters: method.parameters,
  }))
  const method =
    availableMethods.find((candidate) => candidate.name === methodName) ?? availableMethods[0]
  const methodOptions = availableMethods.map((candidate) => ({
    value: candidate.name,
    label: methodLabels[candidate.name] ?? candidate.name,
  }))

  const classOptions = iterableClasses(resolvedScene).map((name) => ({ value: name, label: name }))
  const selectedClass = forEachClass || classOptions[0]?.value || ''
  const forEachMethods: MethodSignature[] = resolveMethods(resolvedScene, selectedClass).map(
    (candidate) => ({ name: candidate.name, parameters: candidate.parameters }),
  )
  const forEachMethod =
    forEachMethods.find((candidate) => candidate.name === forEachMethodName) ?? forEachMethods[0]
  const forEachMethodOptions = forEachMethods.map((candidate) => ({
    value: candidate.name,
    label: methodLabels[candidate.name] ?? candidate.name,
  }))

  const orders = scene.orders
    .map((action, index) => ({ action, index }))
    .filter(
      ({ action }) =>
        action.kind === 'for_each' || action.target === object.name || action.target === object.id,
    )

  const handleAdd = () => {
    if (!method) return
    const action: Action = {
      kind: 'call',
      target: object.name,
      method: method.name,
      args: buildArgs(method.parameters, values),
    }
    addOrder(scene.id, action)
    pushLog(messages.activity.actionAdded)
  }

  const handleAddForEach = () => {
    if (!forEachMethod || !selectedClass) return
    const action: Action = {
      kind: 'for_each',
      target: '',
      class: selectedClass,
      variable: safeIdentifier(forEachVariable, 'elemento'),
      method: forEachMethod.name,
      args: buildArgs(forEachMethod.parameters, forEachValues),
    }
    addOrder(scene.id, action)
    pushLog(messages.activity.actionAdded)
  }

  const parameterFields = (
    parameters: MethodParameter[],
    state: Record<string, string>,
    setState: (next: Record<string, string>) => void,
  ) =>
    parameters.map((parameter) =>
      parameter.type === 'number' ? (
        <NumberField
          key={parameter.name}
          label={paramLabels[parameter.name] ?? parameter.name}
          value={Number(state[parameter.name] ?? defaultValue(parameter.type)) || 0}
          onChange={(value) => setState({ ...state, [parameter.name]: String(value) })}
        />
      ) : (
        <TextField
          key={parameter.name}
          label={paramLabels[parameter.name] ?? parameter.name}
          value={state[parameter.name] ?? defaultValue(parameter.type)}
          onChange={(value) => setState({ ...state, [parameter.name]: value })}
        />
      ),
    )

  return (
    <div className="flex flex-col gap-3">
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">{messages.actions.noActions}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {orders.map(({ action, index }) => (
            <li key={index} className="flex items-center gap-2">
              <MemberLink
                member={{ kind: 'order', orderIndex: index }}
                label={format(messages.code.showInCodeMember, { name: action.method })}
                className="bg-muted/50 border-border flex-1 overflow-hidden rounded-md border px-2 py-1 font-mono text-xs text-ellipsis whitespace-nowrap"
              >
                {action.kind === 'for_each'
                  ? `${format(messages.actions.forEachTag, { class: action.class ?? '' })}: ${action.method}(${Object.values(action.args).join(', ')})`
                  : `${action.method}(${Object.values(action.args).join(', ')})`}
              </MemberLink>
              <button
                type="button"
                aria-label={messages.actions.remove}
                onClick={() => {
                  removeOrder(scene.id, index)
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
        {capabilities.inheritance ? (
          <Select
            label={messages.actions.kind}
            value={kind}
            options={[
              { value: 'call', label: messages.actions.kindCall },
              { value: 'for_each', label: messages.actions.kindForEach },
            ]}
            onChange={(value) => setKind(value as OrderKind)}
          />
        ) : null}

        {kind === 'call' ? (
          <>
            <Select
              label={messages.actions.method}
              value={method?.name ?? ''}
              options={methodOptions}
              onChange={setMethodName}
            />
            {parameterFields(method?.parameters ?? [], values, setValues)}
            <Button size="sm" disabled={!method} onClick={handleAdd}>
              {messages.actions.add}
            </Button>
          </>
        ) : (
          <>
            <Select
              label={messages.actions.forEachClass}
              value={selectedClass}
              options={classOptions}
              onChange={(value) => {
                setForEachClass(value)
                setForEachMethodName('')
              }}
            />
            <TextField
              label={messages.actions.forEachVariable}
              value={forEachVariable}
              onChange={setForEachVariable}
            />
            <Select
              label={messages.actions.method}
              value={forEachMethod?.name ?? ''}
              options={forEachMethodOptions}
              onChange={setForEachMethodName}
            />
            {parameterFields(forEachMethod?.parameters ?? [], forEachValues, setForEachValues)}
            <Button
              size="sm"
              disabled={!forEachMethod || !selectedClass}
              onClick={handleAddForEach}
            >
              {messages.actions.addForEach}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
