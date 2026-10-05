import { useState } from 'react'

import { format, getMessages } from '../../i18n'
import { ACTOR_CATALOG, classInheritanceUsageCount, classUsageCount } from '../../model'
import type { ActorShape, CatalogItem, ClassDefinition } from '../../model'
import { useActiveScene, useCapabilities, useEditorStore, useProjectStore } from '../../store'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'
import { Panel } from '../../ui/Panel'
import { ClassEditorDialog } from '../classes/ClassEditorDialog'

const CLIP_PATHS: Partial<Record<ActorShape, string>> = {
  triangle: 'polygon(50% 0, 100% 100%, 0 100%)',
  diamond: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
  pentagon: 'polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)',
  hexagon: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)',
  star: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
}

function ShapePreview({ item }: { item: CatalogItem }) {
  if (item.kind === 'glyph') {
    return (
      <span className="flex h-6 w-6 items-center justify-center text-lg leading-none">
        {item.glyph}
      </span>
    )
  }
  const style = { backgroundColor: item.color }
  if (item.shape === 'heart') {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center text-lg leading-none"
        style={{ color: item.color }}
      >
        ♥
      </span>
    )
  }
  const clipPath = CLIP_PATHS[item.shape]
  if (clipPath) return <span className="h-6 w-6" style={{ ...style, clipPath }} />
  if (item.shape === 'rectangle') return <span className="h-4 w-6 rounded-sm" style={style} />
  if (item.shape === 'square') return <span className="h-6 w-6 rounded-sm" style={style} />
  return <span className="h-6 w-6 rounded-full" style={style} />
}

export function FactoryView() {
  const messages = getMessages()
  const scene = useActiveScene()
  const capabilities = useCapabilities()
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

  const catalogLabels: Record<string, string> = messages.catalog
  const catalogGroups = [
    {
      title: messages.factory.catalogVehicles,
      items: ACTOR_CATALOG.filter((item) => item.group === 'vehiculos'),
    },
    {
      title: messages.factory.catalogAnimals,
      items: ACTOR_CATALOG.filter((item) => item.group === 'animales'),
    },
    {
      title: messages.factory.catalogThings,
      items: ACTOR_CATALOG.filter((item) => item.group === 'cosas'),
    },
  ].filter((group) => group.items.length > 0)

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
        <div className="flex flex-col gap-3">
          {catalogGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                {group.title}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((item) => {
                  const label = catalogLabels[item.id] ?? item.className
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={format(messages.factory.addObject, { name: label })}
                      onClick={() => handleAdd(item)}
                      className="border-border hover:bg-muted focus-visible:ring-ring flex flex-col items-center gap-1 rounded-md border p-2 transition focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <ShapePreview item={item} />
                      <span className="text-xs">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {messages.factory.classesTitle}
            </h3>
            {capabilities.ownClasses ? (
              <button
                type="button"
                onClick={() => setEditorClass(null)}
                className="text-primary text-xs font-medium hover:underline"
              >
                {messages.factory.newClass}
              </button>
            ) : null}
          </div>
          {!capabilities.ownClasses ? (
            <p className="text-muted-foreground text-sm">
              {format(messages.levels.lockedHint, { level: 3 })}
            </p>
          ) : scene.classes.length === 0 ? (
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
                    aria-current={object.id === selectedObjectId ? 'true' : undefined}
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
