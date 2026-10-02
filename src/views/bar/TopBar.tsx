import { useRef, useState } from 'react'
import type { ChangeEventHandler } from 'react'

import { getMessages } from '../../i18n'
import { createEmptyProject, createId } from '../../model'
import type { PersistenceApi } from '../../persistence'
import { canRedo, canUndo, useEditorStore, useProjectStore } from '../../store'
import { Button } from '../../ui/Button'
import { OpenProjectDialog } from './OpenProjectDialog'

export interface TopBarProps {
  persistence: PersistenceApi
}

export function TopBar({ persistence }: TopBarProps) {
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

  const [openDialog, setOpenDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleNew = () => {
    loadProject(createEmptyProject())
    setProjectId(createId('project'))
    selectObject(null)
    clearLog()
  }

  const handleSave = async () => {
    try {
      await persistence.save()
      pushLog(messages.activity.saved)
    } catch {
      pushLog(messages.errors.save, 'error')
    }
  }

  const handleExport = () => {
    persistence.exportFile()
    pushLog(messages.activity.exported)
  }

  const handleImportFile: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await persistence.importFile(file)
      pushLog(messages.activity.imported)
    } catch {
      pushLog(messages.errors.import, 'error')
    }
  }

  return (
    <header className="border-border bg-card flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex items-baseline gap-3">
        <span className="text-primary text-lg font-bold">{messages.app.name}</span>
        <span className="text-muted-foreground hidden text-sm sm:inline">{projectName}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" onClick={handleNew}>
          {messages.bar.newProject}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpenDialog(true)}>
          {messages.bar.open}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleSave()}>
          {messages.bar.save}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          {messages.bar.export}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
          {messages.bar.import}
        </Button>

        <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />

        <Button variant="ghost" size="sm" onClick={undo} disabled={!hasPast}>
          {messages.bar.undo}
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={!hasFuture}>
          {messages.bar.redo}
        </Button>
        <Button variant="secondary" size="sm" disabled title={messages.bar.runSoon}>
          {messages.bar.run}
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
        onOpened={() => {
          setOpenDialog(false)
          selectObject(null)
          pushLog(messages.activity.opened)
        }}
      />
    </header>
  )
}
