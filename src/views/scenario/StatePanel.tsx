import { getMessages } from '../../i18n'
import { useObservationsStore } from '../../store'

type Value = number | string | boolean

function formatValue(value: Value, messages: ReturnType<typeof getMessages>): string {
  if (typeof value === 'boolean') return value ? messages.booleans.true : messages.booleans.false
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

export function StatePanel() {
  const messages = getMessages()
  const values = useObservationsStore((state) => state.values)
  const before = useObservationsStore((state) => state.before)
  const order = useObservationsStore((state) => state.order)

  const rows: { key: string; label: string; before: string; after: string }[] = []

  for (const target of order) {
    const runtime = values[target]
    if (!runtime) continue
    const previous = before[target] ?? {}

    for (const [name, after] of Object.entries(runtime)) {
      const prior = previous[name] ?? after
      if (prior === after) continue
      rows.push({
        key: `${target}.${name}`,
        label: `${target}.${name}`,
        before: formatValue(prior, messages),
        after: formatValue(after, messages),
      })
    }
  }

  if (rows.length === 0) return null

  return (
    <div data-state-panel className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-xs">
      <div className="border-border bg-card text-card-foreground rounded-lg border p-3 shadow-lg">
        <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          {messages.pedagogy.concepts.state.title}
        </h3>
        <ul className="flex flex-col gap-1 text-xs">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-2">
              <code className="font-mono">{row.label}</code>
              <span className="text-muted-foreground">{row.before}</span>
              <span aria-hidden="true">→</span>
              <span className="font-semibold">{row.after}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
