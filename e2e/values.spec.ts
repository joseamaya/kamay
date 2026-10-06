import { expect, test } from './fixtures'

test('edits values directly in the generated code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('button', { name: 'Editar valores' }).click()

  const x = page.locator('.cm-kamay-value[aria-label="x"]')
  await expect(async () => {
    await x.fill('25')
    await x.press('Enter')
    await expect(page.getByRole('spinbutton', { name: 'X' })).toHaveValue('25', {
      timeout: 1000,
    })
  }).toPass({ timeout: 10000 })
})
