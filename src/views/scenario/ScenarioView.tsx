import { BACKGROUNDS } from '../../engine'
import { getMessages } from '../../i18n'
import { useActiveScene, useProjectStore } from '../../store'
import { Panel } from '../../ui/Panel'
import { Select } from '../../ui/Select'
import { ScenarioCanvas } from './ScenarioCanvas'

export function ScenarioView() {
  const messages = getMessages()
  const scene = useActiveScene()
  const setBackground = useProjectStore((state) => state.setBackground)

  const backgroundLabels: Record<string, string> = {
    grass: messages.backgrounds.grass,
    sky: messages.backgrounds.sky,
    sunset: messages.backgrounds.sunset,
    night: messages.backgrounds.night,
  }

  const options = BACKGROUNDS.map((background) => ({
    value: background.id,
    label: backgroundLabels[background.id] ?? background.id,
  }))

  const actions = scene ? (
    <Select
      label=""
      value={scene.background}
      options={options}
      className="w-40"
      onChange={(value) => setBackground(scene.id, value)}
    />
  ) : null

  return (
    <Panel title={messages.scenario.title} actions={actions} className="min-h-0">
      <div className="relative h-full min-h-48">
        <ScenarioCanvas />
        {scene && scene.objects.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium">{messages.scenario.empty}</p>
              <p className="text-muted-foreground mt-1 text-sm">{messages.scenario.emptyHint}</p>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}
