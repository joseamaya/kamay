import { getMessages } from '../../i18n'
import { useEditorStore } from '../../store'
import { cn } from '../../ui/cn'

export function ActivityPanel() {
  const messages = getMessages()
  const latest = useEditorStore((state) => state.log[0])

  return (
    <footer className="border-border bg-card flex items-center gap-2 border-t px-4 py-1.5 text-xs">
      <span className="font-medium">{messages.activity.title}:</span>
      <span
        className={cn('text-muted-foreground', latest?.level === 'error' && 'text-destructive')}
      >
        {latest ? latest.text : messages.activity.idle}
      </span>
    </footer>
  )
}
