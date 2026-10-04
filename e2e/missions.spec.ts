import { expect, test } from './fixtures'

test('completes a mission and shows it in the missions dialog', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Misiones 0/11' }).click()
  const dialog = page.getByRole('dialog', { name: 'Misiones' })
  await expect(dialog.getByText('0 / 11')).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancelar' }).click()

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()

  await expect(page.getByText('¡Misión completada: Pon algo en el escenario!')).toBeVisible()
  await expect(page.getByText('¡Misión completada!', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Misiones 1/11' }).click()
  await expect(page.getByRole('dialog', { name: 'Misiones' }).getByText('1 / 11')).toBeVisible()
})
