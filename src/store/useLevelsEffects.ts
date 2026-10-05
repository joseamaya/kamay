import { useEffect, useRef } from 'react'

import { levelFromMissions, requiredLevel } from '../levels'
import { useEditorStore } from './editorStore'
import { useProgressStore } from './progressStore'
import { useProjectStore } from './store'

/** Raises the unlocked level from completed missions and the loaded project. */
export function useLevelsEffects(): void {
  const project = useProjectStore((state) => state.project)
  const completed = useProgressStore((state) => state.completed)
  const unlockedLevel = useProgressStore((state) => state.unlockedLevel)
  const freeMode = useProgressStore((state) => state.freeMode)
  const setUnlockedLevel = useProgressStore((state) => state.setUnlockedLevel)
  const showToast = useEditorStore((state) => state.showToast)
  const initialized = useRef(false)

  useEffect(() => {
    const target = Math.max(unlockedLevel, levelFromMissions(completed), requiredLevel(project))
    if (target > unlockedLevel) {
      setUnlockedLevel(target)
      if (initialized.current && !freeMode) showToast({ kind: 'level', level: target })
    }
    initialized.current = true
  }, [project, completed, unlockedLevel, freeMode, setUnlockedLevel, showToast])
}
