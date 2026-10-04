import { expect, test } from '@playwright/test'

test('welcomes a first-time student and remembers it', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('¡Bienvenido a Kamay!')).toBeVisible()
  await expect(page.getByText('Selecciónalo para ver qué puede hacer.')).toBeVisible()

  await page.getByRole('button', { name: '¡Empecemos!' }).click()

  await expect(page.getByText('¡Bienvenido a Kamay!')).toHaveCount(0)
  await expect(page.getByText('Tu escenario está listo.')).toBeVisible()

  await page.reload()
  await expect(page.getByText('¡Bienvenido a Kamay!')).toHaveCount(0)
  await expect(page.getByText('Tu escenario está listo.')).toBeVisible()
})
