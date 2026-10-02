import { useState } from 'react'

import { format, getMessages } from '../../i18n'
import { ACTOR_CATALOG, classInheritanceUsageCount, classUsageCount } from '../../model'
import type { ActorShape, CatalogItem, ClassDefinition } from '../../model'
import { useActiveScene, useEditorStore, useProjectStore } from '../../store'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'
import { Panel } from '../../ui/Panel'
import { ClassEditorDialog } from '../classes/ClassEditorDialog'
import { SceneManager } from '../scenes/SceneManager'

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
  const duplicateObject = useProjectStore((state) => state.duplicateObject)
  const saveClass = useProjectStore((state) => state.saveClass)
  const removeClass = useProjectStore((state) => state.removeClass)
  const instantiateClass = useProjectStore((state) => state.instantiateClass)
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const pushLog = useEditorStore((state) => state.pushLog)

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingDeleteClass, setPendingDeleteClass] = useState<ClassDefinition | null>(null)
  const [blockedClass, setBlockedClass] = useState<{ name: string; reasons: string[] } | null>(null)
  const [editorClass, setEditorClass] = useState<ClassDefinition | null | undefined>(undefined)

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

  const handleInstantiate = (definition: ClassDefinition) => {
    instantiateClass(scene.id, definition.id)
    pushLog(messages.activity.objectAdded)
  }

  const requestDeleteClass = (definition: ClassDefinition) => {
    const reasons: string[] = []
    if (classUsageCount(scene, definition.name) > 0)
      reasons.push(messages.factory.deleteBlockedObjects)
    if (classInheritanceUsageCount(scene, definition.name) > 0) {
      reasons.push(messages.factory.deleteBlockedInherited)
    }
    if (reasons.length > 0) setBlockedClass({ name: definition.name, reasons })
    else setPendingDeleteClass(definition)
  }

  const confirmDeleteClass = () => {
    if (!pendingDeleteClass) return
    removeClass(scene.id, pendingDeleteClass.id)
    pushLog(messages.activity.classRemoved)
    setPendingDeleteClass(null)
  }

  return (
    <Panel title={messages.factory.title} className="min-h-0">
      <div className="flex h-full flex-col gap-4">
        <SceneManager />

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

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {messages.factory.classesTitle}
            </h3>
            <button
              type="button"
              onClick={() => setEditorClass(null)}
              className="text-primary text-xs font-medium hover:underline"
            >
              {messages.factory.newClass}
            </button>
          </div>
          {scene.classes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{messages.factory.noClasses}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {scene.classes.map((definition) => (
                <li
                  key={definition.id}
                  className="border-border flex items-center gap-1 rounded-md border px-2 py-1"
                >
                  <span className="flex-1 truncate text-sm">{definition.name}</span>
                  <button
                    type="button"
                    aria-label={format(messages.factory.newObjectOfClass, {
                      name: definition.name,
                    })}
                    onClick={() => handleInstantiate(definition)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-1.5 text-base leading-none"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label={format(messages.factory.editClass, { name: definition.name })}
                    onClick={() => setEditorClass(definition)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-1.5 text-sm leading-none"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    aria-label={format(messages.factory.deleteClass, { name: definition.name })}
                    onClick={() => requestDeleteClass(definition)}
                    className="text-muted-foreground hover:text-destructive rounded-md px-1.5 text-lg leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
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
                    aria-label={format(messages.factory.duplicateObject, { name: object.name })}
                    onClick={() => {
                      duplicateObject(scene.id, object.id)
                      pushLog(messages.activity.objectDuplicated)
                    }}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-1.5 text-sm leading-none"
                  >
                    ⧉
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

      <Dialog
        open={pendingDeleteClass !== null}
        title={messages.dialog.deleteClassTitle}
        confirmLabel={messages.dialog.delete}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setPendingDeleteClass(null)}
        onConfirm={confirmDeleteClass}
      >
        {pendingDeleteClass
          ? format(messages.dialog.deleteMessage, { name: pendingDeleteClass.name })
          : null}
      </Dialog>

      <Dialog
        open={blockedClass !== null}
        title={messages.dialog.deleteClassTitle}
        confirmLabel={messages.dialog.accept}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setBlockedClass(null)}
        onConfirm={() => setBlockedClass(null)}
      >
        {blockedClass
          ? format(messages.factory.deleteBlocked, {
              name: blockedClass.name,
              reasons: blockedClass.reasons.join(' y '),
            })
          : null}
      </Dialog>

      {editorClass !== undefined ? (
        <ClassEditorDialog
          scene={scene}
          initial={editorClass}
          onClose={() => setEditorClass(undefined)}
          onSave={(definition) => {
            saveClass(scene.id, definition)
            pushLog(messages.activity.classSaved)
            setEditorClass(undefined)
          }}
        />
      ) : null}
    </Panel>
  )
}
