import type { ReactNode } from 'react'

import { cn } from './cn'

export interface PanelProps {
  title?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, actions, className, children }: PanelProps) {
  return (
    <section
      className={cn(
        'border-border bg-card text-card-foreground flex flex-col overflow-hidden rounded-lg border',
        className,
      )}
    >
      {title ? (
        <header className="border-border flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>
          {actions}
        </header>
      ) : null}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </section>
  )
}
