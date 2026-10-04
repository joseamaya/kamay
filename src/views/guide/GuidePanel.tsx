import { format, getMessages } from '../../i18n'
import { MISSIONS } from '../../missions'
import { useActiveScene, useLevel, useProgressStore, useSelectedObject } from '../../store'
import { Panel } from '../../ui/Panel'

export function GuidePanel() {
  const messages = getMessages()
  const scene = useActiveScene()
  const object = useSelectedObject()
  const level = useLevel()
  const completed = useProgressStore((state) => state.completed)

  const levelInfo = messages.levels.list[level as 1 | 2 | 3 | 4 | 5]
  const next = MISSIONS.find((mission) => !completed.includes(mission.id))

  let hint: string = messages.guide.select
  if (!scene || scene.objects.length === 0) hint = messages.guide.noObjects
  else if (object) hint = messages.guide.selected

  return (
    <Panel title={messages.guide.title} className="min-h-0">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {format(messages.guide.level, { level })}
          </p>
          <p className="text-sm font-medium">{levelInfo.title}</p>
          <p className="text-muted-foreground text-xs">{levelInfo.description}</p>
        </div>

        <div className="border-border border-t pt-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {messages.missions.title}
          </p>
          <p className="text-sm">
            {next
              ? format(messages.guide.nextMission, {
                  title: messages.missions.list[next.id].title,
                })
              : messages.guide.allDone}
          </p>
          {next ? (
            <p className="text-muted-foreground text-xs">
              {messages.missions.list[next.id].description}
            </p>
          ) : null}
        </div>

        <p className="border-border border-t pt-3 text-sm">{hint}</p>
      </div>
    </Panel>
  )
}
