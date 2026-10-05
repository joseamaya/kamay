import { format, getMessages } from '../../i18n'
import { evaluateRubric } from '../../missions'
import type { RubricCriterionId, RubricStatus } from '../../missions'
import { findConcept } from '../../pedagogy'
import type { ConceptId } from '../../pedagogy'
import { useLevel, useProjectStore } from '../../store'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'

const ORDER: RubricCriterionId[] = [
  'objects',
  'orders',
  'classes',
  'state',
  'inheritance',
  'polymorphism',
  'composition',
  'events',
  'sequences',
]

const CRITERION_CONCEPT: Record<RubricCriterionId, ConceptId> = {
  objects: 'object',
  orders: 'method_call',
  classes: 'class',
  state: 'state',
  inheritance: 'inheritance',
  polymorphism: 'polymorphism',
  composition: 'composition',
  events: 'event',
  sequences: 'event',
}

const STATUS_CLASS: Record<RubricStatus, string> = {
  introduced: 'bg-muted text-muted-foreground',
  practiced: 'bg-secondary text-secondary-foreground',
  demonstrated: 'bg-primary text-primary-foreground',
}

export interface RubricDialogProps {
  open: boolean
  onClose: () => void
}

export function RubricDialog({ open, onClose }: RubricDialogProps) {
  const messages = getMessages()
  const project = useProjectStore((state) => state.project)
  const level = useLevel()

  if (!open) return null

  const entries = evaluateRubric(project)
  const demonstrated = entries.filter((entry) => entry.status === 'demonstrated').length

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
        {format(messages.rubric.progress, { demonstrated, total: entries.length })}
      </p>
      <ul className="flex flex-col gap-2">
        {ORDER.map((id) => {
          const entry = entries.find((candidate) => candidate.id === id)!
          const info = messages.rubric.criteria[id]
          const concept = findConcept(CRITERION_CONCEPT[id])
          const locked = entry.status === 'introduced' && concept != null && concept.level > level
          return (
            <li
              key={id}
              className={cn(
                'border-border flex items-start justify-between gap-3 rounded-md border p-2',
                locked && 'opacity-60',
              )}
            >
              <div>
                <p className="text-foreground text-sm font-medium">{info.title}</p>
                <p className="text-muted-foreground text-xs">{info.description}</p>
                {locked ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {format(messages.levels.lockedHint, { level: concept.level })}
                  </p>
                ) : null}
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
