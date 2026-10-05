import { forwardRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { format, getMessages } from '../../i18n'
import {
  useActiveScene,
  useCapabilities,
  useEditorStore,
  useProjectStore,
  useRuntimeStore,
  useSelectedObject,
} from '../../store'
import { Dialog } from '../../ui/Dialog'
import { OrderComposer } from '../actions/OrderComposer'
import { ObjectAttributes } from '../inspector/ObjectAttributes'
import { ObjectConcept } from '../inspector/ObjectConcept'

export const SelectionOverlay = forwardRef<HTMLDivElement>(function SelectionOverlay(_props, ref) {
  const messages = getMessages()
  const scene = useActiveScene()
  const object = useSelectedObject()
  const capabilities = useCapabilities()
  const status = useRuntimeStore((state) => state.status)
  const selectObject = useEditorStore((state) => state.selectObject)
  const pushLog = useEditorStore((state) => state.pushLog)
  const duplicateObject = useProjectStore((state) => state.duplicateObject)
  const removeObject = useProjectStore((state) => state.removeObject)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const running = status === 'loading' || status === 'running' || status === 'ready'

  if (!scene || !object || running) return null

  const confirmRemove = () => {
    removeObject(scene.id, object.id)
    selectObject(null)
    pushLog(messages.activity.objectRemoved)
    setConfirmDelete(false)
  }

  return (
    <div
      ref={ref}
      data-selection-overlay
      role="group"
      aria-label={messages.selection.menu}
      className="pointer-events-none absolute top-0 left-0 z-20"
      style={{ transform: 'translate(-9999px, -9999px)' }}
    >
      <div
        className="border-border bg-card text-card-foreground pointer-events-auto flex w-72 flex-col gap-3 overflow-auto rounded-lg border p-3 shadow-lg"
        style={{ maxHeight: 'var(--kamay-menu-max, 70vh)' }}
      >
        <header className="flex flex-col">
          <span className="text-sm font-semibold">{object.name}</span>
          <span className="text-muted-foreground text-xs">
            {format(messages.selection.class, { name: object.class })}
          </span>
        </header>

        <ObjectConcept scene={scene} object={object} />

        {capabilities.orders ? (
          <section className="flex flex-col">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              {messages.selection.orders}
            </h3>
            <OrderComposer key={object.id} scene={scene} object={object} />
          </section>
        ) : null}

        <section className="flex flex-col">
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            {messages.selection.appearance}
          </h3>
          <ObjectAttributes key={object.id} scene={scene} object={object} />
        </section>

        <footer className="border-border flex items-center justify-end gap-2 border-t pt-3">
          <button
            type="button"
            onClick={() => {
              duplicateObject(scene.id, object.id)
              pushLog(messages.activity.objectDuplicated)
            }}
            className="border-border hover:bg-muted rounded-md border px-2 py-1 text-xs transition"
          >
            {messages.selection.duplicate}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="border-border hover:bg-muted text-destructive rounded-md border px-2 py-1 text-xs transition"
          >
            {messages.dialog.delete}
          </button>
        </footer>
      </div>

      {confirmDelete
        ? createPortal(
            <Dialog
              open
              title={messages.dialog.deleteTitle}
              confirmLabel={messages.dialog.delete}
              cancelLabel={messages.dialog.cancel}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={confirmRemove}
            >
              {format(messages.dialog.deleteMessage, { name: object.name })}
            </Dialog>,
            document.body,
          )
        : null}
    </div>
  )
})
