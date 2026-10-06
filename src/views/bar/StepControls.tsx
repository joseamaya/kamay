import { format, getMessages } from '../../i18n'
import type { RuntimeApi } from '../../runtime'
import { useRuntimeStore } from '../../store'
import { Button } from '../../ui/Button'

export interface StepControlsProps {
  runtime: RuntimeApi
}

export function StepControls({ runtime }: StepControlsProps) {
  const messages = getMessages()
  const stepMode = useRuntimeStore((state) => state.stepMode)
  const cursor = useRuntimeStore((state) => state.stepQueue.cursor)
  const total = useRuntimeStore((state) => state.stepQueue.steps.length)
  const hasSteps = total > 0

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={stepMode}
        onClick={() => (stepMode ? runtime.resume() : runtime.setStepMode(true))}
      >
        {messages.bar.stepMode}
      </Button>
      {stepMode && hasSteps ? (
        <>
          <Button variant="secondary" size="sm" disabled={cursor === 0} onClick={runtime.back}>
            {messages.bar.back}
          </Button>
          <input
            type="range"
            aria-label={messages.bar.timeline}
            min={0}
            max={total}
            value={cursor}
            onChange={(event) => runtime.seek(Number(event.target.value))}
            className="accent-primary h-1 w-28 cursor-pointer sm:w-40"
          />
          <Button variant="secondary" size="sm" disabled={cursor >= total} onClick={runtime.step}>
            {messages.bar.step}
          </Button>
          <span className="text-muted-foreground text-xs" aria-live="polite">
            {format(messages.bar.stepProgress, { index: Math.min(cursor + 1, total), total })}
          </span>
        </>
      ) : null}
    </>
  )
}
