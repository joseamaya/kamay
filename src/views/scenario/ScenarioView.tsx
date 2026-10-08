import { getMessages } from '../../i18n'
import { useActiveScene, useProgressStore } from '../../store'
import { Panel } from '../../ui/Panel'
import { ScenarioCanvas } from './ScenarioCanvas'
import { StatePanel } from './StatePanel'
import { WelcomeCard } from './WelcomeCard'

export function ScenarioView() {
  const messages = getMessages()
  const scene = useActiveScene()
  const onboardingDone = useProgressStore((state) => state.onboardingDone)

  return (
    <Panel title={messages.scenario.title} className="min-h-0">
      <div className="relative h-full min-h-48">
        <ScenarioCanvas />
        <StatePanel />
        {scene && scene.objects.length === 0 ? (
          onboardingDone ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium">{messages.scenario.empty}</p>
                <p className="text-muted-foreground mt-1 text-sm">{messages.scenario.emptyHint}</p>
              </div>
            </div>
          ) : (
            <WelcomeCard />
          )
        ) : null}
      </div>
    </Panel>
  )
}
