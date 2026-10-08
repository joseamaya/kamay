import { expect, test } from './fixtures'

test('links an inspector member to its line in the code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()

  const inspector = page.locator('[data-inspector]')
  await inspector.getByRole('button', { name: 'Ver moverse en el código' }).click()

  await expect(page.getByText('Vehiculo.py', { exact: true })).toBeVisible()
  await expect(page.locator('.cm-kamay-highlight').first()).toBeVisible()
})

test('selects the object whose line is clicked in the code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro2', exact: true }).click()

  const inspector = page.locator('[data-inspector]')
  await expect(inspector).toContainText('carro2')

  await page.locator('.cm-line', { hasText: 'carro1 = Carro' }).click()
  await expect(inspector).toContainText('carro1')
})
