import { useState } from 'react'

import { format, getMessages } from '../../i18n'
import { missionLevel } from '../../levels'
import { BADGES, completedBadges, MISSIONS } from '../../missions'
import type { MissionId } from '../../missions'
import { revealNext } from '../../pedagogy'
import { useEvidenceStore, useLevel, useProgressStore } from '../../store'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { Dialog } from '../../ui/Dialog'

export interface MissionsDialogProps {
  open: boolean
  onClose: () => void
}

export function MissionsDialog({ open, onClose }: MissionsDialogProps) {
  const messages = getMessages()
  const completed = useProgressStore((state) => state.completed)
  const freeMode = useProgressStore((state) => state.freeMode)
  const reset = useProgressStore((state) => state.reset)
  const resetEvidence = useEvidenceStore((state) => state.reset)
  const level = useLevel()
  const unlocked = completedBadges(completed)
  const [revealed, setRevealed] = useState<Record<string, number>>({})

  const revealHint = (id: MissionId) =>
    setRevealed((current) => ({ ...current, [id]: revealNext(current[id] ?? 0) }))

  return (
    <Dialog
      open={open}
      title={messages.missions.title}
      confirmLabel={messages.dialog.accept}
      cancelLabel={messages.dialog.cancel}
      panelClassName="max-w-lg"
      onCancel={onClose}
      onConfirm={onClose}
    >
      <p className="text-foreground mb-3 font-medium">
        {completed.length} / {MISSIONS.length}
      </p>

      <h3 className="text-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {messages.missions.badgesTitle}
      </h3>
      <ul className="mb-4 flex flex-wrap gap-2">
        {BADGES.map((badge) => {
          const isUnlocked = unlocked.includes(badge.id)
          const label = messages.missions.badges[badge.id]
          return (
            <li
              key={badge.id}
              aria-label={`${label.title}: ${isUnlocked ? messages.missions.unlocked : messages.missions.locked}`}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-1 text-xs',
                isUnlocked
                  ? 'border-primary bg-secondary text-foreground'
                  : 'border-border text-muted-foreground opacity-60',
              )}
            >
              <span aria-hidden="true">{isUnlocked ? '★' : '☆'}</span>
              {label.title}
            </li>
          )
        })}
      </ul>

      <ul className="flex flex-col gap-3">
        {BADGES.map((badge) => (
          <li key={badge.id}>
            <h4 className="text-foreground text-sm font-semibold">
              {messages.missions.badges[badge.id].title}
            </h4>
            <ul className="mt-1 flex flex-col gap-1">
              {badge.missions.map((id) => {
                const done = completed.includes(id)
                const mission = messages.missions.list[id]
                const shown = revealed[id] ?? 0
                const requiredLevel = missionLevel(id)
                const locked = !freeMode && requiredLevel > level
                return (
                  <li key={id} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        done ? 'text-primary' : 'text-muted-foreground',
                        locked && 'opacity-60',
                      )}
                    >
                      {done ? '✓' : locked ? '🔒' : '○'}
                    </span>
                    <span className="flex flex-col">
                      <span
                        className={cn(
                          'block',
                          done ? 'text-foreground' : 'text-muted-foreground',
                          locked && 'opacity-60',
                        )}
                      >
                        {mission.title}
                      </span>
                      <span className="text-xs">{mission.description}</span>
                      {locked ? (
                        <span className="text-muted-foreground mt-1 text-xs">
                          {format(messages.levels.lockedHint, { level: requiredLevel })}
                        </span>
                      ) : !done ? (
                        <span className="mt-1 flex flex-col gap-1">
                          {shown < mission.hints.length ? (
                            <button
                              type="button"
                              onClick={() => revealHint(id)}
                              className="text-primary self-start text-xs hover:underline"
                            >
                              {messages.missions.hint}
                            </button>
                          ) : null}
                          {mission.hints.slice(0, shown).map((hint) => (
                            <span key={hint} className="text-muted-foreground text-xs">
                              {hint}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            reset()
            resetEvidence()
          }}
        >
          {messages.missions.reset}
        </Button>
      </div>
    </Dialog>
  )
}
