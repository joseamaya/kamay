import { expect, test } from '@playwright/test'

test('adds an object and reflects it in the code view', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()

  await expect(page.getByRole('button', { name: 'circle1', exact: true })).toBeVisible()
  await expect(page.locator('pre')).toContainText('circle1 = Circle("circle1")')
  await expect(page.locator('pre')).toContainText('from Circle import Circle')
})

test('shows every generated file and switches tabs', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()

  await page.getByRole('tab', { name: 'Circle.py' }).click()
  await expect(page.locator('pre')).toContainText('class Circle(Actor):')

  await page.getByRole('tab', { name: 'principal.py' }).click()
  await expect(page.locator('pre')).toContainText('circle1 = Circle("circle1")')
})

test('adds an action and reflects it in the code view', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()
  await page.getByLabel('Mensaje').fill('hola')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await expect(page.locator('pre')).toContainText('circle1.decir("hola")')
})

test('warns before discarding unsaved changes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'Nuevo' }).click()

  await expect(page.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('button', { name: 'circle1', exact: true })).toHaveCount(0)
})

test('saves and reopens a project from local storage', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Cuadrado al escenario' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Proyecto guardado.')).toBeVisible()
  await page.getByRole('button', { name: 'Nuevo' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Abrir' }).click()
  await page.getByRole('button', { name: 'Proyecto sin título' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toBeVisible()
})
