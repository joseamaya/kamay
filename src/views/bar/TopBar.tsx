import { useRef, useState } from 'react'
import type { ChangeEventHandler } from 'react'

import { getMessages } from '../../i18n'
import { createEmptyProject, createId } from '../../model'
import type { PersistenceApi } from '../../persistence'
import type { RuntimeApi } from '../../runtime'
import { useEditorStore, useProjectStore } from '../../store'
import { findTemplate } from '../../templates'
import type { TemplateId } from '../../templates'
import { Dialog } from '../../ui/Dialog'
import { LevelsDialog } from '../levels/LevelsDialog'
import { MissionsDialog } from '../missions/MissionsDialog'
import { RubricDialog } from '../rubric/RubricDialog'
import { TeacherDialog } from '../teacher/TeacherDialog'
import { TemplatesDialog } from '../templates/TemplatesDialog'
import { MenuBar } from './MenuBar'
import { PortfolioDialog } from './PortfolioDialog'
import { Toolbar } from './Toolbar'

export interface TopBarProps {
  persistence: PersistenceApi
  runtime: RuntimeApi
}

export function TopBar({ persistence, runtime }: TopBarProps) {
  const messages = getMessages()
  const projectName = useProjectStore((state) => state.project.meta.name)
  const loadProject = useProjectStore((state) => state.loadProject)
  const renameProject = useProjectStore((state) => state.renameProject)

  const setProjectId = useEditorStore((state) => state.setProjectId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const pushLog = useEditorStore((state) => state.pushLog)
  const clearLog = useEditorStore((state) => state.clearLog)
  const dirty = useEditorStore((state) => state.dirty)
  const setDirty = useEditorStore((state) => state.setDirty)

  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const [missionsOpen, setMissionsOpen] = useState(false)
  const [levelsOpen, setLevelsOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [rubricOpen, setRubricOpen] = useState(false)
  const [teacherOpen, setTeacherOpen] = useState(false)
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
    <header className="border-border bg-card flex flex-col gap-1.5 border-b px-3 py-1.5">
      <MenuBar
        name={projectName}
        dirty={dirty}
        onRename={openRename}
        onNew={handleNew}
        onSave={() => void handleSave()}
        onPortfolio={() => setPortfolioOpen(true)}
        onImport={() => fileInputRef.current?.click()}
        onExport={handleExport}
        onDeliver={handleDeliver}
        onShare={() => void handleShare()}
        onTemplates={() => setTemplatesOpen(true)}
        onRubric={() => setRubricOpen(true)}
        onTeacher={() => setTeacherOpen(true)}
        onLevels={() => setLevelsOpen(true)}
        onMissions={() => setMissionsOpen(true)}
        canSave={persistence.ready}
      />

      <Toolbar
        runtime={runtime}
        onSave={() => void handleSave()}
        canSave={persistence.ready}
        onLevels={() => setLevelsOpen(true)}
        onMissions={() => setMissionsOpen(true)}
      />

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

      <LevelsDialog open={levelsOpen} onClose={() => setLevelsOpen(false)} />

      <MissionsDialog open={missionsOpen} onClose={() => setMissionsOpen(false)} />

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelect={handleTemplate}
      />

      <RubricDialog open={rubricOpen} onClose={() => setRubricOpen(false)} />

      <TeacherDialog open={teacherOpen} onClose={() => setTeacherOpen(false)} />

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
