import { format, getMessages } from '../../i18n'
import { evaluateRubric } from '../../missions'
import type { RubricCriterionId, RubricStatus } from '../../missions'
import { useProjectStore } from '../../store'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'

const ORDER: RubricCriterionId[] = [
  'objects',
  'orders',
  'classes',
  'inheritance',
  'events',
  'sequences',
]

const STATUS_CLASS: Record<RubricStatus, string> = {
  none: 'bg-muted text-muted-foreground',
  partial: 'bg-secondary text-secondary-foreground',
  achieved: 'bg-primary text-primary-foreground',
}

export interface RubricDialogProps {
  open: boolean
  onClose: () => void
}

export function RubricDialog({ open, onClose }: RubricDialogProps) {
  const messages = getMessages()
  const project = useProjectStore((state) => state.project)

  if (!open) return null

  const entries = evaluateRubric(project)
  const achieved = entries.filter((entry) => entry.status === 'achieved').length

  return (
    <Dialog
      open
      title={messages.rubric.title}
      confirmLabel={messages.dialog.accept}
      cancelLabel={messages.dialog.cancel}
      panelClassName="max-w-lg"
      onConfirm={onClose}
      onCancel={onClose}
    >
      <p className="mb-2">{messages.rubric.description}</p>
      <p className="text-foreground mb-3 text-sm font-medium">
        {format(messages.rubric.progress, { achieved, total: entries.length })}
      </p>
      <ul className="flex flex-col gap-2">
        {ORDER.map((id) => {
          const entry = entries.find((candidate) => candidate.id === id)!
          const info = messages.rubric.criteria[id]
          return (
            <li
              key={id}
              className="border-border flex items-start justify-between gap-3 rounded-md border p-2"
            >
              <div>
                <p className="text-foreground text-sm font-medium">{info.title}</p>
                <p className="text-muted-foreground text-xs">{info.description}</p>
              </div>
              <span
                className={cn(
                  'flex-none rounded-full px-2 py-0.5 text-xs font-medium',
                  STATUS_CLASS[entry.status],
                )}
              >
                {messages.rubric.status[entry.status]}
              </span>
            </li>
          )
        })}
      </ul>
    </Dialog>
  )
}
