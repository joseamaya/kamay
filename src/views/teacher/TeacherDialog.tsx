import { useEffect, useRef, useState } from 'react'
import type { ChangeEventHandler } from 'react'

import { format, getMessages } from '../../i18n'
import { parseDelivery } from '../../persistence'
import type { Delivery } from '../../persistence'
import { aggregateDeliveries } from '../../teacher'
import { useTeacherStore } from '../../store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'

export interface TeacherDialogProps {
  open: boolean
  onClose: () => void
}

function deliverySummary(delivery: Delivery) {
  const demonstrated = delivery.rubric.filter((entry) => entry.status === 'demonstrated').length
  const predictions = Object.values(delivery.evidence.predictions).reduce(
    (totals, tally) => ({
      correct: totals.correct + tally.correct,
      total: totals.total + tally.correct + tally.misconception + tally.explained,
    }),
    { correct: 0, total: 0 },
  )
  return { missions: delivery.missions.completed.length, demonstrated, predictions }
}

export function TeacherDialog({ open, onClose }: TeacherDialogProps) {
  const messages = getMessages()
  const deliveries = useTeacherStore((state) => state.deliveries)
  const hydrate = useTeacherStore((state) => state.hydrate)
  const add = useTeacherStore((state) => state.add)
  const remove = useTeacherStore((state) => state.remove)
  const clear = useTeacherStore((state) => state.clear)
  const [invalid, setInvalid] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) void hydrate()
  }, [open, hydrate])

  if (!open) return null

  const report = aggregateDeliveries(deliveries.map((record) => record.delivery))

  const handleFiles: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    const parsed = await Promise.all(
      files.map(async (file) => {
        try {
          return parseDelivery(JSON.parse(await file.text()))
        } catch {
          return null
        }
      }),
    )
    const valid = parsed.filter((delivery): delivery is Delivery => delivery !== null)
    setInvalid(valid.length < parsed.length)
    if (valid.length > 0) void add(valid)
  }

  return (
    <Dialog
      open
      title={messages.teacher.title}
      confirmLabel={messages.dialog.accept}
      cancelLabel={messages.dialog.cancel}
      panelClassName="max-w-lg"
      onConfirm={onClose}
      onCancel={onClose}
    >
      <p className="mb-2">{messages.teacher.description}</p>
      <div className="mb-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          {messages.teacher.import}
        </Button>
        {deliveries.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => void clear()}>
            {messages.teacher.clear}
          </Button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        multiple
        aria-label={messages.teacher.import}
        className="hidden"
        onChange={handleFiles}
      />

      {invalid ? <p className="text-destructive mb-2 text-xs">{messages.teacher.invalid}</p> : null}

      {deliveries.length === 0 ? (
        <p className="text-muted-foreground text-sm">{messages.teacher.empty}</p>
      ) : (
        <>
          <p className="text-foreground mb-3 text-sm font-medium">
            {format(messages.teacher.count, { count: deliveries.length })}
          </p>

          <h3 className="text-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            {messages.teacher.concepts}
          </h3>
          <ul className="mb-3 flex flex-col gap-1 text-xs">
            {report.concepts.map((concept) => (
              <li key={concept.id} className="flex items-center justify-between gap-2">
                <span>{messages.rubric.criteria[concept.id].title}</span>
                <span className="text-muted-foreground">
                  {messages.rubric.status.demonstrated}: {concept.demonstrated} ·{' '}
                  {messages.rubric.status.practiced}: {concept.practiced} ·{' '}
                  {messages.rubric.status.introduced}: {concept.introduced}
                </span>
              </li>
            ))}
          </ul>

          <p className="mb-1 text-xs">{format(messages.teacher.predictions, report.predictions)}</p>
          <p className="mb-3 text-xs">
            {format(messages.teacher.missions, { count: report.missionsCompleted })}
          </p>

          {report.misconceptions.length > 0 ? (
            <>
              <h3 className="text-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                {messages.teacher.misconceptions}
              </h3>
              <ul className="mb-3 flex flex-col gap-1 text-xs">
                {report.misconceptions.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <span>{messages.pedagogy.misconceptions[item.id].title}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {report.errors.length > 0 ? (
            <>
              <h3 className="text-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                {messages.teacher.errors}
              </h3>
              <ul className="mb-3 flex flex-col gap-1 text-xs">
                {report.errors.map((item) => (
                  <li key={item.kind} className="flex items-center justify-between gap-2">
                    <span className="font-mono">{item.kind}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <ul className="flex flex-col gap-1">
            {deliveries.map((record) => {
              const { delivery } = record
              const summary = deliverySummary(delivery)
              return (
                <li
                  key={record.id}
                  className="border-border flex flex-col gap-1 rounded-md border px-2 py-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{delivery.project.meta.name}</span>
                    <span className="text-muted-foreground">
                      {delivery.exportedAt.slice(0, 10)}
                    </span>
                    <button
                      type="button"
                      aria-label={`${messages.teacher.remove}: ${delivery.project.meta.name}`}
                      onClick={() => void remove(record.id)}
                      className="text-muted-foreground hover:text-destructive px-1 text-base leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-muted-foreground">
                    {format(messages.teacher.deliverySummary, {
                      missions: summary.missions,
                      demonstrated: summary.demonstrated,
                      correct: summary.predictions.correct,
                      total: summary.predictions.total,
                    })}
                  </p>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Dialog>
  )
}
