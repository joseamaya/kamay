import { useEffect, useId, useRef, useState } from 'react'

import { format, getMessages } from '../../i18n'
import type { PersistenceApi, ProjectRecord } from '../../persistence'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'

export interface PortfolioDialogProps {
  open: boolean
  persistence: PersistenceApi
  onClose: () => void
  onSelect: (id: string) => void
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function PortfolioDialog({ open, persistence, onClose, onSelect }: PortfolioDialogProps) {
  const messages = getMessages()
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [records, setRecords] = useState<ProjectRecord[]>([])
  const [pendingDelete, setPendingDelete] = useState<ProjectRecord | null>(null)

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

  const confirmDelete = async () => {
    if (!pendingDelete) return
    await persistence.removeProject(pendingDelete.id)
    setPendingDelete(null)
    setRecords(await persistence.list())
  }

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
          {messages.dialog.portfolioTitle}
        </h2>
        {records.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">{messages.dialog.noProjects}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {records.map((record) => (
              <li key={record.id} className="border-border rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(record.id)}
                    className="flex-1 text-left text-sm hover:underline"
                  >
                    <span className="block font-medium">{record.name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {formatDate(record.updatedAt)}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => persistence.exportRecord(record)}
                  >
                    {messages.bar.export}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${messages.dialog.delete} ${record.name}`}
                    onClick={() => setPendingDelete(record)}
                  >
                    ×
                  </Button>
                </div>
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

      <Dialog
        open={pendingDelete !== null}
        title={messages.dialog.deleteProjectTitle}
        confirmLabel={messages.dialog.delete}
        cancelLabel={messages.dialog.cancel}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        {pendingDelete ? format(messages.dialog.deleteMessage, { name: pendingDelete.name }) : null}
      </Dialog>
    </div>
  )
}
