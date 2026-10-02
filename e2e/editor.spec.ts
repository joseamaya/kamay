import { expect, test } from '@playwright/test'

test('adds an object and reflects it in the code view', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()

  await expect(page.getByRole('button', { name: 'circle1', exact: true })).toBeVisible()
  await expect(page.locator('pre')).toContainText('circle1 = Circle()')
  await expect(page.locator('pre')).toContainText('from Circle import Circle')
})

test('saves and reopens a project from local storage', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Cuadrado al escenario' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.getByRole('button', { name: 'Nuevo' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Abrir' }).click()
  await page.getByRole('button', { name: 'Proyecto sin título' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toBeVisible()
})
