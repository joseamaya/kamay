import { getMessages } from '../../i18n'
import type { ConceptId } from '../../pedagogy'
import { cn } from '../../ui/cn'
import { InfoIcon } from '../../ui/icons'
import { Tooltip } from '../../ui/Tooltip'

export interface ConceptTermProps {
  id: ConceptId
  /** Overrides the displayed term (the tooltip still uses the concept). */
  label?: string
  className?: string
}

/** A concept term with an info affordance that explains it on hover/focus. */
export function ConceptTerm({ id, label, className }: ConceptTermProps) {
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
    </span>
  )
}
