import { expect, test } from './fixtures'
import { codeContent } from './helpers'

test('edits values directly in the generated code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByLabel('Mensaje').fill('hola')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await expect(codeContent(page)).toContainText('carro1.decir("hola")')

  await page.getByRole('button', { name: 'Editar valores' }).click()

  const message = page.locator('.cm-kamay-value[aria-label="mensaje"]')
  await expect(message).toBeVisible()

  await expect(async () => {
    await message.fill('adios')
    await message.press('Enter')
    await expect(page.locator('code', { hasText: 'decir(adios)' })).toBeVisible({
      timeout: 1000,
    })
  }).toPass({ timeout: 10000 })

  const x = page.locator('.cm-kamay-value[aria-label="x"]')
  await expect(async () => {
    await x.fill('25')
    await x.press('Enter')
    await expect(page.getByRole('spinbutton', { name: 'X' })).toHaveValue('25', {
      timeout: 1000,
    })
  }).toPass({ timeout: 10000 })
})
