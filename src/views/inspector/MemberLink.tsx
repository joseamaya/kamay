import type { ReactNode } from 'react'

import { getMessages } from '../../i18n'
import { memberKey, useEditorStore } from '../../store'
import type { MemberRef } from '../../store'
import { cn } from '../../ui/cn'

export interface MemberLinkProps {
  member: MemberRef
  children: ReactNode
  /** Accessible name; defaults to the "show in code" hint. */
  label?: string
  /** Renders muted until active; useful for icon links next to editable fields. */
  muted?: boolean
  className?: string
}

/** A control that links a model member to its location in the generated code. */
export function MemberLink({ member, children, label, muted, className }: MemberLinkProps) {
  const messages = getMessages()
  const highlighted = useEditorStore((state) => state.highlightedMember)
  const setHighlightedMember = useEditorStore((state) => state.setHighlightedMember)
  const active = highlighted !== null && memberKey(highlighted) === memberKey(member)

  return (
    <button
      type="button"
      aria-label={label ?? messages.code.showInCode}
      aria-pressed={active}
      onClick={() => setHighlightedMember(active ? null : member)}
      className={cn(
        'focus-visible:ring-ring rounded-sm text-left transition focus-visible:ring-2 focus-visible:outline-none',
        muted && !active && 'text-muted-foreground',
        active ? 'text-primary font-semibold' : 'hover:text-primary',
        className,
      )}
    >
      {children}
    </button>
  )
}
