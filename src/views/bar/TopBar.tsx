import { useRef, useState } from 'react'
import type { ChangeEventHandler } from 'react'

import { format, getMessages } from '../../i18n'
import { MISSIONS } from '../../missions'
import { createEmptyProject, createId } from '../../model'
import type { PersistenceApi } from '../../persistence'
import type { RuntimeApi } from '../../runtime'
import {
  canRedo,
  canUndo,
  useEditorStore,
  usePreferencesStore,
  useProgressStore,
  useProjectStore,
  useRuntimeStore,
} from '../../store'
import type { FontScale } from '../../store'
import { findTemplate } from '../../templates'
import type { TemplateId } from '../../templates'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { Select } from '../../ui/Select'
import { MissionsDialog } from '../missions/MissionsDialog'
import { TemplatesDialog } from '../templates/TemplatesDialog'
import { PortfolioDialog } from './PortfolioDialog'

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
  const renameProject = useProjectStore((state) => state.renameProject)

  const setProjectId = useEditorStore((state) => state.setProjectId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const pushLog = useEditorStore((state) => state.pushLog)
  const clearLog = useEditorStore((state) => state.clearLog)
  const dirty = useEditorStore((state) => state.dirty)
  const setDirty = useEditorStore((state) => state.setDirty)
  const runtimeStatus = useRuntimeStore((state) => state.status)
  const warmup = useRuntimeStore((state) => state.warmup)
  const isRunning = runtimeStatus === 'loading' || runtimeStatus === 'running'
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)
  const fontScale = usePreferencesStore((state) => state.fontScale)
  const setFontScale = usePreferencesStore((state) => state.setFontScale)
  const completedMissions = useProgressStore((state) => state.completed)
  const projector = usePreferencesStore((state) => state.projector)
  const setProjector = usePreferencesStore((state) => state.setProjector)

  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const [missionsOpen, setMissionsOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(projectName)
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

  const handleDeliver = () => {
    persistence.deliver()
    pushLog(messages.activity.delivered)
  }

  const openRename = () => {
    setNameDraft(projectName)
    setRenameOpen(true)
  }

  const confirmRename = () => {
    renameProject(nameDraft.trim() || messages.dialog.untitledProject)
    setRenameOpen(false)
    pushLog(messages.activity.renamed)
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
    setPortfolioOpen(false)
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

  const handleTemplate = (id: TemplateId) => {
    setTemplatesOpen(false)
    guard(() => {
      const template = findTemplate(id)
      if (!template) return
      loadProject(template.build())
      setProjectId(createId('project'))
      selectObject(null)
      clearLog()
      setDirty(false)
      pushLog(messages.activity.templateLoaded)
    })
  }

  return (
    <header className="border-border bg-card flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex items-baseline gap-3">
        <span className="text-primary text-lg font-bold">{messages.app.name}</span>
        <button
          type="button"
          onClick={openRename}
          aria-label={messages.bar.renameProject}
          className="text-muted-foreground hover:text-foreground hidden max-w-40 truncate text-sm hover:underline sm:inline"
        >
          {projectName}
          {dirty ? ' •' : ''}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" onClick={handleNew}>
          {messages.bar.newProject}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPortfolioOpen(true)}
          disabled={!persistence.ready}
        >
          {messages.bar.portfolio}
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
        <Button variant="ghost" size="sm" onClick={handleDeliver}>
          {messages.bar.deliver}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
          {messages.bar.import}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleShare()}>
          {messages.bar.share}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setTemplatesOpen(true)}>
          {messages.bar.templates}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMissionsOpen(true)}>
          {format(messages.bar.missions, {
            done: completedMissions.length,
            total: MISSIONS.length,
          })}
        </Button>

        <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />

        <Button variant="ghost" size="sm" onClick={undo} disabled={!hasPast}>
          {messages.bar.undo}
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={!hasFuture}>
          {messages.bar.redo}
        </Button>
        {warmup === 'loading' && runtimeStatus === 'idle' ? (
          <span aria-live="polite" className="text-muted-foreground hidden text-xs sm:inline">
            {messages.bar.preparing}
          </span>
        ) : null}
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
          disabled={projector}
          onChange={(value) => setFontScale(value as FontScale)}
        />
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={projector}
          onClick={() => setProjector(!projector)}
        >
          {messages.bar.projector}
        </Button>
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

      <PortfolioDialog
        open={portfolioOpen}
        persistence={persistence}
        onClose={() => setPortfolioOpen(false)}
        onSelect={requestOpen}
      />

      <MissionsDialog open={missionsOpen} onClose={() => setMissionsOpen(false)} />

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelect={handleTemplate}
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
        open={renameOpen}
        title={messages.dialog.renameProjectTitle}
        confirmLabel={messages.bar.save}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setRenameOpen(false)}
        onConfirm={confirmRename}
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{messages.dialog.projectName}</span>
          <input
            autoFocus
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') confirmRename()
            }}
            className="border-border bg-background text-foreground w-full rounded-md border px-2 py-1 text-sm"
          />
        </label>
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
