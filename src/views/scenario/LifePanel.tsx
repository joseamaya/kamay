import { format, getMessages } from '../../i18n'
import { useRuntimeLogStore } from '../../store'

type Value = number | string | boolean

function formatValue(value: Value, messages: ReturnType<typeof getMessages>): string {
  if (typeof value === 'boolean') return value ? messages.booleans.true : messages.booleans.false
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

/**
 * Traces the life of the objects: when each one is born, which methods are
 * called on it and how its state changes, in order. Initial state messages are
 * used to know the previous value but are not listed; a change is only shown
 * when it actually differs.
 */
export function LifePanel() {
  const messages = getMessages()
  const events = useRuntimeLogStore((state) => state.events)

  const entries: { key: string; text: string; tone: 'birth' | 'call' | 'state' }[] = []
  const previous: Record<string, Record<string, Value>> = {}

  events.forEach((event, index) => {
    if (event.type === 'created') {
      entries.push({
        key: `created:${event.id}:${index}`,
        text: format(messages.life.born, { name: event.name, className: event.className }),
        tone: 'birth',
      })
      return
    }
    if (event.type === 'call') {
      entries.push({
        key: `call:${event.id}:${event.method}:${index}`,
        text: format(messages.life.called, { name: event.name, method: event.method }),
        tone: 'call',
      })
      return
    }
    if (event.type !== 'state') return

    const current = previous[event.target] ?? {}
    const prior = current[event.name]
    previous[event.target] = { ...current, [event.name]: event.value }
    if (prior === undefined || prior === event.value) return
    entries.push({
      key: `state:${event.target}:${event.name}:${index}`,
      text: format(messages.life.changed, {
        target: event.target,
        name: event.name,
        before: formatValue(prior, messages),
        after: formatValue(event.value, messages),
      }),
      tone: 'state',
    })
  })

  if (entries.length === 0) return null

  return (
    <div
      data-life-panel
      className="pointer-events-auto absolute top-2 left-2 z-10 max-h-48 max-w-xs overflow-auto"
    >
      <div className="border-border bg-card text-card-foreground rounded-lg border p-3 shadow-lg">
        <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          {messages.life.title}
        </h3>
        <ol className="flex flex-col gap-1 text-xs">
          {entries.map((entry) => (
            <li
              key={entry.key}
              className={
                entry.tone === 'birth'
                  ? 'font-semibold'
                  : entry.tone === 'state'
                    ? 'text-muted-foreground'
                    : undefined
              }
            >
              <code className="font-mono">{entry.text}</code>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
