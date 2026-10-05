import { useEffect } from 'react'

import { format, getMessages } from '../../i18n'
import type { ClassDefinition, Scene } from '../../model'
import { detectMisconceptions } from '../../pedagogy'
import { usePredictionStore } from '../../store'

export interface MisconceptionNoticeProps {
  scene: Scene
  definition: ClassDefinition
}

export function MisconceptionNotice({ scene, definition }: MisconceptionNoticeProps) {
  const messages = getMessages()
  const note = usePredictionStore((state) => state.note)
  const ids = detectMisconceptions(scene, definition)
  const signature = ids.join('|')

  useEffect(() => {
    for (const id of signature ? (signature.split('|') as typeof ids) : []) note(id)
  }, [signature, note])

  if (ids.length === 0) return null

  return (
    <div className="border-border bg-muted/50 flex flex-col gap-1 rounded-md border p-2">
      {ids.map((id) => {
        const info = messages.pedagogy.misconceptions[id]
        return (
          <p key={id} className="text-xs">
            <span className="text-foreground font-medium">{info.title}: </span>
            <span className="text-muted-foreground">
              {format(info.description, { name: definition.name })}
            </span>
          </p>
        )
      })}
    </div>
  )
}
