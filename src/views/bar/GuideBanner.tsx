import { format, getMessages } from '../../i18n'
import { MISSIONS } from '../../missions'
import { useActiveScene, useLevel, useProgressStore, useSelectedObject } from '../../store'

export function GuideBanner() {
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
    <div className="border-border bg-card flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-1.5 text-xs">
      <span className="font-semibold">{format(messages.guide.level, { level })}</span>
      <span className="text-muted-foreground">{levelInfo.title}</span>
      <span className="bg-border hidden h-4 w-px sm:block" aria-hidden="true" />
      <span>
        {next
          ? format(messages.guide.nextMission, { title: messages.missions.list[next.id].title })
          : messages.guide.allDone}
      </span>
      <span className="text-muted-foreground ml-auto hidden lg:inline">{hint}</span>
    </div>
  )
}
