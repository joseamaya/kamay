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
  const close = usePredictionStore((state) => state.close)

  if (!pending) return null

  const prediction = messages.pedagogy.prediction
  const values = {
    object: pending.objectName,
    sibling: pending.siblingName,
    attribute: pending.attribute,
    value: formatValue(pending.newValue, messages),
  }
  const siblingValue = formatValue(pending.siblingValue, messages)

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
          <p>{format(prediction.question, values)}</p>
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
        <p>
          {outcome === 'correct'
            ? format(prediction.correct, values)
            : outcome === 'misconception'
              ? format(prediction.sharedState, values)
              : format(prediction.explained, values)}
        </p>
      )}
    </Dialog>
  )
}
