import { format, getMessages } from '../../i18n'
import { MAX_LEVEL, nextMission } from '../../levels'
import {
  useActiveScene,
  useCapabilities,
  useEditorStore,
  useLevel,
  useProgressStore,
  useSelectedObject,
} from '../../store'

export function GuideBanner() {
  const messages = getMessages()
  const scene = useActiveScene()
  const object = useSelectedObject()
  const capabilities = useCapabilities()
  const level = useLevel()
  const freeMode = useProgressStore((state) => state.freeMode)
  const completed = useProgressStore((state) => state.completed)
  const revealedHints = useEditorStore((state) => state.revealedHints)
  const revealHint = useEditorStore((state) => state.revealHint)

  const levelInfo = messages.levels.list[level as keyof typeof messages.levels.list]
  const nextId = nextMission(completed, freeMode ? MAX_LEVEL : level)
  const nextHints = nextId ? messages.missions.list[nextId].hints : []
  const shownHints = nextId ? nextHints.slice(0, revealedHints[nextId] ?? 0) : []

  let hint: string = messages.guide.select
  if (!scene || scene.objects.length === 0) hint = messages.guide.noObjects
  else if (object)
    hint = capabilities.orders ? messages.guide.selected : messages.guide.selectedProperties
  if (nextId === 'own_class') hint = messages.guide.createClass

  return (
    <div className="border-border bg-card flex flex-col gap-1 border-b px-4 py-1.5 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{format(messages.guide.level, { level })}</span>
        <span className="text-muted-foreground">{levelInfo.title}</span>
        <span className="bg-border hidden h-4 w-px sm:block" aria-hidden="true" />
        <span>
          {nextId
            ? format(messages.guide.nextMission, { title: messages.missions.list[nextId].title })
            : messages.guide.allDone}
        </span>
        {nextId && shownHints.length < nextHints.length ? (
          <button
            type="button"
            onClick={() => revealHint(nextId)}
            className="text-primary hover:underline"
          >
            {messages.missions.hint}
          </button>
        ) : null}
        <span className="text-muted-foreground basis-full lg:ml-auto lg:basis-auto">{hint}</span>
      </div>
      {shownHints.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {shownHints.map((text) => (
            <li key={text} className="text-muted-foreground">
              {text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
