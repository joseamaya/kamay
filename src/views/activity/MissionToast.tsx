import { useEffect } from 'react'

import { getMessages } from '../../i18n'
import { useEditorStore } from '../../store'

const TOAST_MS = 4000

export function MissionToast() {
  const messages = getMessages()
  const toast = useEditorStore((state) => state.toast)
  const hideToast = useEditorStore((state) => state.hideToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(hideToast, TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [toast, hideToast])

  if (!toast) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4"
    >
      <div className="kamay-toast border-border bg-card text-card-foreground flex items-center gap-3 rounded-full border px-4 py-2 shadow-lg">
        <span className="bg-primary text-primary-foreground flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-bold">
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold">{messages.missions.completedToast}</p>
          <p className="text-muted-foreground text-xs">{toast}</p>
        </div>
      </div>
    </div>
  )
}
