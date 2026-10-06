import { expect, test } from './fixtures'

test('edits values directly in the generated code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('vida')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
  await page.getByRole('button', { name: 'Editar valores' }).click()

  const vida = page.locator('.cm-kamay-value[aria-label="vida"]')
  await expect(async () => {
    await vida.fill('40')
    await vida.press('Enter')
    await expect(
      page.locator('[data-selection-overlay]').getByRole('spinbutton', { name: 'vida' }),
    ).toHaveValue('40', { timeout: 1000 })
  }).toPass({ timeout: 10000 })
})
