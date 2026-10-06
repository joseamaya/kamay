import { expect, test } from './fixtures'

test('simulates a block-only project without Pyodide', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('prender')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()

  // The inherited `prender` method ran and flipped `encendido` to true, which
  // activates the `Vehiculo` "Prendido" visual variant.
  await expect(page.locator('[data-state-panel]')).toContainText('carro1.encendido')
})

test('drives movement and speech from state', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Orden' }).selectOption('moverse')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('combobox', { name: 'Orden' }).selectOption('tocar_bocina')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()

  // `moverse` adds to `x` and `tocar_bocina` sets `mensaje`; the engine turns
  // those state changes into movement and a speech bubble.
  const panel = page.locator('[data-state-panel]')
  await expect(panel).toContainText('carro1.x')
  await expect(panel).toContainText('carro1.mensaje')
})
