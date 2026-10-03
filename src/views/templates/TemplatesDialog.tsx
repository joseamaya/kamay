import { getMessages } from '../../i18n'
import { TEMPLATES } from '../../templates'
import type { TemplateId } from '../../templates'
import { Dialog } from '../../ui/Dialog'

export interface TemplatesDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (id: TemplateId) => void
}

export function TemplatesDialog({ open, onClose, onSelect }: TemplatesDialogProps) {
  const messages = getMessages()

  return (
    <Dialog
      open={open}
      title={messages.templates.title}
      confirmLabel={messages.dialog.accept}
      cancelLabel={messages.dialog.cancel}
      panelClassName="max-w-md"
      onCancel={onClose}
      onConfirm={onClose}
    >
      <p className="mb-3">{messages.templates.description}</p>
      <ul className="flex flex-col gap-2">
        {TEMPLATES.map((template) => {
          const label = messages.templates.list[template.id]
          return (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => onSelect(template.id)}
                className="border-border hover:bg-muted focus-visible:ring-ring w-full rounded-md border p-3 text-left transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="text-foreground block text-sm font-semibold">{label.title}</span>
                <span className="block text-xs">{label.description}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </Dialog>
  )
}
