import { useEffect, useState } from 'react'

import { getMessages } from '../../i18n'
import type { PersistenceApi, ProjectRecord } from '../../persistence'
import { Button } from '../../ui/Button'

export interface OpenProjectDialogProps {
  open: boolean
  persistence: PersistenceApi
  onClose: () => void
  onOpened: () => void
}

export function OpenProjectDialog({
  open,
  persistence,
  onClose,
  onOpened,
}: OpenProjectDialogProps) {
  const messages = getMessages()
  const [records, setRecords] = useState<ProjectRecord[]>([])

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

  const handleOpen = async (id: string) => {
    await persistence.openProject(id)
    onOpened()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={messages.dialog.openTitle}
        className="border-border bg-card text-card-foreground w-full max-w-md rounded-lg border p-4 shadow-lg"
      >
        <h2 className="text-base font-semibold">{messages.dialog.openTitle}</h2>
        {records.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">{messages.dialog.noProjects}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {records.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => void handleOpen(record.id)}
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
