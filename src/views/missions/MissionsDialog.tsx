import { getMessages } from '../../i18n'
import { BADGES, completedBadges, MISSIONS } from '../../missions'
import { useProgressStore } from '../../store'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'

export interface MissionsDialogProps {
  open: boolean
  onClose: () => void
}

export function MissionsDialog({ open, onClose }: MissionsDialogProps) {
  const messages = getMessages()
  const completed = useProgressStore((state) => state.completed)
  const reset = useProgressStore((state) => state.reset)
  const unlocked = completedBadges(completed)

  return (
    <Dialog
      open={open}
      title={messages.missions.title}
      confirmLabel={messages.dialog.accept}
      cancelLabel={messages.dialog.cancel}
      panelClassName="max-w-lg"
      onCancel={onClose}
      onConfirm={onClose}
    >
      <p className="text-foreground mb-3 font-medium">
        {completed.length} / {MISSIONS.length}
      </p>

      <h3 className="text-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {messages.missions.badgesTitle}
      </h3>
      <ul className="mb-4 flex flex-wrap gap-2">
        {BADGES.map((badge) => {
          const isUnlocked = unlocked.includes(badge.id)
          const label = messages.missions.badges[badge.id]
          return (
            <li
              key={badge.id}
              aria-label={`${label.title}: ${isUnlocked ? messages.missions.unlocked : messages.missions.locked}`}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-1 text-xs',
                isUnlocked
                  ? 'border-primary bg-secondary text-foreground'
                  : 'border-border text-muted-foreground opacity-60',
              )}
            >
              <span aria-hidden="true">{isUnlocked ? '★' : '☆'}</span>
              {label.title}
            </li>
          )
        })}
      </ul>

      <ul className="flex flex-col gap-3">
        {BADGES.map((badge) => (
          <li key={badge.id}>
            <h4 className="text-foreground text-sm font-semibold">
              {messages.missions.badges[badge.id].title}
            </h4>
            <ul className="mt-1 flex flex-col gap-1">
              {badge.missions.map((id) => {
                const done = completed.includes(id)
                const mission = messages.missions.list[id]
                return (
                  <li key={id} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className={done ? 'text-primary' : 'text-muted-foreground'}
                    >
                      {done ? '✓' : '○'}
                    </span>
                    <span>
                      <span
                        className={cn('block', done ? 'text-foreground' : 'text-muted-foreground')}
                      >
                        {mission.title}
                      </span>
                      <span className="text-xs">{mission.description}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={reset}>
          {messages.missions.reset}
        </Button>
      </div>
    </Dialog>
  )
}
