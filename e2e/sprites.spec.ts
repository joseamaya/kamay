import { expect, test } from '@playwright/test'

import { codeContent } from './helpers'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('uploads a sprite for a class without polluting the generated code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await page
    .getByLabel('Subir imagen')
    .setInputFiles({ name: 'sprite.png', mimeType: 'image/png', buffer: PNG })

  await expect(dialog.getByRole('img', { name: 'Vista previa de la imagen' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()

  await expect(codeContent(page)).toContainText('heroe1 = Heroe("heroe1")')
  await expect(codeContent(page)).not.toContainText('data:image')
})

test('selects a themed world', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Fondo').selectOption('space')

  await expect(page.getByLabel('Fondo')).toHaveValue('space')
})
