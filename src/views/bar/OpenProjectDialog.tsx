import { useEffect, useId, useRef, useState } from 'react'

import { getMessages } from '../../i18n'
import type { PersistenceApi, ProjectRecord } from '../../persistence'
import { Button } from '../../ui/Button'

export interface OpenProjectDialogProps {
  open: boolean
  persistence: PersistenceApi
  onClose: () => void
  onSelect: (id: string) => void
}

export function OpenProjectDialog({
  open,
  persistence,
  onClose,
  onSelect,
}: OpenProjectDialogProps) {
  const messages = getMessages()
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [records, setRecords] = useState<ProjectRecord[]>([])

  useEffect(() => {
    if (open) containerRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    let active = true
    void persistence.list().then((items) => {
      if (active) setRecords(items)
    })
    return () => {
      active = false
    }
  }, [open, persistence])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-border bg-card text-card-foreground w-full max-w-md rounded-lg border p-4 shadow-lg focus:outline-none"
      >
        <h2 id={titleId} className="text-base font-semibold">
          {messages.dialog.openTitle}
        </h2>
        {records.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">{messages.dialog.noProjects}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {records.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => onSelect(record.id)}
                  className="border-border hover:bg-muted w-full rounded-md border px-3 py-2 text-left text-sm"
                >
                  {record.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {messages.dialog.cancel}
          </Button>
        </div>
      </div>
    </div>
  )
}
