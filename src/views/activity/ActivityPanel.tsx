import { getMessages } from '../../i18n'

export function ActivityPanel() {
  const messages = getMessages()

  return (
    <footer className="border-border bg-card text-muted-foreground flex items-center gap-2 border-t px-4 py-1.5 text-xs">
      <span className="font-medium">{messages.activity.title}:</span>
      <span>{messages.activity.idle}</span>
    </footer>
  )
}
