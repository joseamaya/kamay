import { format, getMessages } from '../../i18n'
import { LEVELS } from '../../levels'
import { useProgressStore } from '../../store'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'

export interface LevelsDialogProps {
  open: boolean
  onClose: () => void
}

export function LevelsDialog({ open, onClose }: LevelsDialogProps) {
  const messages = getMessages()
  const level = useProgressStore((state) => state.unlockedLevel)
  const freeMode = useProgressStore((state) => state.freeMode)
  const setFreeMode = useProgressStore((state) => state.setFreeMode)
  const completed = useProgressStore((state) => state.completed)
  const reset = useProgressStore((state) => state.reset)

  return (
    <Dialog
      open={open}
      title={messages.levels.title}
      confirmLabel={messages.dialog.accept}
      cancelLabel={messages.dialog.cancel}
      panelClassName="max-w-lg"
      onCancel={onClose}
      onConfirm={onClose}
    >
      <p className="text-foreground mb-3 font-medium">
        {format(messages.levels.button, { level })}
      </p>

      <ul className="flex flex-col gap-3">
        {LEVELS.map((definition) => {
          const label = messages.levels.list[definition.id as keyof typeof messages.levels.list]
          const isCurrent = !freeMode && definition.id === level
          const isDone = !freeMode && definition.id < level
          const isLocked = !freeMode && definition.id > level
          const status = isDone
            ? messages.levels.completed
            : isCurrent
              ? messages.levels.current
              : messages.levels.locked

          return (
            <li
              key={definition.id}
              className={cn('border-border rounded-md border p-3', isLocked && 'opacity-60')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground text-sm font-semibold">
                  {format(messages.levels.button, { level: definition.id })} · {label.title}
                </span>
                <span className="text-muted-foreground text-xs">{status}</span>
              </div>
              <p className="text-muted-foreground text-xs">{label.description}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {definition.missions.map((id) => {
                  const done = completed.includes(id)
                  return (
                    <li key={id} className="flex items-center gap-1 text-xs">
                      <span
                        aria-hidden="true"
                        className={done ? 'text-primary' : 'text-muted-foreground'}
                      >
                        {done ? '✓' : '○'}
                      </span>
                      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                        {messages.missions.list[id].title}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={freeMode}
          onClick={() => setFreeMode(!freeMode)}
        >
          {messages.levels.freeMode}
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          {messages.missions.reset}
        </Button>
      </div>
      {freeMode ? (
        <p className="text-muted-foreground mt-2 text-xs">{messages.levels.freeModeHint}</p>
      ) : null}
    </Dialog>
  )
}
