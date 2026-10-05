import { expect, test } from './fixtures'

test('simulates a block-only project without Pyodide', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('prender')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()

  // The inherited `prender` method ran and flipped `encendido` to true.
  await expect(page.locator('[data-state-panel]')).toContainText('carro1.encendido')
})
