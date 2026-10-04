import { format, getMessages } from '../../i18n'
import { useActiveScene, useLevel, useSelectedObject } from '../../store'
import { Panel } from '../../ui/Panel'

export function GuidePanel() {
  const messages = getMessages()
  const scene = useActiveScene()
  const object = useSelectedObject()
  const level = useLevel()

  const levelInfo = messages.levels.list[level as 1 | 2 | 3 | 4 | 5]

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
        <p className="border-border border-t pt-3 text-sm">{hint}</p>
      </div>
    </Panel>
  )
}
