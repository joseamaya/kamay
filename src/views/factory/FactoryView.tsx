import { useState } from 'react'

import { format, getMessages } from '../../i18n'
import { ACTOR_CATALOG } from '../../model'
import type { ActorShape, CatalogItem } from '../../model'
import { useActiveScene, useEditorStore, useProjectStore } from '../../store'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'
import { Panel } from '../../ui/Panel'

function ShapePreview({ shape, color }: { shape: ActorShape; color: string }) {
  const style = { backgroundColor: color }
  if (shape === 'square') return <span className="h-6 w-6 rounded-sm" style={style} />
  if (shape === 'triangle') {
    return (
      <span
        className="h-6 w-6"
        style={{ ...style, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }}
      />
    )
  }
  return <span className="h-6 w-6 rounded-full" style={style} />
}

export function FactoryView() {
  const messages = getMessages()
  const scene = useActiveScene()
  const addObject = useProjectStore((state) => state.addObject)
  const removeObject = useProjectStore((state) => state.removeObject)
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const pushLog = useEditorStore((state) => state.pushLog)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const catalogLabels: Record<string, string> = {
    circle: messages.catalog.circle,
    square: messages.catalog.square,
    triangle: messages.catalog.triangle,
  }

  if (!scene) return null
  const pendingDelete = scene.objects.find((object) => object.id === pendingDeleteId) ?? null

  const handleAdd = (item: CatalogItem) => {
    addObject(scene.id, item.id)
    pushLog(messages.activity.objectAdded)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    removeObject(scene.id, pendingDelete.id)
    if (selectedObjectId === pendingDelete.id) selectObject(null)
    pushLog(messages.activity.objectRemoved)
    setPendingDeleteId(null)
  }

  return (
    <Panel title={messages.factory.title} className="min-h-0">
      <div className="flex h-full flex-col gap-4">
        <div>
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            {messages.factory.catalogTitle}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {ACTOR_CATALOG.map((item) => {
              const label = catalogLabels[item.id] ?? item.className
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={format(messages.factory.addObject, { name: label })}
                  onClick={() => handleAdd(item)}
                  className="border-border hover:bg-muted focus-visible:ring-ring flex flex-col items-center gap-1 rounded-md border p-2 transition focus-visible:ring-2 focus-visible:outline-none"
                >
                  <ShapePreview shape={item.shape} color={item.color} />
                  <span className="text-xs">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            {messages.factory.objectsTitle}
          </h3>
          {scene.objects.length === 0 ? (
            <p className="text-muted-foreground text-sm">{messages.factory.empty}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {scene.objects.map((object) => (
                <li key={object.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectObject(object.id)}
                    className={cn(
                      'flex-1 rounded-md border px-2 py-1 text-left text-sm transition',
                      object.id === selectedObjectId
                        ? 'border-primary bg-secondary'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    {object.name}
                  </button>
                  <button
                    type="button"
                    aria-label={format(messages.factory.removeObject, { name: object.name })}
                    onClick={() => setPendingDeleteId(object.id)}
                    className="text-muted-foreground hover:text-destructive rounded-md px-2 py-1 text-lg leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={pendingDelete !== null}
        title={messages.dialog.deleteTitle}
        confirmLabel={messages.dialog.delete}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      >
        {pendingDelete ? format(messages.dialog.deleteMessage, { name: pendingDelete.name }) : null}
      </Dialog>
    </Panel>
  )
}
