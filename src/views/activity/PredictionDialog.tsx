import { format, getMessages } from '../../i18n'
import { usePredictionStore } from '../../store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'

function formatValue(value: number | string | boolean, messages: ReturnType<typeof getMessages>) {
  if (typeof value === 'boolean') return value ? messages.booleans.true : messages.booleans.false
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

export function PredictionDialog() {
  const messages = getMessages()
  const pending = usePredictionStore((state) => state.pending)
  const outcome = usePredictionStore((state) => state.outcome)
  const answer = usePredictionStore((state) => state.answer)
  const retry = usePredictionStore((state) => state.retry)
  const close = usePredictionStore((state) => state.close)

  if (!pending) return null

  const prediction = messages.pedagogy.prediction
  const values = {
    object: pending.objectName,
    sibling: pending.siblingName,
    attribute: pending.attribute,
    value: formatValue(pending.newValue, messages),
    via: pending.siblingAttribute ?? '',
  }
  const siblingValue = formatValue(pending.siblingValue, messages)
  const shared = prediction.shared
  const question = pending.kind === 'shared' ? shared.question : prediction.question
  const correctText = pending.kind === 'shared' ? shared.correct : prediction.correct
  const misconceptionText =
    pending.kind === 'shared' ? shared.misconception : prediction.sharedState
  const explainedText = pending.kind === 'shared' ? shared.explained : prediction.explained

  return (
    <Dialog
      open
      title={prediction.title}
      confirmLabel={prediction.accept}
      cancelLabel={prediction.later}
      confirmDisabled={outcome === null}
      onConfirm={close}
      onCancel={close}
    >
      {outcome === null ? (
        <div className="flex flex-col gap-3">
          <p>{format(question, values)}</p>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="sm" onClick={() => answer('changed')}>
              {format(prediction.optionChanged, { value: values.value })}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => answer('unchanged')}>
              {format(prediction.optionUnchanged, { value: siblingValue })}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => answer('unknown')}>
              {prediction.optionUnknown}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p>
            {outcome === 'correct'
              ? format(correctText, values)
              : outcome === 'misconception'
                ? format(misconceptionText, values)
                : format(explainedText, values)}
          </p>
          {outcome === 'misconception' ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={retry}>
              {prediction.retry}
            </Button>
          ) : null}
        </div>
      )}
    </Dialog>
  )
}
