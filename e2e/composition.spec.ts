import { expect, test } from './fixtures'

import { codeContent, openSidebar } from './helpers'

test('composes a class from another class', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  let dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Bateria')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Robot')
  await dialog.getByRole('button', { name: 'Agregar componente' }).click()
  await page.getByLabel('Nombre del componente').fill('bateria')
  await page.getByLabel('Clase del componente').selectOption('Bateria')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Robot' }).click()
  await openSidebar(page, 'Proyecto')
  await page.getByRole('button', { name: 'Robot.py' }).click()

  await expect(codeContent(page)).toContainText('from Bateria import Bateria')
  await expect(codeContent(page)).toContainText('self.bateria = Bateria("bateria")')
})
