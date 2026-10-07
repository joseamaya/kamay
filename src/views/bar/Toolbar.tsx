import { format, getMessages } from '../../i18n'
import { MISSIONS } from '../../missions'
import type { RuntimeApi } from '../../runtime'
import {
  canRedo,
  canUndo,
  useLevel,
  useProgressStore,
  useProjectStore,
  useRuntimeStore,
} from '../../store'
import { Button } from '../../ui/Button'
import { EditIcon, PlayIcon, RedoIcon, SaveIcon, StopIcon, UndoIcon } from '../../ui/icons'
import { IconButton } from '../../ui/IconButton'
import { StepControls } from './StepControls'

export interface ToolbarProps {
  runtime: RuntimeApi
  onSave: () => void
  canSave: boolean
  onLevels: () => void
  onMissions: () => void
}

export function Toolbar({ runtime, onSave, canSave, onLevels, onMissions }: ToolbarProps) {
  const messages = getMessages()
  const undo = useProjectStore((state) => state.undo)
  const redo = useProjectStore((state) => state.redo)
  const hasPast = useProjectStore(canUndo)
  const hasFuture = useProjectStore(canRedo)
  const runtimeStatus = useRuntimeStore((state) => state.status)
  const isRunning = runtimeStatus === 'loading' || runtimeStatus === 'running'
  const level = useLevel()
  const completedMissions = useProgressStore((state) => state.completed)

  return (
    <div className="flex flex-wrap items-center gap-1">
      <IconButton label={messages.bar.save} onClick={onSave} disabled={!canSave}>
        <SaveIcon />
      </IconButton>

      <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />

      <IconButton label={messages.bar.undo} onClick={undo} disabled={!hasPast}>
        <UndoIcon />
      </IconButton>
      <IconButton label={messages.bar.redo} onClick={redo} disabled={!hasFuture}>
        <RedoIcon />
      </IconButton>

      <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />

      <StepControls runtime={runtime} />
      {runtimeStatus === 'ready' ? (
        <IconButton label={messages.bar.reset} variant="secondary" onClick={runtime.stop}>
          <EditIcon />
        </IconButton>
      ) : null}
      {isRunning ? (
        <IconButton label={messages.bar.stop} variant="secondary" onClick={runtime.stop}>
          <StopIcon />
        </IconButton>
      ) : (
        <IconButton label={messages.bar.run} variant="primary" onClick={runtime.run}>
          <PlayIcon />
        </IconButton>
      )}

      <div className="flex-1" />

      <Button variant="ghost" size="sm" onClick={onLevels}>
        {format(messages.levels.button, { level })}
      </Button>
      <Button variant="ghost" size="sm" onClick={onMissions}>
        {format(messages.bar.missions, { done: completedMissions.length, total: MISSIONS.length })}
      </Button>
    </div>
  )
}
