import { getMessages } from '../../i18n'
import { Panel } from '../../ui/Panel'

export function ScenarioView() {
  const messages = getMessages()

  return (
    <Panel title={messages.scenario.title} className="min-h-0">
      <div className="border-border bg-muted/40 flex h-full min-h-48 items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <p className="text-sm font-medium">{messages.scenario.empty}</p>
          <p className="text-muted-foreground mt-1 text-sm">{messages.scenario.emptyHint}</p>
        </div>
      </div>
    </Panel>
  )
}
