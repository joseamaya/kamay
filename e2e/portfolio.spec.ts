import { expect, test } from './fixtures'

import { codeContent } from './helpers'

test('renames the project and reflects it in the code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Renombrar proyecto' }).click()
  const dialog = page.getByRole('dialog', { name: 'Renombrar proyecto' })
  await dialog.getByLabel('Nombre del proyecto').fill('Mi juego')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await expect(codeContent(page)).toContainText('# Proyecto: Mi juego')
})

test('lists saved projects in the portfolio with export and delete', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Proyecto guardado.')).toBeVisible()

  await page.getByRole('button', { name: 'Portafolio' }).click()
  const dialog = page.getByRole('dialog', { name: 'Portafolio' })

  await expect(dialog.getByRole('button', { name: /^Proyecto sin título/ })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Exportar' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Eliminar Proyecto sin título' })).toBeVisible()
})

test('delivers the project as a bundle', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Entregar' }).click(),
  ])

  expect(download.suggestedFilename()).toContain('entrega')
})
