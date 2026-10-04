import { BACKGROUNDS } from '../../engine'
import { getMessages } from '../../i18n'
import { useActiveScene, useProgressStore, useProjectStore } from '../../store'
import { Button } from '../../ui/Button'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'
import { Select } from '../../ui/Select'
import { ScenarioCanvas } from './ScenarioCanvas'
import { WelcomeCard } from './WelcomeCard'

export function ScenarioView() {
  const messages = getMessages()
  const scene = useActiveScene()
  const setBackground = useProjectStore((state) => state.setBackground)
  const setPhysics = useProjectStore((state) => state.setPhysics)
  const onboardingDone = useProgressStore((state) => state.onboardingDone)

  const backgroundLabels: Record<string, string> = messages.backgrounds

  const options = BACKGROUNDS.map((background) => ({
    value: background.id,
    label: backgroundLabels[background.id] ?? background.id,
  }))

  const actions = scene ? (
    <Select
      ariaLabel={messages.scenario.background}
      value={scene.background}
      options={options}
      className="w-40"
      onChange={(value) => setBackground(scene.id, value)}
    />
  ) : null

  return (
    <Panel title={messages.scenario.title} actions={actions} className="min-h-0">
      <div className="flex h-full min-h-48 flex-col gap-2">
        {scene ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={scene.physics.enabled ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={scene.physics.enabled}
              onClick={() => setPhysics(scene.id, { enabled: !scene.physics.enabled })}
            >
              {messages.physics.toggle}
            </Button>
            {scene.physics.enabled ? (
              <NumberField
                label={messages.physics.gravity}
                value={scene.physics.gravityY}
                step={0.5}
                className="w-28"
                onChange={(value) => setPhysics(scene.id, { gravityY: value })}
              />
            ) : null}
          </div>
        ) : null}
        <div className="relative min-h-0 flex-1">
          <ScenarioCanvas />
          {scene && scene.objects.length === 0 ? (
            onboardingDone ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium">{messages.scenario.empty}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {messages.scenario.emptyHint}
                  </p>
                </div>
              </div>
            ) : (
              <WelcomeCard />
            )
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
