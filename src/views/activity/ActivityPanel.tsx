import { getMessages } from '../../i18n'
import { translateRuntimeError } from '../../runtime'
import { useEditorStore, useRuntimeStore } from '../../store'
import { cn } from '../../ui/cn'

export function ActivityPanel() {
  const messages = getMessages()
  const latest = useEditorStore((state) => state.log[0])
  const status = useRuntimeStore((state) => state.status)
  const error = useRuntimeStore((state) => state.error)

  let text = latest ? latest.text : messages.activity.idle
  let isError = latest?.level === 'error'

  if (status === 'loading') text = messages.activity.loading
  else if (status === 'running') text = messages.activity.running
  else if (status === 'ready') text = messages.activity.ready

  if (error) {
    text = translateRuntimeError(error)
    isError = true
  }

  return (
    <footer className="border-border bg-card flex items-center gap-2 border-t px-4 py-1.5 text-xs">
      <span className="font-medium">{messages.activity.title}:</span>
      <span className={cn('text-muted-foreground', isError && 'text-destructive')}>{text}</span>
    </footer>
  )
}
