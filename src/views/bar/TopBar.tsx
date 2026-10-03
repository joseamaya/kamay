import { useRef, useState } from 'react'
import type { ChangeEventHandler } from 'react'

import { getMessages } from '../../i18n'
import { createEmptyProject, createId } from '../../model'
import type { PersistenceApi } from '../../persistence'
import type { RuntimeApi } from '../../runtime'
import {
  canRedo,
  canUndo,
  useEditorStore,
  usePreferencesStore,
  useProjectStore,
  useRuntimeStore,
} from '../../store'
import type { FontScale } from '../../store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { Select } from '../../ui/Select'
import { OpenProjectDialog } from './OpenProjectDialog'

export interface TopBarProps {
  persistence: PersistenceApi
  runtime: RuntimeApi
}

export function TopBar({ persistence, runtime }: TopBarProps) {
  const messages = getMessages()
  const undo = useProjectStore((state) => state.undo)
  const redo = useProjectStore((state) => state.redo)
  const hasPast = useProjectStore(canUndo)
  const hasFuture = useProjectStore(canRedo)
  const projectName = useProjectStore((state) => state.project.meta.name)
  const loadProject = useProjectStore((state) => state.loadProject)

  const setProjectId = useEditorStore((state) => state.setProjectId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const pushLog = useEditorStore((state) => state.pushLog)
  const clearLog = useEditorStore((state) => state.clearLog)
  const dirty = useEditorStore((state) => state.dirty)
  const setDirty = useEditorStore((state) => state.setDirty)
  const runtimeStatus = useRuntimeStore((state) => state.status)
  const isRunning = runtimeStatus === 'loading' || runtimeStatus === 'running'
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)
  const fontScale = usePreferencesStore((state) => state.fontScale)
  const setFontScale = usePreferencesStore((state) => state.setFontScale)

  const [openDialog, setOpenDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const guard = (run: () => void) => {
    if (dirty) setPendingAction(() => run)
    else run()
  }

  const handleNew = () =>
    guard(() => {
      loadProject(createEmptyProject())
      setProjectId(createId('project'))
      selectObject(null)
      clearLog()
      setDirty(false)
    })

  const handleSave = async () => {
    const saved = await persistence.save()
    if (saved) {
      setDirty(false)
      pushLog(messages.activity.saved)
    } else {
      pushLog(messages.errors.save, 'error')
    }
  }

  const handleExport = () => {
    persistence.exportFile()
    pushLog(messages.activity.exported)
  }

  const handleShare = async () => {
    try {
      setShareLink(await persistence.shareLink())
    } catch {
      pushLog(messages.errors.share, 'error')
    }
  }

  const handleCopyShare = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      pushLog(messages.share.copied)
    } catch {
      pushLog(messages.share.copyError, 'error')
    }
    setShareLink(null)
  }

  const requestOpen = (id: string) => {
    setOpenDialog(false)
    guard(() => {
      void persistence.openProject(id).then(() => {
        selectObject(null)
        setDirty(false)
        pushLog(messages.activity.opened)
      })
    })
  }

  const handleImportFile: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    guard(() => {
      void persistence
        .importFile(file)
        .then(() => {
          setDirty(false)
          pushLog(messages.activity.imported)
        })
        .catch(() => pushLog(messages.errors.import, 'error'))
    })
  }

  return (
    <header className="border-border bg-card flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex items-baseline gap-3">
        <span className="text-primary text-lg font-bold">{messages.app.name}</span>
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {projectName}
          {dirty ? ' •' : ''}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" onClick={handleNew}>
          {messages.bar.newProject}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpenDialog(true)}
          disabled={!persistence.ready}
        >
          {messages.bar.open}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleSave()}
          disabled={!persistence.ready}
        >
          {messages.bar.save}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          {messages.bar.export}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
          {messages.bar.import}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleShare()}>
          {messages.bar.share}
        </Button>

        <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />

        <Button variant="ghost" size="sm" onClick={undo} disabled={!hasPast}>
          {messages.bar.undo}
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={!hasFuture}>
          {messages.bar.redo}
        </Button>
        {isRunning ? (
          <Button variant="secondary" size="sm" onClick={runtime.stop}>
            {messages.bar.stop}
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={runtime.run}>
            {messages.bar.run}
          </Button>
        )}

        <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />

        <Select
          ariaLabel={messages.bar.textSize}
          value={fontScale}
          options={[
            { value: 'normal', label: messages.bar.textNormal },
            { value: 'large', label: messages.bar.textLarge },
            { value: 'xlarge', label: messages.bar.textXLarge },
          ]}
          className="w-28"
          onChange={(value) => setFontScale(value as FontScale)}
        />
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={theme === 'dark'}
          aria-label={messages.bar.toggleTheme}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? messages.bar.themeDark : messages.bar.themeLight}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <OpenProjectDialog
        open={openDialog}
        persistence={persistence}
        onClose={() => setOpenDialog(false)}
        onSelect={requestOpen}
      />

      <Dialog
        open={shareLink !== null}
        title={messages.share.title}
        confirmLabel={messages.share.copy}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setShareLink(null)}
        onConfirm={() => void handleCopyShare()}
      >
        <p className="mb-2">{messages.share.description}</p>
        <input
          readOnly
          aria-label={messages.share.link}
          value={shareLink ?? ''}
          onFocus={(event) => event.currentTarget.select()}
          className="border-border bg-background text-foreground w-full rounded-md border px-2 py-1 text-xs"
        />
      </Dialog>

      <Dialog
        open={pendingAction !== null}
        title={messages.dialog.unsavedTitle}
        confirmLabel={messages.dialog.continue}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          const action = pendingAction
          setPendingAction(null)
          action?.()
        }}
      >
        {messages.dialog.unsavedMessage}
      </Dialog>
    </header>
  )
}
