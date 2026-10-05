import { expect, test } from './fixtures'

import { openMore } from './helpers'

test('shows the concept rubric from the toolbar menu', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()

  await openMore(page)
  await page.getByRole('menuitem', { name: 'Rúbrica' }).click()

  const dialog = page.getByRole('dialog', { name: 'Rúbrica' })
  await expect(dialog.getByText('Objetos', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Practicado', { exact: true })).toBeVisible()
})
