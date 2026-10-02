import { getMessages } from '../../i18n'
import { Panel } from '../../ui/Panel'

export function FactoryView() {
  const messages = getMessages()

  return (
    <Panel title={messages.factory.title} className="min-h-0">
      <div className="text-muted-foreground flex h-full flex-col gap-2 text-sm">
        <p>{messages.factory.empty}</p>
        <p className="text-xs">{messages.factory.buildHint}</p>
      </div>
    </Panel>
  )
}
