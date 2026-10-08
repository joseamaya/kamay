import type { ReactNode } from 'react'

import { cn } from './cn'

export interface TooltipProps {
  label: string
  children: ReactNode
  className?: string
}

/** Wraps a trigger and shows its label on hover or keyboard focus. */
export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        aria-hidden="true"
        className="border-border bg-card text-card-foreground pointer-events-none absolute top-full left-1/2 z-50 mt-1 w-max max-w-[16rem] -translate-x-1/2 rounded-md border px-2 py-1 text-left text-xs font-normal opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
