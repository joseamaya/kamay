import { getMessages } from '../../i18n'
import { canRedo, canUndo, useProjectStore } from '../../store'
import { Button } from '../../ui/Button'

export function TopBar() {
  const messages = getMessages()
  const undo = useProjectStore((state) => state.undo)
  const redo = useProjectStore((state) => state.redo)
  const hasPast = useProjectStore(canUndo)
  const hasFuture = useProjectStore(canRedo)
  const projectName = useProjectStore((state) => state.project.meta.name)

  return (
    <header className="border-border bg-card flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-baseline gap-3">
        <span className="text-primary text-lg font-bold">{messages.app.name}</span>
        <span className="text-muted-foreground hidden text-sm sm:inline">{projectName}</span>
      </div>

      <div className="flex items-center gap-2">
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
    </header>
  )
}
