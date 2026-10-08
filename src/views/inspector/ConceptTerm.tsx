import { getMessages } from '../../i18n'
import type { RubricStatus } from '../../missions'
import type { ConceptId } from '../../pedagogy'
import { cn } from '../../ui/cn'
import { InfoIcon } from '../../ui/icons'
import { Tooltip } from '../../ui/Tooltip'

const STATUS_CLASS: Record<RubricStatus, string> = {
  introduced: 'bg-muted text-muted-foreground',
  practiced: 'bg-secondary text-secondary-foreground',
  demonstrated: 'bg-primary text-primary-foreground',
}

export interface ConceptTermProps {
  id: ConceptId
  /** Overrides the displayed term (the tooltip still uses the concept). */
  label?: string
  /** Rubric progress for the concept, shown as a small badge. */
  status?: RubricStatus | null
  className?: string
}

/** A concept term with an info affordance that explains it on hover/focus. */
export function ConceptTerm({ id, label, status, className }: ConceptTermProps) {
  const messages = getMessages()
  const concept = messages.pedagogy.concepts[id]

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {label ?? concept.title}
      <Tooltip label={concept.description}>
        <button
          type="button"
          aria-label={concept.description}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex rounded-full focus-visible:ring-2 focus-visible:outline-none"
        >
          <InfoIcon size={12} />
        </button>
      </Tooltip>
      {status ? (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium normal-case',
            STATUS_CLASS[status],
          )}
        >
          {messages.rubric.status[status]}
        </span>
      ) : null}
    </span>
  )
}
