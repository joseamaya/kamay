import { expect, test } from '@playwright/test'

test('offers a clear way to create a class at level 3', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kamay.progress',
      JSON.stringify({ completed: [], freeMode: false, unlockedLevel: 3, onboardingDone: true }),
    )
  })

  await page.goto('/')

  const create = page.getByRole('button', { name: 'Crear mi primera clase' })
  await expect(create).toBeVisible()
  await create.click()
  await expect(page.getByRole('dialog', { name: 'Nueva clase' })).toBeVisible()
})

test('marks level-locked missions in the missions dialog', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kamay.progress',
      JSON.stringify({ completed: [], freeMode: false, unlockedLevel: 1, onboardingDone: true }),
    )
  })

  await page.goto('/')

  await page.getByRole('button', { name: /Misiones/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Misiones' })
  await expect(dialog.getByText('Se desbloquea en el Nivel 3.').first()).toBeVisible()
})
