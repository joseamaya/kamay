import { useEffect } from 'react'

import { levelFromMissions, requiredLevel } from '../levels'
import { useProgressStore } from './progressStore'
import { useProjectStore } from './store'

/** Raises the unlocked level from completed missions and the loaded project. */
export function useLevelsEffects(): void {
  const project = useProjectStore((state) => state.project)
  const completed = useProgressStore((state) => state.completed)
  const unlockedLevel = useProgressStore((state) => state.unlockedLevel)
  const setUnlockedLevel = useProgressStore((state) => state.setUnlockedLevel)

  useEffect(() => {
    const target = Math.max(unlockedLevel, levelFromMissions(completed), requiredLevel(project))
    if (target > unlockedLevel) setUnlockedLevel(target)
  }, [project, completed, unlockedLevel, setUnlockedLevel])
}
