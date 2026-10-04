import { test as base, expect } from '@playwright/test'

/**
 * Most specs exercise full-featured views, so they start in free mode. The
 * guided level progression is covered by `levels.spec.ts`, which uses the base
 * `test` from `@playwright/test`.
 */
export const test = base.extend({
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'kamay.progress',
        JSON.stringify({
          completed: [],
          freeMode: true,
          unlockedLevel: 1,
          onboardingDone: true,
        }),
      )
    })
    await run(page)
  },
})

export { expect }
