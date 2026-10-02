import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

import { Button } from './Button'
import { cn } from './cn'

export interface DialogProps {
  open: boolean
  title: string
  confirmLabel: string
  cancelLabel: string
  children?: ReactNode
  panelClassName?: string
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function Dialog({
  open,
  title,
  confirmLabel,
  cancelLabel,
  children,
  panelClassName,
  confirmDisabled,
  onConfirm,
  onCancel,
}: DialogProps) {
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) containerRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'border-border bg-card text-card-foreground flex max-h-[85vh] w-full max-w-sm flex-col rounded-lg border shadow-lg focus:outline-none',
          panelClassName,
        )}
      >
        <h2 id={titleId} className="flex-none px-4 pt-4 text-base font-semibold">
          {title}
        </h2>
        {children ? (
          <div className="text-muted-foreground min-h-0 flex-1 overflow-auto px-4 py-2 text-sm">
            {children}
          </div>
        ) : null}
        <div className="flex flex-none justify-end gap-2 px-4 pb-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
