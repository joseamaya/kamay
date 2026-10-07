import { useState } from 'react'

import { format, getMessages } from '../../i18n'
import type { Scene } from '../../model'
import { useEditorStore, useProjectStore } from '../../store'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'
import { EditIcon, TrashIcon } from '../../ui/icons'
import { IconButton } from '../../ui/IconButton'

const INPUT_CLASS =
  'border-border bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none'

export function SceneManager() {
  const messages = getMessages()
  const scenes = useProjectStore((state) => state.project.scenes)
  const addScene = useProjectStore((state) => state.addScene)
  const renameScene = useProjectStore((state) => state.renameScene)
  const removeScene = useProjectStore((state) => state.removeScene)
  const activeSceneId = useEditorStore((state) => state.activeSceneId)
  const setActiveSceneId = useEditorStore((state) => state.setActiveSceneId)

  const [renaming, setRenaming] = useState<Scene | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Scene | null>(null)

  const activeId = activeSceneId ?? scenes[0]?.id ?? null
  const isLastScene = scenes.length <= 1

  const handleAdd = () => {
    setActiveSceneId(addScene())
  }

  const startRename = (scene: Scene) => {
    setRenaming(scene)
    setRenameValue(scene.name)
  }

  const confirmRename = () => {
    if (!renaming) return
    const name = renameValue.trim()
    if (name.length > 0) renameScene(renaming.id, name)
    setRenaming(null)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    removeScene(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {messages.factory.scenesTitle}
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="text-primary text-xs font-medium hover:underline"
        >
          {messages.factory.newScene}
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {scenes.map((scene) => (
          <li
            key={scene.id}
            className={cn(
              'border-border flex items-center gap-1 rounded-md border px-2 py-1',
              scene.id === activeId && 'border-primary bg-secondary',
            )}
          >
            <button
              type="button"
              aria-current={scene.id === activeId ? 'true' : undefined}
              onClick={() => setActiveSceneId(scene.id)}
              className="flex-1 truncate text-left text-sm"
            >
              {scene.name}
            </button>
            <IconButton
              label={format(messages.factory.editScene, { name: scene.name })}
              onClick={() => startRename(scene)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              label={format(messages.factory.deleteScene, { name: scene.name })}
              className="hover:text-destructive"
              onClick={() => setPendingDelete(scene)}
              disabled={isLastScene}
            >
              <TrashIcon />
            </IconButton>
          </li>
        ))}
      </ul>

      <Dialog
        open={renaming !== null}
        title={messages.dialog.renameSceneTitle}
        confirmLabel={messages.dialog.accept}
        cancelLabel={messages.dialog.cancel}
        confirmDisabled={renameValue.trim().length === 0}
        onCancel={() => setRenaming(null)}
        onConfirm={confirmRename}
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{messages.dialog.sceneName}</span>
          <input
            className={INPUT_CLASS}
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
          />
        </label>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        title={messages.dialog.deleteSceneTitle}
        confirmLabel={messages.dialog.delete}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      >
        {pendingDelete ? format(messages.dialog.deleteMessage, { name: pendingDelete.name }) : null}
      </Dialog>
    </div>
  )
}
