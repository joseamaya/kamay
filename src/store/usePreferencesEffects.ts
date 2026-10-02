import { useEffect } from 'react'

import { FONT_SCALE_PERCENT, usePreferencesStore } from './preferencesStore'

/** Applies the accessibility preferences to the document root. */
export function usePreferencesEffects(): void {
  const theme = usePreferencesStore((state) => state.theme)
  const fontScale = usePreferencesStore((state) => state.fontScale)
  const reducedMotion = usePreferencesStore((state) => state.reducedMotion)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.fontSize = `${FONT_SCALE_PERCENT[fontScale]}%`
    root.dataset.reducedMotion = reducedMotion ? 'true' : 'false'
  }, [theme, fontScale, reducedMotion])
}
