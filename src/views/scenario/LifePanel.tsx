import { format, getMessages } from '../../i18n'
import { useRuntimeLogStore } from '../../store'

/**
 * Traces the life of the objects: when each one is born and which methods are
 * called on it, in order. It only reads the domain events of the current run.
 */
export function LifePanel() {
  const messages = getMessages()
  const events = useRuntimeLogStore((state) => state.events)

  const entries: { key: string; text: string }[] = []
  events.forEach((event, index) => {
    if (event.type === 'created') {
      entries.push({
        key: `created:${event.id}:${index}`,
        text: format(messages.life.born, { name: event.name, className: event.className }),
      })
    } else if (event.type === 'call') {
      entries.push({
        key: `call:${event.id}:${event.method}:${index}`,
        text: format(messages.life.called, { name: event.name, method: event.method }),
      })
    }
  })

  if (entries.length === 0) return null

  return (
    <div data-life-panel className="pointer-events-none absolute top-2 left-2 z-10 max-w-xs">
      <div className="border-border bg-card text-card-foreground rounded-lg border p-3 shadow-lg">
        <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          {messages.life.title}
        </h3>
        <ol className="flex flex-col gap-1 text-xs">
          {entries.map((entry) => (
            <li key={entry.key}>
              <code className="font-mono">{entry.text}</code>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
