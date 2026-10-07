import { expect, test } from './fixtures'

import { openMenu } from './helpers'

test.use({ colorScheme: 'light' })

test('toggles between light and dark themes and remembers it', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  await openMenu(page, 'Ver')
  await page.getByRole('menuitem', { name: 'Tema: Oscuro' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('changes the text size', async ({ page }) => {
  await page.goto('/')

  await openMenu(page, 'Ver')
  await page.getByRole('menuitem', { name: 'Texto: Grande' }).click()

  await expect(page.locator('html')).toHaveAttribute('style', /font-size: 112\.5%/)
})

test('toggles projector mode with larger, high-contrast text', async ({ page }) => {
  await page.goto('/')

  await openMenu(page, 'Ver')
  const toggle = page.getByRole('menuitem', { name: 'Proyector' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await toggle.click()

  await expect(page.locator('html')).toHaveClass(/projector/)
  await expect(page.locator('html')).toHaveAttribute('style', /font-size: 150%/)

  await openMenu(page, 'Ver')
  await expect(page.getByRole('menuitem', { name: 'Proyector' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('moves the selected object with the keyboard', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()

  const overlay = page.locator('[data-selection-overlay]')
  await page.getByRole('application', { name: /Escenario/ }).focus()
  await page.keyboard.press('ArrowRight')

  await expect(overlay).toHaveAttribute('data-simulation', /"x":4/)
})

test('exposes a live status region for activity and errors', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('status')).toBeVisible()
})
