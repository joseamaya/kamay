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
