import { expect, test } from './fixtures'

import { codeContent } from './helpers'

test.use({ colorScheme: 'light' })

test('toggles between light and dark themes and remembers it', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Cambiar tema' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('changes the text size', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Tamaño de texto').selectOption('large')

  await expect(page.locator('html')).toHaveAttribute('style', /font-size: 112\.5%/)
})

test('toggles projector mode with larger, high-contrast text', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: 'Proyector' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await toggle.click()

  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveClass(/projector/)
  await expect(page.locator('html')).toHaveAttribute('style', /font-size: 150%/)
})

test('moves the selected object with the keyboard', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()

  await page.getByRole('application', { name: /Escenario/ }).focus()
  await page.keyboard.press('ArrowRight')

  await expect(codeContent(page)).toContainText('circle1.x = 4')
})

test('exposes a live status region for activity and errors', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('status')).toBeVisible()
})
