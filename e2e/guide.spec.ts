import { expect, test } from '@playwright/test'

test('guides to a reachable mission instead of a locked one', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kamay.progress',
      JSON.stringify({
        completed: [
          'first_object',
          'give_order',
          'say_hello',
          'move_it',
          'own_class',
          'own_attribute',
          'own_method',
          'two_instances',
        ],
        freeMode: false,
        unlockedLevel: 4,
        onboardingDone: true,
      }),
    )
  })

  await page.goto('/')

  await expect(page.getByText('Escribe código')).toBeVisible()
  await expect(page.getByText('Siguiente misión: Escribe tu método')).toBeVisible()
  await expect(page.getByText('Siguiente misión: Hereda')).toHaveCount(0)
})
