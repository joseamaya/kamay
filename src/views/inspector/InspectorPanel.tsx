import { useState } from 'react'

import { BACKGROUNDS } from '../../engine'
import { format, getMessages } from '../../i18n'
import {
  useActiveScene,
  useCapabilities,
  useEditorStore,
  useProjectStore,
  useSelectedObject,
} from '../../store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { CopyIcon, TrashIcon } from '../../ui/icons'
import { IconButton } from '../../ui/IconButton'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'
import { Select } from '../../ui/Select'
import { OrderComposer } from '../actions/OrderComposer'
import { ConceptTerm } from './ConceptTerm'
import { ObjectAttributes } from './ObjectAttributes'
import { ObjectConcept } from './ObjectConcept'

export function InspectorPanel() {
  const messages = getMessages()
  const scene = useActiveScene()
  const object = useSelectedObject()
  const capabilities = useCapabilities()
  const selectObject = useEditorStore((state) => state.selectObject)
  const pushLog = useEditorStore((state) => state.pushLog)
  const duplicateObject = useProjectStore((state) => state.duplicateObject)
  const removeObject = useProjectStore((state) => state.removeObject)
  const setBackground = useProjectStore((state) => state.setBackground)
  const setPhysics = useProjectStore((state) => state.setPhysics)

  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!scene) return null

  if (!object) {
    const backgroundLabels: Record<string, string> = messages.backgrounds
    const options = BACKGROUNDS.map((background) => ({
      value: background.id,
      label: backgroundLabels[background.id] ?? background.id,
    }))

    return (
      <div data-inspector className="flex min-h-0">
        <Panel title={messages.inspector.scene} className="min-h-0 flex-1">
          <div className="flex flex-col gap-3">
            <Select
              label={messages.scenario.background}
              value={scene.background}
              options={options}
              onChange={(value) => setBackground(scene.id, value)}
            />
            <Button
              variant={scene.physics.enabled ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={scene.physics.enabled}
              onClick={() => setPhysics(scene.id, { enabled: !scene.physics.enabled })}
            >
              {messages.physics.toggle}
            </Button>
            {scene.physics.enabled ? (
              <NumberField
                label={messages.physics.gravity}
                value={scene.physics.gravityY}
                step={0.5}
                onChange={(value) => setPhysics(scene.id, { gravityY: value })}
              />
            ) : null}
            <p className="text-muted-foreground text-sm">{messages.inspector.empty}</p>
          </div>
        </Panel>
      </div>
    )
  }

  const confirmRemove = () => {
    removeObject(scene.id, object.id)
    selectObject(null)
    pushLog(messages.activity.objectRemoved)
    setConfirmDelete(false)
  }

  return (
    <div
      data-inspector
      data-simulation={JSON.stringify(object.simulation)}
      className="flex min-h-0"
    >
      <Panel
        title={object.name}
        className="min-h-0 flex-1"
        actions={
          <>
            <IconButton
              label={messages.selection.duplicate}
              onClick={() => {
                duplicateObject(scene.id, object.id)
                pushLog(messages.activity.objectDuplicated)
              }}
            >
              <CopyIcon />
            </IconButton>
            <IconButton
              label={messages.dialog.delete}
              className="hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon />
            </IconButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ConceptTerm id="object" />
            <span aria-hidden="true">·</span>
            <span>{format(messages.selection.class, { name: object.class })}</span>
          </div>

          <ObjectConcept scene={scene} object={object} />

          {capabilities.orders ? (
            <section className="flex flex-col">
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                <ConceptTerm id="method_call" />
              </h3>
              <OrderComposer key={object.id} scene={scene} object={object} />
            </section>
          ) : null}

          <ObjectAttributes key={object.id} scene={scene} object={object} />
        </div>
      </Panel>

      {confirmDelete ? (
        <Dialog
          open
          title={messages.dialog.deleteTitle}
          confirmLabel={messages.dialog.delete}
          cancelLabel={messages.dialog.cancel}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={confirmRemove}
        >
          {format(messages.dialog.deleteMessage, { name: object.name })}
        </Dialog>
      ) : null}
    </div>
  )
}
