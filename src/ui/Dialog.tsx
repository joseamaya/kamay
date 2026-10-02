import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

import { Button } from './Button'

export interface DialogProps {
  open: boolean
  title: string
  confirmLabel: string
  cancelLabel: string
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function Dialog({
  open,
  title,
  confirmLabel,
  cancelLabel,
  children,
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
        className="border-border bg-card text-card-foreground w-full max-w-sm rounded-lg border p-4 shadow-lg focus:outline-none"
      >
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        {children ? <div className="text-muted-foreground mt-2 text-sm">{children}</div> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
