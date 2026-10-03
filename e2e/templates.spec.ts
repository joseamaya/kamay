import { expect, test } from '@playwright/test'

import { codeContent } from './helpers'

test('loads a template and shows its generated code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Plantillas' }).click()
  await page.getByRole('button', { name: /Mi clase/ }).click()

  await expect(page.getByRole('button', { name: 'Editar Heroe' })).toBeVisible()
  await expect(codeContent(page)).toContainText('heroe1 = Heroe("heroe1")')
})
